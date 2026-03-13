// 사운드 시스템 — Web Audio API 기반 절차적 사운드 생성
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sounds = {};
    this.activeSounds = new Map();
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);
    this.initialized = true;
    this._createProceduralSounds();
  }

  // 절차적 사운드 생성 (에셋 없이 Web Audio API로 생성)
  _createProceduralSounds() {
    // 사운드 설정은 play 메서드에서 처리
  }

  // 발걸음 소리 생성
  playFootstep(volume = 0.3, heavy = false) {
    if (!this.initialized) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.value = heavy ? 200 : 400;

    osc.type = 'white' in window.OscillatorNode?.prototype ? 'square' : 'square';
    osc.frequency.value = heavy ? 60 + Math.random() * 30 : 100 + Math.random() * 50;

    gain.gain.setValueAtTime(volume * 0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

    // 노이즈 버퍼로 발걸음 시뮬레이션
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value = volume * 0.5;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = heavy ? 150 : 300;
    noiseFilter.Q.value = 1;

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start();

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  // 심장 박동 소리
  playHeartbeat(intensity = 0.5) {
    if (!this.initialized) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 40;

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(intensity * 0.4, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);

    // 두 번째 박동
    setTimeout(() => {
      if (!this.initialized) return;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = 35;
      const now2 = this.ctx.currentTime;
      gain2.gain.setValueAtTime(0, now2);
      gain2.gain.linearRampToValueAtTime(intensity * 0.3, now2 + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.12);
      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(now2);
      osc2.stop(now2 + 0.15);
    }, 200);
  }

  // 문 여는 소리
  playDoorOpen() {
    if (!this.initialized) return;
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / this.ctx.sampleRate;
      data[i] = Math.sin(200 * t + 50 * Math.sin(30 * t)) * Math.exp(-t * 5) * 0.3;
      data[i] += (Math.random() * 2 - 1) * 0.1 * Math.exp(-t * 3);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.masterGain);
    source.start();
  }

  // 문 쾅 닫히는 소리
  playDoorSlam() {
    if (!this.initialized) return;
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / this.ctx.sampleRate;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 10) * 0.8;
      data[i] += Math.sin(80 * t) * Math.exp(-t * 15) * 0.5;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.masterGain);
    source.start();
  }

  // 아이템 줍기 소리
  playPickup() {
    if (!this.initialized) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  // 선생님 감지 시 경고음
  playAlert() {
    if (!this.initialized) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 150;
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  // 형광등 지직거림
  playFlicker() {
    if (!this.initialized) return;
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.05 * (Math.random() > 0.7 ? 3 : 1);
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    source.connect(filter);
    filter.connect(this.masterGain);
    source.start();
  }

  // 앰비언트 드론 (반복)
  startAmbientDrone() {
    if (!this.initialized || this.activeSounds.has('drone')) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.value = 55;
    osc2.type = 'sine';
    osc2.frequency.value = 57;

    filter.type = 'lowpass';
    filter.frequency.value = 200;
    gain.gain.value = 0.06;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start();
    osc2.start();

    this.activeSounds.set('drone', { oscs: [osc1, osc2], gain });
  }

  stopAmbientDrone() {
    const drone = this.activeSounds.get('drone');
    if (drone) {
      drone.oscs.forEach(o => o.stop());
      this.activeSounds.delete('drone');
    }
  }

  // 추격 BGM
  startChaseBGM() {
    if (!this.initialized || this.activeSounds.has('chase')) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.value = 80;
    osc2.type = 'square';
    osc2.frequency.value = 120;

    lfo.type = 'sine';
    lfo.frequency.value = 4;
    lfoGain.gain.value = 20;
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);

    gain.gain.value = 0.1;

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start();
    osc2.start();
    lfo.start();

    this.activeSounds.set('chase', { oscs: [osc1, osc2, lfo], gain });
  }

  stopChaseBGM() {
    const chase = this.activeSounds.get('chase');
    if (chase) {
      chase.oscs.forEach(o => o.stop());
      this.activeSounds.delete('chase');
    }
  }

  // 게임 오버 사운드
  playGameOver() {
    if (!this.initialized) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 1);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.5);
  }

  // 승리 사운드
  playClear() {
    if (!this.initialized) return;
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = this.ctx.currentTime + i * 0.2;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
      gain.gain.linearRampToValueAtTime(0, t + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  stopAll() {
    this.activeSounds.forEach((sound) => {
      if (sound.oscs) sound.oscs.forEach(o => { try { o.stop(); } catch(e) {} });
    });
    this.activeSounds.clear();
  }
}
