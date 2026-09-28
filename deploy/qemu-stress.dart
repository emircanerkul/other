// Quick qemu-emulation stress test for the Dart VM: threading, isolates,
// HTTP and file I/O in one go. If this survives, `flutter pub get` should too.
import 'dart:async';
import 'dart:io';
import 'dart:isolate';

Future<void> main() async {
  print('dart: ${Platform.version}');

  final sw = Stopwatch()..start();
  final done = <int>[];
  await Future.wait(List.generate(8, (i) => Isolate.run(() {
    var sum = 0;
    for (var j = 0; j < 2000000; j++) {
      sum += j % 7;
    }
    return sum;
  }).then(done.add)));

  final client = HttpClient();
  final req = await client.getUrl(Uri.parse('https://pub.dev'));
  final resp = await req.close();
  print('http status: ${resp.statusCode}');

  for (var i = 0; i < 300; i++) {
    final f = File('${Directory.systemTemp.path}/qemu-test-$i.tmp');
    await f.writeAsString('x' * 4096);
    await f.delete();
  }
  print('isolates: ${done.length}, elapsed: ${sw.elapsedMilliseconds}ms');
  exit(0);
}
