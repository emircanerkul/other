'''
Name of piece: Stepfun5 AI's Taste
Source of inspiration: Rigid grids that want to be warm
Date of discovery: 28.09.2026
'''

from FoxDot import *

# The warm bed.  One chord, held for two bars at a time - degrees are in
# FoxDot's default minor scale, so 0/3/7/11 is a root with the eleventh.
# FoxDot's default octave is 5, so 6 puts this chord a step above the pluck
# arpeggio rather than underneath the bass, where oct=4 would have put it.
pd >> pads([0, 3, 7, 11], sus=8, dur=8, oct=6, amp=0.45, room=0.8, mix=0.5)

# A bass that keeps almost resolving: four beats a bar, the third one
# waiting a beat longer than it should.  Held under the arpeggio rather than
# on top of it - this piece is carried from the middle upwards.
bs >> dbass(P[0, 0, 3, 5], dur=[.5, .5, 1, 2], amp=0.34, sus=0.3)

# Sixteenth pluck arpeggio - one bar of sixteen notes, accented every other
# bar and panned opposite itself.  This is the part that carries the top.
pl >> pluck(P[0, 2, 4, 7, 9, 7, 4, 2].stutter(2), dur=1/4,
            amp=var([0.4, 0.55], 8), pan=var([-0.45, 0.45], 2))

# Kick on the half-beat, snare late in the bar, hats on the quarters.  The
# hats are quiet but they are what makes the grid audible.
d1 >> play("x---x---o---x---", dur=1/4, amp=0.5)
d2 >> play("=---[--]=-[::]", dur=1/4, amp=0.22)

# A bell that only arrives at the end of every four-bar phrase.
bl >> blip([10, 7, 3], dur=4, sus=3, oct=5, amp=0.4, room=0.7, mix=0.45)

Go()
