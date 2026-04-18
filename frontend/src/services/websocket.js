class WsService {
  constructor() {
    this.ws = null;
    this.courseSubs = new Map(); // courseId -> Set<callback>
    this.globalSubs = new Set(); // callbacks that get EVERY message
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    const url = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
    try {
      this.ws = new WebSocket(url);
    } catch (e) {
      console.warn('WebSocket connect failed:', e);
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      for (const courseId of this.courseSubs.keys()) {
        this.ws.send(JSON.stringify({ type: 'SUBSCRIBE', courseId }));
      }
    };

    this.ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      // Global listeners see every message.
      for (const cb of this.globalSubs) {
        try { cb(msg); } catch {}
      }
      // Course-scoped listeners see only their course.
      if (msg.courseId != null) {
        const subs = this.courseSubs.get(String(msg.courseId));
        if (subs) for (const cb of subs) {
          try { cb(msg); } catch {}
        }
      }
    };

    this.ws.onclose = () => {
      this.ws = null;
      this.scheduleReconnect();
    };
    this.ws.onerror = () => { /* onclose fires next */ };
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    const delay = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts++));
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.courseSubs.size > 0 || this.globalSubs.size > 0) this.connect();
    }, delay);
  }

  subscribe(courseId, cb) {
    const cid = String(courseId);
    if (!this.courseSubs.has(cid)) this.courseSubs.set(cid, new Set());
    this.courseSubs.get(cid).add(cb);
    this.connect();
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'SUBSCRIBE', courseId: cid }));
    }
    return () => this.unsubscribe(cid, cb);
  }

  unsubscribe(courseId, cb) {
    const cid = String(courseId);
    const subs = this.courseSubs.get(cid);
    if (!subs) return;
    subs.delete(cb);
    if (subs.size === 0) this.courseSubs.delete(cid);
  }

  subscribeGlobal(cb) {
    this.globalSubs.add(cb);
    this.connect();
    return () => this.globalSubs.delete(cb);
  }
}

const wsService = new WsService();
export default wsService;
