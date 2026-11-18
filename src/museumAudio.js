import * as THREE from 'three';

export class MuseumAudio {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    this.listener = null;
    this.ambient = null;
    this.ambientEnabled = false;
    this.cuesEnabled = false;
    this.volume = .25;
    this.cues = new Map();
  }

  async initialize() {
    if (!this.listener) {
      this.listener = new THREE.AudioListener();
      this.camera.add(this.listener);
      this.createAmbient();
    }
    if (this.listener.context.state === 'suspended') await this.listener.context.resume();
    return this.listener;
  }

  createAmbient() {
    const context = this.listener.context;
    const sampleRate = context.sampleRate;
    const buffer = context.createBuffer(1, sampleRate * 3, sampleRate);
    const samples = buffer.getChannelData(0);
    let smoothNoise = 0;
    for (let i = 0; i < samples.length; i++) {
      smoothNoise = smoothNoise * .985 + (Math.random() * 2 - 1) * .015;
      samples[i] = smoothNoise * .75;
    }
    const ambience = new THREE.PositionalAudio(this.listener);
    ambience.setBuffer(buffer); ambience.setLoop(true); ambience.setRefDistance(5);
    ambience.setRolloffFactor(.45); ambience.setDistanceModel('linear');
    ambience.setVolume(.08 * this.volume);
    const lowPass = context.createBiquadFilter(); lowPass.type = 'lowpass'; lowPass.frequency.value = 240;
    ambience.setFilter(lowPass);
    ambience.position.set(0, 2.6, 6.8); this.scene.add(ambience);
    this.ambient = ambience;
  }

  async setAmbientEnabled(enabled) {
    if (enabled) {
      await this.initialize();
      if (!this.ambient.isPlaying) this.ambient.play();
    } else if (this.ambient?.isPlaying) this.ambient.stop();
    this.ambientEnabled = !!enabled;
  }

  setVolume(value) {
    this.volume = THREE.MathUtils.clamp(value, 0, .6);
    if (this.ambient) this.ambient.setVolume(.08 * this.volume);
    for (const cue of this.cues.values()) cue.setVolume(.22 * this.volume);
  }

  setCuesEnabled(enabled) { this.cuesEnabled = !!enabled; }

  ensureCue(exhibit, root) {
    if (!this.listener || this.cues.has(exhibit.file)) return;
    const context = this.listener.context;
    const duration = .42, buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) {
      const t = i / context.sampleRate;
      const envelope = Math.exp(-t * 8) * Math.min(t * 35, 1);
      samples[i] = (Math.sin(2 * Math.PI * 520 * t) + .52 * Math.sin(2 * Math.PI * 780 * t)) * envelope * .34;
    }
    const cue = new THREE.PositionalAudio(this.listener);
    cue.setBuffer(buffer); cue.setLoop(false); cue.setRefDistance(5); cue.setRolloffFactor(1.1);
    cue.setDistanceModel('inverse'); cue.setVolume(.22 * this.volume);
    root.add(cue); this.cues.set(exhibit.file, cue);
  }

  async playExhibitCue(exhibit, root) {
    if (!this.cuesEnabled || !this.listener) return;
    await this.initialize();
    this.ensureCue(exhibit, root);
    const cue = this.cues.get(exhibit.file);
    if (cue?.isPlaying) cue.stop();
    cue?.play();
  }

  dispose() {
    if (this.ambient?.isPlaying) this.ambient.stop();
    for (const cue of this.cues.values()) if (cue.isPlaying) cue.stop();
    if (this.listener) this.camera.remove(this.listener);
    this.listener = null; this.ambient = null; this.cues.clear();
  }
}
