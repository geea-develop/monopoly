"use client";

// Synthesized sound effects using Web Audio API — no files needed
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.3,
  ramp?: "up" | "down"
) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;

  if (ramp === "down") {
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  } else if (ramp === "up") {
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + duration * 0.8);
  }

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNotes(notes: { freq: number; delay: number; duration: number; type?: OscillatorType; volume?: number }[]) {
  notes.forEach(({ freq, delay, duration, type, volume }) => {
    setTimeout(() => playTone(freq, duration, type || "sine", volume || 0.2, "down"), delay);
  });
}

export const SFX = {
  diceRoll() {
    // Slot machine reel — subtle clicks that decelerate
    const clicks = 12;
    for (let i = 0; i < clicks; i++) {
      const delay = i < 6
        ? i * 70
        : 420 + (i - 6) * (90 + (i - 6) * 30);
      setTimeout(() => {
        playTone(900 + (i % 2) * 200, 0.03, "sine", 0.1 - i * 0.005);
      }, delay);
    }
  },

  buy() {
    // Cash register "cha-ching"
    playNotes([
      { freq: 800, delay: 0, duration: 0.1, type: "square", volume: 0.15 },
      { freq: 1200, delay: 80, duration: 0.1, type: "square", volume: 0.15 },
      { freq: 1600, delay: 160, duration: 0.2, type: "square", volume: 0.2 },
    ]);
  },

  rent() {
    // Descending tone — paying money
    playNotes([
      { freq: 600, delay: 0, duration: 0.15, type: "triangle" },
      { freq: 400, delay: 120, duration: 0.15, type: "triangle" },
      { freq: 300, delay: 240, duration: 0.2, type: "triangle" },
    ]);
  },

  jail() {
    // Dramatic descending — prison door slam
    playNotes([
      { freq: 200, delay: 0, duration: 0.3, type: "sawtooth", volume: 0.15 },
      { freq: 80, delay: 200, duration: 0.5, type: "sawtooth", volume: 0.25 },
    ]);
  },

  passGo() {
    // Uplifting ascending notes
    playNotes([
      { freq: 523, delay: 0, duration: 0.15 },
      { freq: 659, delay: 100, duration: 0.15 },
      { freq: 784, delay: 200, duration: 0.15 },
      { freq: 1047, delay: 300, duration: 0.3, volume: 0.25 },
    ]);
  },

  win() {
    // Fanfare!
    playNotes([
      { freq: 523, delay: 0, duration: 0.2, type: "square", volume: 0.15 },
      { freq: 659, delay: 150, duration: 0.2, type: "square", volume: 0.15 },
      { freq: 784, delay: 300, duration: 0.2, type: "square", volume: 0.15 },
      { freq: 1047, delay: 450, duration: 0.4, type: "square", volume: 0.2 },
      { freq: 784, delay: 700, duration: 0.15, type: "square", volume: 0.15 },
      { freq: 1047, delay: 850, duration: 0.5, type: "square", volume: 0.25 },
    ]);
  },

  lose() {
    // Sad trombone
    playNotes([
      { freq: 392, delay: 0, duration: 0.3, type: "triangle", volume: 0.2 },
      { freq: 370, delay: 300, duration: 0.3, type: "triangle", volume: 0.2 },
      { freq: 349, delay: 600, duration: 0.3, type: "triangle", volume: 0.2 },
      { freq: 330, delay: 900, duration: 0.6, type: "triangle", volume: 0.25 },
    ]);
  },

  yourTurn() {
    // Quick attention ping
    playNotes([
      { freq: 880, delay: 0, duration: 0.1 },
      { freq: 1100, delay: 100, duration: 0.15, volume: 0.25 },
    ]);
  },

  card() {
    // Mystery card flip
    playNotes([
      { freq: 600, delay: 0, duration: 0.08, type: "square", volume: 0.1 },
      { freq: 900, delay: 80, duration: 0.12, type: "square", volume: 0.15 },
    ]);
  },

  gameStart() {
    // Energetic countdown into launch
    playNotes([
      { freq: 440, delay: 0, duration: 0.15, type: "square", volume: 0.15 },
      { freq: 550, delay: 150, duration: 0.15, type: "square", volume: 0.15 },
      { freq: 660, delay: 300, duration: 0.15, type: "square", volume: 0.18 },
      { freq: 880, delay: 450, duration: 0.3, type: "square", volume: 0.2 },
      { freq: 1100, delay: 650, duration: 0.4, type: "triangle", volume: 0.25 },
    ]);
  },

  playerJoined() {
    // Friendly pop-in chime
    playNotes([
      { freq: 660, delay: 0, duration: 0.1, type: "sine", volume: 0.15 },
      { freq: 880, delay: 80, duration: 0.15, type: "sine", volume: 0.2 },
    ]);
  },
};
