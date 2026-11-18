const endpoint = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || '';

export const multiplayerConfigured = !!(endpoint && publishableKey);

function normalizeRoom(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'museum-gallery';
}

export class MuseumMultiplayer {
  constructor({ onVisitors, onPose, onStatus }) {
    this.client = null;
    this.onVisitors = onVisitors;
    this.onPose = onPose;
    this.onStatus = onStatus;
    this.id = globalThis.crypto?.randomUUID?.() || `visitor-${Math.random().toString(36).slice(2)}`;
    this.channel = null;
    this.interval = null;
    this.localState = { x: 0, z: 0, yaw: 0, zone: '' };
    this.name = 'Visitor';
    this.room = '';
  }

  async join(roomName, displayName) {
    if (!this.client) {
      if (!multiplayerConfigured) {
        const error = new Error('Multiplayer is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then rebuild and deploy.');
        this.onStatus('setup', error.message);
        return false;
      }
      try {
        const { createClient } = await import('@supabase/supabase-js');
        this.client = createClient(endpoint, publishableKey, { realtime: { params: { eventsPerSecond: 12 } } });
      } catch (cause) {
        const error = new Error(`Could not load the Realtime client: ${cause.message}`);
        this.onStatus('error', error.message);
        return false;
      }
    }
    await this.leave(false);
    this.room = normalizeRoom(roomName);
    this.name = displayName.trim().slice(0, 20) || 'Visitor';
    this.onStatus('connecting', `Connecting to public room “${this.room}”…`);
    const topic = `museum-room-${this.room}`;
    this.channel = this.client.channel(topic, {
      config: { private: false, broadcast: { ack: false, self: false }, presence: { key: this.id } },
    });
    this.channel
      .on('presence', { event: 'sync' }, () => this.syncVisitors())
      .on('broadcast', { event: 'pose' }, ({ payload }) => {
        if (payload?.id === this.id) return;
        this.onPose(payload);
      });

    return new Promise(resolve => {
      let settled = false;
      this.channel.subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          try {
            const trackStatus = await this.channel.track({ id: this.id, name: this.name, room: this.room });
            if (trackStatus !== 'ok') throw new Error(`Presence returned ${trackStatus}`);
            this.onStatus('connected', `Connected to “${this.room}”. Anyone with this public room name can join.`);
            this.syncVisitors();
            this.interval = window.setInterval(() => this.sendPose(), 125);
            if (!settled) { settled = true; resolve(true); }
          } catch (error) {
            this.onStatus('error', `Could not publish visitor presence: ${error.message}`);
            if (!settled) { settled = true; resolve(false); }
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          this.onStatus('error', `Realtime channel ${status.toLowerCase().replace('_', ' ')}. Check the Supabase URL, publishable key, and Realtime settings.`);
          if (!settled) { settled = true; resolve(false); }
        }
      });
    });
  }

  syncVisitors() {
    if (!this.channel) return;
    const state = this.channel.presenceState();
    const visitors = [];
    for (const entries of Object.values(state)) {
      for (const visitor of entries) if (visitor.id && visitor.id !== this.id) visitors.push(visitor);
    }
    this.onVisitors(visitors);
  }

  setPose(pose) { this.localState = pose; }

  sendPose() {
    if (!this.channel) return;
    this.channel.send({ type: 'broadcast', event: 'pose', payload: { id: this.id, name: this.name, ...this.localState } })
      .catch(error => this.onStatus('error', `Position update failed: ${error.message}`));
  }

  async leave(updateStatus = true) {
    if (this.interval) window.clearInterval(this.interval);
    this.interval = null;
    if (this.channel) {
      const old = this.channel; this.channel = null;
      await this.client?.removeChannel(old);
    }
    this.onVisitors([]);
    if (updateStatus) this.onStatus('disconnected', 'Left the shared room.');
  }
}
