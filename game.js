export const BEAT = 0.5;
export const FIRST_BEAT = 3;
export const TRAVEL_TIME = 2.8;
export const HIT_WINDOW = 0.22;

const pattern = ["left", "right", "left", "right", "right", "left", "right", "left",
  "left", "right", "right", "left", "right", "left", "left", "right"];

export function noteAt(index) {
  return { lane: pattern[index % pattern.length], time: FIRST_BEAT + index * BEAT, judged: false };
}

export function findHit(notes, lane, time) {
  return notes.filter(note => !note.judged && note.lane === lane && Math.abs(note.time - time) <= HIT_WINDOW)
    .sort((a, b) => Math.abs(a.time - time) - Math.abs(b.time - time))[0];
}

export function eyeRatio(points, indices) {
  const distance = (a, b) => Math.hypot(points[a].x - points[b].x, points[a].y - points[b].y);
  const width = distance(indices[0], indices[3]);
  return width ? (distance(indices[1], indices[5]) + distance(indices[2], indices[4])) / (2 * width) : 0;
}

export class BlinkDetector {
  constructor() {
    this.baseline = 0;
    this.samples = 0;
    this.closedFrames = 0;
    this.closed = false;
  }

  update(ratio) {
    if (!Number.isFinite(ratio) || ratio <= 0) return false;
    if (this.samples < 20) {
      this.baseline = Math.max(this.baseline, ratio);
      this.samples++;
      return false;
    }
    if (ratio < this.baseline * 0.65) {
      this.closedFrames++;
      if (!this.closed && this.closedFrames >= 2) {
        this.closed = true;
        return true;
      }
    } else {
      this.closedFrames = 0;
      if (ratio > this.baseline * 0.8) this.closed = false;
      this.baseline = this.baseline * 0.995 + Math.min(ratio, this.baseline * 1.15) * 0.005;
    }
    return false;
  }
}
