#!/usr/bin/env python3
"""
Headless renderer for the FoxDot pieces in this repository.

foxdot-music-synthesis normally needs a sound card: FoxDot (Python) talks to
sclang, which boots scsynth, which needs a real audio device.  This script
removes the sound card from the equation:

    jackd -d dummy      a *real-time paced* virtual sound card (JACK dummy driver)
    scsynth             the real FoxDot synthesis engine
    sclang              registers FoxDot's OSCFuncs + compiles every SynthDef
    FoxDot (Python)     executes the *unmodified* piece file
    Server.record()     SuperCollider writes the WAV itself, from its own output bus
    ffmpeg              trims to the exact length, fades the ends, encodes .mp3/.ogg

Typical use (inside the container, see Dockerfile / docker-compose.yml):

    python3 render.py --piece pieces/almost_done.py --bars 32

Notes
-----
* `Buffer.read()` in FoxDot's osc/Buffers.scd contains absolute paths from the
  machine of FoxDot's author (``C:/Users/Ryan/...``).  They are rewritten to the
  installed package's ``snd/`` directory here, and entries whose sample file no
  longer ships with FoxDot are dropped (they would only produce SC errors).
* sclang is a Qt application, so the image pins QT_QPA_PLATFORM=offscreen and
  QTWEBENGINE_DISABLE_SANDBOX=1 to make it run without an X server.
"""

from __future__ import annotations

import argparse
import glob
import importlib.util
import os
import re
import shutil
import subprocess
import sys
import time

# --------------------------------------------------------------------------- #
# constants
# --------------------------------------------------------------------------- #

#: Prefix that FoxDot's bundled osc/Buffers.scd hardcodes for every sample.
WINDOWS_SND_PREFIX = "C:/Users/Ryan/Documents/GitHub/FoxDot/FoxDot/snd/"

DEFAULT_SAMPLE_RATE = 44100
DEFAULT_BLOCK_SIZE = 128
DEFAULT_BITS = 24
DEFAULT_BPM = 120.0      # FoxDot's TempoClock default
DEFAULT_METER = (4, 4)   # FoxDot's TempoClock default -> one bar == 4 beats


def log(msg: str) -> None:
    print("[render] %s" % msg, flush=True)


def fail(msg: str, code: int = 1) -> "None":
    print("[render] ERROR: %s" % msg, file=sys.stderr, flush=True)
    sys.exit(code)


# --------------------------------------------------------------------------- #
# locating the FoxDot package *without* importing it
# --------------------------------------------------------------------------- #
# Importing FoxDot starts its TempoClock thread and opens the OSC connection to
# sclang, so this must happen only once sclang is already up.  find_spec() only
# looks the package up, it never executes FoxDot/__init__.py.

def foxdot_root() -> str:
    spec = importlib.util.find_spec("FoxDot")
    if spec is None or not spec.origin:
        fail("FoxDot is not installed. Run this inside the foxdot-music-synthesis image.")
    root = os.path.dirname(os.path.realpath(spec.origin))
    if not os.path.isdir(os.path.join(root, "osc", "scsyndef")):
        fail("FoxDot package at %s looks incomplete (no osc/scsyndef)." % root)
    return root


# --------------------------------------------------------------------------- #
# SuperCollider source generation
# --------------------------------------------------------------------------- #

def _sc_string(value: str) -> str:
    """Escape a python string so it is a valid SuperCollider string literal."""
    return value.replace("\\", "\\\\").replace('"', '\\"')


def build_buffers_scd(root: str, dest: str):
    """Rewrite osc/Buffers.scd so the absolute paths point at this install."""
    src = os.path.join(root, "osc", "Buffers.scd")
    snd_dir = os.path.join(root, "snd")

    kept = dropped = 0
    out = []
    with open(src, "r", encoding="utf-8") as fh:
        for line in fh:
            m = re.search(
                r'Buffer\.read\(\s*s\s*,\s*"(?P<path>[^"]+)"\s*(?:,\s*bufnum:\s*(?P<bufnum>\d+)\s*)?\)',
                line,
            )
            if not m:
                out.append(line)
                continue

            path = m.group("path")
            if path.startswith(WINDOWS_SND_PREFIX):
                path = os.path.join(snd_dir, path[len(WINDOWS_SND_PREFIX):])

            if os.path.isfile(path):
                bufnum = m.group("bufnum")
                tail = ", bufnum: %s" % bufnum if bufnum else ""
                out.append('Buffer.read(s, "%s"%s);' % (_sc_string(path), tail))
                kept += 1
            else:
                # Sample no longer ships with FoxDot - referencing it would only
                # spam the SC console with "could not open file" errors.
                dropped += 1

    with open(dest, "w", encoding="utf-8") as fh:
        fh.write("\n".join(out))

    log("buffers.scd: %d samples resolved, %d stale entries dropped" % (kept, dropped))
    return kept, dropped


def find_scd(directory: str, name: str):
    """Return the real path of an .scd file inside `directory`.

    FoxDot's Settings hardcode ``osc/OSCFunc.scd`` while the file that actually
    ships is ``osc/OscFunc.scd`` - fine on a case-insensitive filesystem (macOS),
    silently missing on a case-sensitive one (Linux/containers).
    """
    candidate = os.path.join(directory, name)
    if os.path.isfile(candidate):
        return candidate
    wanted = name.lower()
    for entry in sorted(os.listdir(directory)):
        if entry.lower() == wanted and os.path.isfile(os.path.join(directory, entry)):
            return os.path.join(directory, entry)
    return None


def scd_sources(root: str, buffers_scd: str):
    """The .scd files the server needs, in the order FoxDot itself loads them."""
    osc = os.path.join(root, "osc")
    files = [
        find_scd(osc, "OSCFunc.scd"),     # /foxdot  -> interpret a .scd file
        find_scd(osc, "Info.scd"),        # /foxdot/info  <- FoxDot's getInfo()
        find_scd(osc, "Record.scd"),      # /foxdot-record <- FoxDot's recorder
        buffers_scd,                      # samples -> buffers
    ]
    for sub in ("scsyndef", "sceffects"):  # SynthDefs, then effect SynthDefs
        directory = os.path.join(osc, sub)
        files += [os.path.join(directory, f) for f in sorted(os.listdir(directory))]
    return [f for f in files if f and os.path.isfile(f)]


def build_startup_scd(root: str, buffers_scd: str, dest: str, ready_path: str,
                      done_path: str, raw_wav: str, sample_rate: int,
                      block_size: int, bits: int, play_seconds: float) -> None:
    """Compose the Routine that boots the server, loads the FoxDot SynthDefs,
    records and then stops again.

    Every .scd file is handed to ``String.interpret`` *one by one* rather than
    being pasted into the Routine body: the SynthDef files are wrapped in their
    own ``( ... )`` group, and two such groups separated by nothing but blank
    lines get parsed as a SuperCollider message send (``(...)( ...``), which
    fails to compile.  Interpreting them separately is exactly what FoxDot's
    own ``/foxdot`` OSCFunc does.

    The recorder is armed and stopped *from sclang itself*.  Driving it over
    OSC from Python was tried first and is unreliable in a container: FoxDot's
    OSC client resolves ``ADDRESS`` (``localhost``) from ``conf.txt``, which
    may be ``::1`` while sclang only listens on IPv4, so messages are silently
    dropped by UDP, and even a message that does arrive can see
    ``Server.default.serverRunning == false``.  The Routine always knows the
    truth, so it owns the whole recording lifecycle instead.
    """
    files = scd_sources(root, buffers_scd)

    literal = "\n".join('        "%s",' % _sc_string(f) for f in files)

    template = """\
// Generated by render.py - boots the FoxDot server, loads its SynthDefs and
// records one pass of the piece into {raw}.
Routine.run {{
    // SuperCollider requires every `var` to be declared before any statement
    // of the block it belongs to.
    var files = [
{literal}
    ];
    var raw = "{raw}";
    var readyPath = "{ready}";
    var donePath = "{done}";

    s.options.blockSize = {block_size};
    s.options.sampleRate = {sample_rate};
    s.options.numInputBusChannels = 2;
    s.options.numOutputBusChannels = 2;
    s.options.memSize = 131072;
    s.bootSync();
    s.recorder.recHeaderFormat = "WAV";
    s.recorder.recSampleFormat = "int{bits}";

    files.do {{ arg fn;
        ("[foxdot] loading " ++ fn.asString.basename).postln;
        {{
            var f = File(fn, "r");
            if (f.isOpen.not) {{
                ("[foxdot] CANNOT OPEN " ++ fn).postln;
            }} {{
                f.readAllString.interpret;
                f.close;
            }};
        }}.try;
    }};

    // Everything above was sent asynchronously: wait until the server has
    // really consumed it before recording anything.
    s.sync;

    ("[render] arming recorder -> " ++ raw).postln;
    s.record(raw);
    s.sync;

    // NB: File(path, "w") *creates* the file right away, so the marker is only
    // opened at the moment it is written - Python polls for it to appear.
    File.use(readyPath, "w", {{ |f| f.write("ready") }});
    " * FoxDot server ready, recorder armed * ".postln;

    // Record for the length of the piece plus a little slack, so the last
    // note's release tail is captured as well.
    {play}.wait;

    ("[render] stopping recorder").postln;
    s.stopRecording;
    s.sync;

    File.use(donePath, "w", {{ |f| f.write("stopped") }});
    " * recording complete * ".postln;

    // Keep sclang alive: it has to stay around to receive FoxDot's OSC messages.
    {keepalive}.wait;
}};
""".format(raw=_sc_string(raw_wav), ready=_sc_string(ready_path),
           done=_sc_string(done_path), block_size=block_size,
           sample_rate=sample_rate, bits=bits, literal=literal,
           play=play_seconds, keepalive=24 * 3600)

    with open(dest, "w", encoding="utf-8") as fh:
        fh.write(template)
    log("startup.scd: %d SuperCollider files, recording %.1f s" % (len(files), play_seconds))


# --------------------------------------------------------------------------- #
# jackd + sclang
# --------------------------------------------------------------------------- #

def start_jack(sample_rate: int, block_size: int, log_path: str):
    """Boot the JACK dummy driver - a real-time paced virtual sound card."""
    wait_usecs = max(1000, int(round(1_000_000.0 * block_size / sample_rate)))
    cmd = [
        "jackd", "-d", "dummy",
        "-r", str(sample_rate),
        "-p", str(block_size),
        "-C", "0",
        "-P", "2",
        "-w", str(wait_usecs),
    ]
    log("starting jackd: %s" % " ".join(cmd))
    logfile = open(log_path, "w")
    proc = subprocess.Popen(cmd, stdout=logfile, stderr=subprocess.STDOUT)

    # The dummy driver is ready once it publishes its shared-memory registry.
    deadline = time.time() + 20
    while time.time() < deadline:
        if proc.poll() is not None:
            fail("jackd exited immediately (rc=%s); see %s" % (proc.returncode, log_path))
        shm = glob.glob("/dev/shm/jack*")
        if shm:
            log("jackd is up (pid %s)" % proc.pid)
            return proc
        time.sleep(0.25)

    log("WARNING: no /dev/shm/jack* marker seen; continuing and hoping for the best")
    return proc


def start_sclang(root: str, startup_scd: str, log_path: str, ready_path: str):
    """Boot sclang with the generated startup file and wait for FOXDOT_READY."""
    if os.path.exists(ready_path):
        os.remove(ready_path)

    env = dict(os.environ)
    # sclang is a Qt app: run it without an X server.
    env.setdefault("QT_QPA_PLATFORM", "offscreen")
    env.setdefault("QTWEBENGINE_DISABLE_SANDBOX", "1")
    env.setdefault("QTWEBENGINE_CHROMIUM_FLAGS", "--disable-gpu --single-process")

    log("booting sclang (compiling every FoxDot SynthDef, this takes a moment)")
    # stdbuf keeps the log line buffered so failures are readable while running.
    proc = subprocess.Popen(["stdbuf", "-oL", "-eL", "sclang", "-D", startup_scd],
                            cwd=root, env=env,
                            stdout=open(log_path, "w"),
                            stderr=subprocess.STDOUT)
    try:
        deadline = time.time() + 300
        while time.time() < deadline:
            if os.path.exists(ready_path):
                log("sclang ready (pid %s)" % proc.pid)
                return proc
            if proc.poll() is not None:
                fail("sclang exited with rc=%s; see %s" % (proc.returncode, log_path))
            time.sleep(0.2)
        fail("timed out waiting for FoxDot's SuperCollider server; see %s" % log_path)
    except BaseException:
        proc.kill()
        raise


def stop(proc, name, log_path):
    if proc is None or proc.poll() is not None:
        return
    log("stopping %s" % name)
    proc.terminate()
    try:
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait(timeout=10)


# --------------------------------------------------------------------------- #
# the piece
# --------------------------------------------------------------------------- #

def import_foxdot_into(namespace: dict) -> None:
    """The equivalent of ``from FoxDot import *``, callable from a function.

    (Python only allows ``import *`` at module level, and importing FoxDot has to
    be deferred until sclang is listening.)
    """
    import FoxDot
    for name, value in vars(FoxDot).items():
        if not name.startswith("_"):
            namespace[name] = value


def load_piece(path: str, namespace: dict):
    """Execute a piece file the same way the FoxDot editor would.

    ``Go()`` is FoxDot's "keep the session alive" loop::

        while 1:
            time.sleep(100)

    It only exists so a live-coding session does not exit - the TempoClock
    thread is already running - so it is replaced by a no-op.  It has to be
    patched on the FoxDot *module*, not just in the namespace we exec into,
    because every piece starts with ``from FoxDot import *`` and that would
    re-bind `Go` back to the blocking version.
    """
    import FoxDot
    FoxDot.Go = lambda: None

    with open(path, "r", encoding="utf-8") as fh:
        source = fh.read()
    namespace["Go"] = FoxDot.Go
    code = compile(source, os.path.abspath(path), "exec")
    exec(code, namespace)  # noqa: S102 - executing the user's own piece is the point
    return namespace


def piece_duration(bars: int, bpm: float, meter) -> float:
    beats_per_bar = (float(meter[0]) / float(meter[1])) * 4.0
    return bars * beats_per_bar * (60.0 / bpm)


# --------------------------------------------------------------------------- #
# ffmpeg post-processing
# --------------------------------------------------------------------------- #

def run(cmd, what):
    log("ffmpeg %s: %s" % (what, " ".join(cmd)))
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if res.returncode != 0:
        fail("%s failed:\n%s" % (what, res.stdout.decode("utf-8", "replace")))
    return res


def encode(src: str, dest: str, duration: float, fade_out: float, offset: float,
           extra) -> None:
    """Trim to `duration` starting at `offset`, fade the ends, then encode."""
    fade_in = 0.02
    filters = [
        "afade=t=in:st=0:d=%.3f" % fade_in,
        "afade=t=out:st=%.3f:d=%.3f" % (max(0.0, duration - fade_out), fade_out),
    ]
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
           "-ss", "%.3f" % offset,
           "-t", "%.3f" % duration,
           "-i", src,
           "-af", ",".join(filters),
           "-map_metadata", "-1"] + extra + [dest]
    run(cmd, "-> %s (from %.3fs, %.2fs long)" % (os.path.basename(dest), offset, duration))


# --------------------------------------------------------------------------- #
# main
# --------------------------------------------------------------------------- #

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--piece", required=True, help="path to a FoxDot .py piece")
    ap.add_argument("--out", default="/work/audio", help="output directory")
    ap.add_argument("--name", default=None, help="basename for the rendered files")
    ap.add_argument("--bars", type=int, default=32, help="length in bars (default 32)")
    ap.add_argument("--bpm", type=float, default=DEFAULT_BPM)
    ap.add_argument("--meter", default="4/4", help='FoxDot meter, e.g. "3/4"')
    ap.add_argument("--samplerate", type=int, default=DEFAULT_SAMPLE_RATE)
    ap.add_argument("--blocksize", type=int, default=DEFAULT_BLOCK_SIZE)
    ap.add_argument("--bits", type=int, default=DEFAULT_BITS, choices=[16, 24, 32])
    ap.add_argument("--fade-out", type=float, default=2.0,
                    help="length of the fade-out at the end, in seconds")
    ap.add_argument("--formats", default="wav,mp3,ogg",
                    help="comma separated subset of wav,mp3,ogg")
    ap.add_argument("--keep-raw", action="store_true",
                    help="keep the untrimmed SuperCollider recording in --workdir")
    ap.add_argument("--workdir", default="/tmp/foxdot-render",
                    help="scratch directory for the .scd files and logs")
    args = ap.parse_args()

    piece = os.path.realpath(args.piece)
    if not os.path.isfile(piece):
        fail("piece not found: %s" % piece)
    if shutil.which("ffmpeg") is None:
        fail("ffmpeg is not installed")

    meter = tuple(int(x) for x in args.meter.split("/"))
    if len(meter) != 2:
        fail('--meter must look like "4/4"')

    name = args.name or os.path.splitext(os.path.basename(piece))[0]
    out_dir = os.path.realpath(args.out)
    work = os.path.realpath(args.workdir)
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(work, exist_ok=True)

    duration = piece_duration(args.bars, args.bpm, meter)
    formats = [f.strip().lower() for f in args.formats.split(",") if f.strip()]

    log("piece      : %s" % piece)
    log("length     : %d bars @ %g bpm in %s = %.2f s" % (args.bars, args.bpm, args.meter, duration))
    log("output     : %s/%s.*" % (out_dir, name))

    # ---- locate FoxDot, build the SuperCollider sources -------------------- #
    root = foxdot_root()
    buffers_scd = os.path.join(work, "Buffers.scd")
    startup_scd = os.path.join(work, "Startup.scd")
    ready_marker = os.path.join(work, "ready")
    done_marker = os.path.join(work, "recorded")
    jack_log = os.path.join(work, "jackd.log")
    sclang_log = os.path.join(work, "sclang.log")

    # The recorder runs for the piece plus a little slack, so the release tail
    # of the last note is captured too.
    play_seconds = duration + 3.0
    raw_wav = os.path.join(work, "%s.raw.wav" % name)

    build_buffers_scd(root, buffers_scd)
    build_startup_scd(root, buffers_scd, startup_scd, ready_marker, done_marker,
                      raw_wav, args.samplerate, args.blocksize, args.bits,
                      play_seconds)

    # ---- boot the engine --------------------------------------------------- #
    jack = start_jack(args.samplerate, args.blocksize, jack_log)
    sclang = None
    try:
        sclang = start_sclang(root, startup_scd, sclang_log, ready_marker)

        # The Routine arms the recorder right before dropping the marker, so
        # waiting for the recording file is waiting for "the clock is running".
        t_ready = time.time()
        deadline = t_ready + 60
        while not os.path.exists(raw_wav):
            if time.time() > deadline:
                fail("recorder never armed; see %s" % sclang_log)
            time.sleep(0.002)
        log("recorder armed after %.3f s" % (time.time() - t_ready))

        # FoxDot's namespace is *not* imported into ours: `from FoxDot import *`
        # also exports its two-character live-coding players, so it would
        # clobber this module's `os`, `re`, `time`, ...  The piece gets the
        # FoxDot namespace instead - exactly like the FoxDot editor would.
        foxdot_ns = {}
        import_foxdot_into(foxdot_ns)

        # ---- play the piece ------------------------------------------------ #
        log("playing %s for %.2f s" % (os.path.basename(piece), duration))
        t0 = time.time()
        load_piece(piece, foxdot_ns)
        exec_dt = time.time() - t0
        lead_in = t0 - t_ready

        end_at = t0 + duration
        while time.time() < end_at:
            time.sleep(min(0.25, max(0.0, end_at - time.time())))
        played = time.time() - t0

        # NB: deliberately no Server.quit() here.  FoxDot's quit() sends /quit
        # to scsynth when `booted` is set, which would stop the recorder (and
        # the whole engine) before the Routine in sclang has finished writing
        # the file.  sclang is torn down in the finally block instead.
        foxdot_ns["Clock"].clear()              # silence the players
        log("played %.2f s (piece evaluated in %.3f s, %.3f s lead-in)"
            % (played, exec_dt, lead_in))

        # ---- wait for the recorder to close the file ----------------------- #
        deadline = time.time() + play_seconds + 60
        while not os.path.exists(done_marker):
            if time.time() > deadline:
                fail("recording did not finish; see %s" % sclang_log)
            time.sleep(0.1)
        log("recording finished")
    finally:
        stop(sclang, "sclang", sclang_log)
        stop(jack, "jackd", jack_log)

    if not os.path.isfile(raw_wav) or os.path.getsize(raw_wav) < 1024:
        fail("recording is empty; see %s" % sclang_log)

    # ---- post-process ------------------------------------------------------ #
    # The trimmed/faded file is the deliverable when .wav was requested,
    # otherwise it is only an intermediate that feeds the lossy encoders.
    # The recording started `lead_in` seconds before the piece did, so the trim
    # starts there; that is also where the fade-in lands.
    wav_path = os.path.join(out_dir, "%s.wav" % name) if "wav" in formats \
        else os.path.join(work, "%s.trimmed.wav" % name)
    encode(raw_wav, wav_path, duration, args.fade_out, lead_in,
           ["-c:a", "pcm_s%dle" % args.bits])

    tags = ["-metadata", "title=%s" % name,
            "-metadata", "artist=FoxDot + SuperCollider",
            "-metadata", "album=foxdot-music-synthesis"]

    if "mp3" in formats:
        encode(wav_path, os.path.join(out_dir, "%s.mp3" % name), duration, args.fade_out, 0.0,
               ["-c:a", "libmp3lame", "-b:a", "192k", "-id3v2_version", "3"] + tags)

    if "ogg" in formats:
        encode(wav_path, os.path.join(out_dir, "%s.ogg" % name), duration, args.fade_out, 0.0,
               ["-c:a", "libvorbis", "-q:a", "5"] + tags)

    if "wav" not in formats:
        os.remove(wav_path)
    if not args.keep_raw and os.path.exists(raw_wav) and raw_wav != wav_path:
        os.remove(raw_wav)

    log("done:")
    for f in sorted(glob.glob(os.path.join(out_dir, "%s.*" % name))):
        log("  %-52s %8.2f MB" % (f, os.path.getsize(f) / 1e6))
    return 0


if __name__ == "__main__":
    sys.exit(main())
