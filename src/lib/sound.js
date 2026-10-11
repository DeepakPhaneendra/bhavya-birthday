// Soft generated audio: a calm piano loop plus quiet, filtered effects.
export const Sound = { on: false, subs: new Set() };
let actx, master, sfx, loopTimer;

function initAudio() {
  if (actx) return;
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain(); master.gain.value = 0;
    const lp = actx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2200;
    const d = actx.createDelay(), fb = actx.createGain(), wet = actx.createGain();
    d.delayTime.value = 0.38; fb.gain.value = 0.22; wet.gain.value = 0.25;
    master.connect(lp); lp.connect(actx.destination); lp.connect(d); d.connect(fb); fb.connect(d); d.connect(wet); wet.connect(actx.destination);
    sfx = actx.createGain(); sfx.gain.value = 0; sfx.connect(lp);
  } catch (e) { actx = null; }
}

function keyNote(f, t, dur, vol, out) {
  if (!actx) return;
  const g = actx.createGain(), f1 = actx.createBiquadFilter();
  f1.type = "lowpass"; f1.frequency.setValueAtTime(1800, t); f1.frequency.exponentialRampToValueAtTime(500, t + dur + 1);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 1.8);
  [["sine", 1, 1], ["triangle", 1, 0.35], ["sine", 2, 0.12]].forEach(([type, m, a]) => {
    const o = actx.createOscillator(), og = actx.createGain();
    o.type = type; o.frequency.value = f * m; og.gain.value = a;
    o.connect(og); og.connect(f1); o.start(t); o.stop(t + dur + 2);
  });
  f1.connect(g); g.connect(out || master);
}

function pad(freqs, t, dur, vol) {
  freqs.forEach((f) => [-4, 4].forEach((det) => {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = "sine"; o.frequency.value = f; o.detune.value = det;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 1.2);
    g.gain.linearRampToValueAtTime(vol * 0.8, t + dur - 0.4); g.gain.linearRampToValueAtTime(0.0001, t + dur + 1);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 1.2);
  }));
}

export function noise(dur, type, freq, vol, freqTo) {
  if (!actx || !Sound.on) return;
  vol *= 0.3;
  if (type === "highpass") type = "bandpass";
  freq = Math.min(freq, 1400); if (freqTo) freqTo = Math.min(freqTo, 1400);
  const len = Math.floor(actx.sampleRate * dur), buf = actx.createBuffer(1, len, actx.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
  const src = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain(), t = actx.currentTime;
  src.buffer = buf; f.type = type; f.Q.value = 0.7; f.frequency.setValueAtTime(freq, t);
  if (freqTo) f.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(sfx); src.start(t);
}
export function blip(f, vol = 0.06) { if (!actx || !Sound.on) return; while (f > 900) f /= 2; keyNote(f, actx.currentTime, 0.1, Math.min(vol, 0.06), sfx); }
export function ding() { if (!actx || !Sound.on) return; const t = actx.currentTime; keyNote(659.25, t, 0.3, 0.07, sfx); keyNote(987.77, t + 0.14, 0.5, 0.06, sfx); }

const CHORDS = [[174.61, 220, 261.63, 329.63], [164.81, 196, 246.94, 293.66], [146.83, 174.61, 220, 261.63], [130.81, 164.81, 196, 246.94]];
const MEL = [[659.25, 0], [587.33, 1.6], [523.25, 2.4], [440, 4.8], [493.88, 6.4], [523.25, 7.2], [587.33, 9.6], [523.25, 11.2], [493.88, 12], [392, 14.4]];
function playSong() {
  if (!actx || !Sound.on) return;
  const bar = 4.8, t0 = actx.currentTime + 0.1;
  CHORDS.forEach((ch, i) => {
    const t = t0 + i * bar;
    pad(ch.map((f) => f / 2), t, bar, 0.018);
    [0, 1, 2, 3, 2, 1].forEach((n, j) => keyNote(ch[n], t + j * 0.8, 0.7, 0.045));
  });
  MEL.forEach(([f, at]) => keyNote(f, t0 + at + 0.4, 1.2, 0.035));
  loopTimer = setTimeout(playSong, bar * CHORDS.length * 1000 - 100);
}

export function setSound(on) {
  Sound.on = on; clearTimeout(loopTimer);
  if (on) {
    initAudio();
    if (actx) { actx.resume(); master.gain.setTargetAtTime(0.55, actx.currentTime, 0.8); sfx.gain.setTargetAtTime(0.6, actx.currentTime, 0.05); playSong(); }
  } else if (actx) {
    master.gain.setTargetAtTime(0, actx.currentTime, 0.3); sfx.gain.setTargetAtTime(0, actx.currentTime, 0.05);
  }
  Sound.subs.forEach((f) => f(on));
}
