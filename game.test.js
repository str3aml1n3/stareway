import { test } from "node:test";
import { strict as assert } from "node:assert";
import "./game.js";
const { BEAT, FIRST_BEAT, HIT_WINDOW, noteAt, findHit, eyeRatio, BlinkDetector } = globalThis.BlinkBeatGame;

test("notes follow the music clock and repeat the lane pattern", () => {
  assert.equal(noteAt(0).time, FIRST_BEAT);
  assert.equal(noteAt(3).time, FIRST_BEAT + 3 * BEAT);
  assert.equal(noteAt(0).lane, noteAt(16).lane);
});

test("hits only match an unjudged note in the correct lane and timing window", () => {
  const notes = [noteAt(0), noteAt(1)];
  assert.equal(findHit(notes, "left", FIRST_BEAT), notes[0]);
  assert.equal(findHit(notes, "right", FIRST_BEAT), undefined);
  assert.equal(findHit(notes, "left", FIRST_BEAT + HIT_WINDOW + 0.01), undefined);
  notes[0].judged = true;
  assert.equal(findHit(notes, "left", FIRST_BEAT), undefined);
});

test("eye ratio measures openness and handles zero width", () => {
  const points = [{x: 0, y: 0}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 0}, {x: 2, y: -1}, {x: 1, y: -1}];
  assert.equal(eyeRatio(points, [0, 1, 2, 3, 4, 5]), 2 / 3);
  assert.equal(eyeRatio(points, [0, 1, 2, 0, 4, 5]), 0);
});

test("blink detector calibrates, fires once per wink, and rearms on opening", () => {
  const detector = new BlinkDetector();
  for (let i = 0; i < 20; i++) assert.equal(detector.update(0.3), false);
  assert.equal(detector.update(0.1), false);
  assert.equal(detector.update(0.1), true);
  assert.equal(detector.update(0.1), false);
  assert.equal(detector.update(0.3), false);
  assert.equal(detector.update(0.1), false);
  assert.equal(detector.update(0.1), true);
});
