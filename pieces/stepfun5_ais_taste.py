'''
Name of piece: Stepfun5 AI's Taste
Source of inspiration: Rigid grids that want to be warm
Date of discovery: 28.09.2026
'''

from FoxDot import *

# Everything in this piece divides into four bars exactly, so a 16-bar render
# is four identical phrases - and the loudness is not flat across them.  The
# first bar of each phrase is deliberately the quiet one.

# The warm bed.  One chord every two bars, swelling only in the middle of the
# phrase so its first and last bars are genuinely quiet.  FoxDot's default
# octave is 5, so 6 keeps this above the arpeggio rather than under the bass.
# The reverb is kept short: a long tail would fill exactly the gaps the rest of
# the piece is trying to make.
pd >> pads([0, 3, 7, 11], sus=8, dur=8, oct=6,
           amp=linvar([0.06, 0.06, 0.5, 0.06], 4), room=0.4, mix=0.3)

# A bass line spanning two bars, the last note hanging for four beats.  This
# is the only part that never dips, so the piece always has a floor.
bs >> dbass(P[0, 0, 3, 5, 0], dur=[.5, .5, 1, 2, 4], amp=0.34, sus=0.3)

# Three plucks a bar, not sixteen - an attack, a lift and a long tail.  The
# level steps through the same four-bar shape and reaches zero on bar one.
pl >> pluck(P[0, 4, 7], dur=[1, 1, 2],
            amp=var([0.0, 0.45, 0.6, 0.3], 4),
            pan=var([-0.45, 0.45], 2))

# Kick and snare every bar - the pulse never stops - but it softens for the
# first bar of the phrase rather than hammering straight through it.
d1 >> play("x---x---o---x---", dur=1/4, amp=var([0.28, 0.55, 0.5, 0.55], 4))

# The hats do most of the breathing: silent, then open.
d2 >> play("=---[--]=-[::]", dur=1/4, amp=var([0.0, 0.26, 0.22, 0.26], 4))

# A bell four notes long: four bars to turn round, and the longest cycle here.
bl >> blip([10, 7, 3, 7], dur=4, sus=3, oct=5, amp=0.4, room=0.5, mix=0.35)

Go()
