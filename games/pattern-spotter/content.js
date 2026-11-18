/* Pattern Spotter: words and data for this game. The game logic still carries most of its own text; it moves here when this game is upgraded. */
window.STONKZZ_CONTENT = {
 "game": null,
 "course": null
};

/* GUIDE:START  the on-screen guide before Start. target is a CSS selector on the first screen; gesture is tap, swipe, drag, point or none. */
window.STONKZZ_CONTENT.game = window.STONKZZ_CONTENT.game || {};
window.STONKZZ_CONTENT.game.guide = [
 {
  "target": ".chartbox",
  "text": "Watch the weeks draw a shape on the chart.",
  "gesture": "none"
 },
 {
  "target": ".ps-opts",
  "text": "Then pick the pattern’s name.",
  "gesture": "tap"
 },
 {
  "target": ".sz-hud",
  "text": "Six charts. A streak earns more.",
  "gesture": "point"
 }
];
/* GUIDE:END */

/* QUIZ:START  the module quiz from the course documents. Every question, answer, explanation and the pass mark. */
window.STONKZZ_CONTENT.quiz = {
 "module": 9,
 "title": "TA: Chart Patterns",
 "format": "1 conceptual MCQ + 6 image-based pattern questions · Pass mark 60% (needs 5/7)",
 "passNeeded": 5,
 "total": 7,
 "questions": [
  {
   "id": "sm9q1",
   "prompt": "Why do chart patterns actually tend to work, according to this course?",
   "stem": "Why do chart patterns actually tend to work, according to this course?",
   "context": null,
   "options": [
    "They're a proven, scientific guarantee of future price movement",
    "They capture repeating crowd psychology, reinforced by enough traders watching and acting on the same signals",
    "They work purely by random chance",
    "They're a legal requirement all stocks must follow"
   ],
   "answer": 1,
   "explanation": "Patterns are a visible record of crowd behaviour - fear, greed, hesitation - repeating in similar shapes because human psychology under similar conditions tends to repeat. They're reinforced because enough traders watching the same well-known pattern act on it, creating real buying or selling pressure. This makes patterns a genuine, if imperfect, probability tool - not a guarantee and not pure chance.",
   "wrongWhy": {
    "0": "A overstates certainty no pattern actually offers.",
    "2": "C dismisses a real, psychology-driven mechanism.",
    "3": "D describes something that doesn't exist."
   },
   "whyNot": "A overstates certainty no pattern actually offers. C dismisses a real, psychology-driven mechanism. D describes something that doesn't exist.",
   "data": null
  },
  {
   "id": "sm9q2",
   "prompt": "Data behind this image (linear closes between pivots, in order): 100→133→112→153→112→131→90\n\nThis chart shows three peaks - the middle one clearly higher than the two outer ones, which sit at similar heights - followed by a decline breaking below the level of the two pullback troughs. What pattern is this?",
   "stem": "This chart shows three peaks - the middle one clearly higher than the two outer ones, which sit at similar heights - followed by a decline breaking below the level of the two pullback troughs. What pattern is this?",
   "context": "Data behind this image (linear closes between pivots, in order): 100→133→112→153→112→131→90",
   "options": [
    "Double Top",
    "Head & Shoulders",
    "Cup and Handle",
    "Ascending Triangle"
   ],
   "answer": 1,
   "explanation": "Three peaks with the middle one (the \"Head\") clearly higher than the two similar-height outer peaks (the \"Shoulders\") is the defining shape of Head & Shoulders. The line connecting the two pullback troughs is the \"neckline\" - and breaking below it, as this chart does at the end, is read as confirming the reversal from up to down.",
   "wrongWhy": {
    "0": "A has only two peaks, not three.",
    "2": "C shows a rounded U-shape, not three distinct peaks.",
    "3": "D shows a flat resistance with rising lows, a completely different shape."
   },
   "whyNot": "A has only two peaks, not three. C shows a rounded U-shape, not three distinct peaks. D shows a flat resistance with rising lows, a completely different shape.",
   "data": {
    "pivots": [
     100,
     133,
     112,
     153,
     112,
     131,
     90
    ],
    "note": "linear closes between pivots"
   }
  },
  {
   "id": "sm9q3",
   "prompt": "Data behind this image: 100→140→112→138→93\n\nThis chart shows two peaks at similar heights, with one trough between them, followed by a decline breaking below that trough. What pattern is this?",
   "stem": "This chart shows two peaks at similar heights, with one trough between them, followed by a decline breaking below that trough. What pattern is this?",
   "context": "Data behind this image: 100→140→112→138→93",
   "options": [
    "Head & Shoulders",
    "Double Top",
    "Cup and Handle",
    "Flag"
   ],
   "answer": 1,
   "explanation": "Two peaks at roughly the same height, forming an \"M\" shape, is the classic Double Top - a reversal pattern signalling that an uptrend may be turning into a downtrend once the price breaks below the middle trough.",
   "wrongWhy": {
    "0": "A requires three peaks with the middle one higher - this chart only has two peaks at similar heights.",
    "2": "C and D describe entirely different shapes (a rounded bottom, and a sharp pole with a brief consolidation).",
    "3": "C and D describe entirely different shapes (a rounded bottom, and a sharp pole with a brief consolidation)."
   },
   "whyNot": "A requires three peaks with the middle one higher - this chart only has two peaks at similar heights. C and D describe entirely different shapes (a rounded bottom, and a sharp pole with a brief consolidation).",
   "data": {
    "pivots": [
     100,
     140,
     112,
     138,
     93
    ]
   }
  },
  {
   "id": "sm9q4",
   "prompt": "Data behind this image: Decline 140→100, then a smooth rounded bottom curving down to 90 and back up to 138, then a small pullback to 128, then a breakout to 152.\n\nWhat pattern does this rounded, U-shaped recovery followed by a small pullback and breakout represent?",
   "stem": "What pattern does this rounded, U-shaped recovery followed by a small pullback and breakout represent?",
   "context": "Data behind this image: Decline 140→100, then a smooth rounded bottom curving down to 90 and back up to 138, then a small pullback to 128, then a breakout to 152.",
   "options": [
    "Double Bottom",
    "Head & Shoulders",
    "Cup and Handle",
    "Rising Wedge"
   ],
   "answer": 2,
   "explanation": "The long, gradual, rounded \"U\" recovery is the cup, and the small downward drift right before the final breakout is the handle. This continuation pattern typically suggests the earlier uptrend (before the cup began) may resume once price breaks above the handle, ideally on rising volume.",
   "wrongWhy": {
    "0": "A would show a sharper \"W\" shape with two distinct troughs, not one smooth rounded curve.",
    "1": "B requires three peaks, not a rounded bottom.",
    "3": "D is a narrowing, rising oscillation - a completely different shape from this rounded recovery."
   },
   "whyNot": "A would show a sharper \"W\" shape with two distinct troughs, not one smooth rounded curve. B requires three peaks, not a rounded bottom. D is a narrowing, rising oscillation - a completely different shape from this rounded recovery.",
   "data": {
    "pivots": [
     140,
     100,
     90,
     138,
     128,
     152
    ],
    "note": "100 -> 90 -> 138 is a smooth rounded bottom (cup); 138 -> 128 handle; 152 breakout"
   }
  },
  {
   "id": "sm9q5",
   "prompt": "Data behind this image: A sharp, steep rise from 100 to 165, then a brief choppy sideways-to-slightly-down consolidation between roughly 150-165, then a continuation breakout up to 178.\n\nWhat does the sharp initial rise followed by a brief consolidation and continuation represent?",
   "stem": "What does the sharp initial rise followed by a brief consolidation and continuation represent?",
   "context": "Data behind this image: A sharp, steep rise from 100 to 165, then a brief choppy sideways-to-slightly-down consolidation between roughly 150-165, then a continuation breakout up to 178.",
   "options": [
    "Head & Shoulders",
    "A Flag continuation pattern",
    "Cup and Handle",
    "Double Top"
   ],
   "answer": 1,
   "explanation": "The sharp, steep rise is the \"flagpole,\" and the brief, tight consolidation right after it is the \"flag\" itself - a short pause within a strong trend. These patterns typically resolve with a continuation in the original direction, which is exactly what happens here as price breaks higher after the pause.",
   "wrongWhy": {
    "0": "A and D both require multiple distinct peaks at comparable heights over a longer period - not a single sharp pole with a brief pause.",
    "2": "C requires a long, gradual rounded recovery, not a sharp rise.",
    "3": "A and D both require multiple distinct peaks at comparable heights over a longer period - not a single sharp pole with a brief pause."
   },
   "whyNot": "A and D both require multiple distinct peaks at comparable heights over a longer period - not a single sharp pole with a brief pause. C requires a long, gradual rounded recovery, not a sharp rise.",
   "data": {
    "pivots": [
     100,
     165,
     178
    ],
    "consolidationRange": [
     150,
     165
    ],
    "note": "sharp rise 100->165, choppy sideways-to-slightly-down 150-165, breakout to 178"
   }
  },
  {
   "id": "sm9q6",
   "prompt": "Data behind this image: Price repeatedly rises to touch roughly the same resistance level (~150) three times, while each pullback low is progressively higher than the last, before finally breaking out above resistance.\n\nWhat pattern does a FLAT resistance level combined with RISING support lows represent?",
   "stem": "What pattern does a FLAT resistance level combined with RISING support lows represent?",
   "context": "Data behind this image: Price repeatedly rises to touch roughly the same resistance level (~150) three times, while each pullback low is progressively higher than the last, before finally breaking out above resistance.",
   "options": [
    "Symmetrical Triangle",
    "Rising Wedge",
    "Ascending Triangle",
    "Descending Triangle"
   ],
   "answer": 2,
   "explanation": "A flat ceiling (resistance staying at roughly the same level each time) combined with a rising floor (each pullback low higher than the last) is specifically an Ascending Triangle - generally read with a bullish bias, since buyers are willing to pay progressively more each time, while sellers defend the same ceiling until it finally gives way.",
   "wrongWhy": {
    "0": "A would show both the resistance and support lines converging toward each other, not one flat and one rising.",
    "1": "B would show both the highs and lows rising (not one flat), with the whole range narrowing.",
    "3": "D is the mirror image - flat support with falling resistance."
   },
   "whyNot": "A would show both the resistance and support lines converging toward each other, not one flat and one rising. B would show both the highs and lows rising (not one flat), with the whole range narrowing. D is the mirror image - flat support with falling resistance.",
   "data": {
    "resistance": 150,
    "resistanceTouches": 3,
    "note": "pullback lows progressively higher (values not given), then breakout above resistance"
   }
  },
  {
   "id": "sm9q7",
   "prompt": "Data behind this image: Three successive swings, each with a higher high AND a higher low than the last, but with the range between each swing's high and low getting progressively narrower - followed by a breakdown.\n\nDespite the overall upward slope, both boundary lines rising and converging toward each other is characteristic of which pattern - and what does it typically suggest?",
   "stem": "Despite the overall upward slope, both boundary lines rising and converging toward each other is characteristic of which pattern - and what does it typically suggest?",
   "context": "Data behind this image: Three successive swings, each with a higher high AND a higher low than the last, but with the range between each swing's high and low getting progressively narrower - followed by a breakdown.",
   "options": [
    "Ascending Triangle - typically bullish",
    "Rising Wedge - despite sloping upward, typically a bearish reversal signal",
    "Cup and Handle - typically bullish continuation",
    "Double Top - typically bearish reversal"
   ],
   "answer": 1,
   "explanation": "This is the genuinely counterintuitive one: even though both lines slope upward, a Rising Wedge is typically read as a bearish signal. The narrowing range suggests the upward momentum is losing steam with each swing - buyers are struggling to push much higher each time - often resolving in a breakdown, exactly as shown at the end of this chart.",
   "wrongWhy": {
    "0": "A requires one FLAT boundary (resistance), not both lines rising - this chart's resistance line is clearly rising too, swing after swing.",
    "2": "C and D describe entirely different shapes (a rounded recovery, and two similar-height peaks) not present here.",
    "3": "C and D describe entirely different shapes (a rounded recovery, and two similar-height peaks) not present here."
   },
   "whyNot": "A requires one FLAT boundary (resistance), not both lines rising - this chart's resistance line is clearly rising too, swing after swing. C and D describe entirely different shapes (a rounded recovery, and two similar-height peaks) not present here.",
   "data": {
    "note": "three swings, each higher high and higher low, range narrowing, then breakdown (no values given)"
   }
  }
 ],
 "passMessage": "Well done - you can now recognise the major multi-week chart patterns, including the genuinely tricky ones like telling a Rising Wedge apart from an Ascending Triangle. That's real, applicable pattern-reading skill. On to Module 10, where we add mathematical indicators to confirm what your eyes are seeing.",
 "failMessage": "These multi-week patterns take practice to tell apart - especially triangles versus wedges, since both involve rising prices but mean very different things. Revisit those specific lessons, then try again. No limit on attempts."
};
/* QUIZ:END */
