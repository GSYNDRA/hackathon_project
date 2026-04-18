const WebSocket = require('ws');

// Track every open socket (global channel)
const allConnections = new Set();
// Track course-scoped subscribers
const courseConnections = new Map();

function initializeWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  // Swallow errors that propagate from the underlying HTTP server (e.g.
  // EADDRINUSE at startup). The HTTP server's own `error` handler prints
  // a clean message and exits — we just need to prevent the default
  // "Unhandled 'error' event" crash from masking it.
  wss.on('error', () => { /* handled on http server */ });

  wss.on('connection', (ws) => {
    allConnections.add(ws);
    ws.courseIds = new Set();

    ws.on('message', (raw) => {
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        return;
      }
      // Accept both cases — earlier clients sent uppercase, server used to only handle lowercase.
      const type = String(data.type || '').toUpperCase();

      if ((type === 'SUBSCRIBE' || type === 'SUB') && data.courseId) {
        const cid = String(data.courseId);
        if (!courseConnections.has(cid)) courseConnections.set(cid, new Set());
        courseConnections.get(cid).add(ws);
        ws.courseIds.add(cid);
        ws.send(JSON.stringify({ type: 'SUBSCRIBED', courseId: cid }));
      } else if (type === 'UNSUBSCRIBE' && data.courseId) {
        const cid = String(data.courseId);
        courseConnections.get(cid)?.delete(ws);
        ws.courseIds.delete(cid);
      } else if (type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', t: Date.now() }));
      }
    });

    ws.on('close', () => {
      allConnections.delete(ws);
      for (const cid of ws.courseIds || []) {
        courseConnections.get(cid)?.delete(ws);
      }
    });

    ws.on('error', () => {
      /* will trigger close */
    });
  });

  return wss;
}

function sendTo(ws, messageStr) {
  if (ws.readyState === WebSocket.OPEN) ws.send(messageStr);
}

function broadcastToCourse(courseId, message) {
  const subs = courseConnections.get(String(courseId));
  if (!subs || subs.size === 0) return;
  const messageStr = JSON.stringify({ ...message, courseId: String(courseId) });
  subs.forEach((ws) => sendTo(ws, messageStr));
}

// Global broadcast to every open socket (regardless of course subscription).
function broadcastToAll(message) {
  const messageStr = JSON.stringify(message);
  allConnections.forEach((ws) => sendTo(ws, messageStr));
}

module.exports = {
  initializeWebSocket,
  broadcastToCourse,
  broadcastToAll,
};
