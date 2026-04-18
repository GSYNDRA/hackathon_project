const WebSocket = require('ws');

// Store WebSocket connections by course
const courseConnections = new Map();

// Initialize WebSocket server
function initializeWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'subscribe' && data.courseId) {
          // Subscribe to course updates
          if (!courseConnections.has(data.courseId)) {
            courseConnections.set(data.courseId, new Set());
          }
          courseConnections.get(data.courseId).add(ws);
          ws.courseId = data.courseId;
          console.log(`Client subscribed to course ${data.courseId}`);
          
          // Send confirmation
          ws.send(JSON.stringify({
            type: 'SUBSCRIBED',
            courseId: data.courseId
          }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      if (ws.courseId && courseConnections.has(ws.courseId)) {
        courseConnections.get(ws.courseId).delete(ws);
        console.log(`Client unsubscribed from course ${ws.courseId}`);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return wss;
}

// Broadcast message to all subscribers of a course
function broadcastToCourse(courseId, message) {
  if (courseConnections.has(courseId)) {
    const connections = courseConnections.get(courseId);
    const messageStr = JSON.stringify(message);
    
    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
    
    console.log(`Broadcast to course ${courseId}: ${message.type}`);
  }
}

// Broadcast to all connected clients
function broadcastToAll(message) {
  const messageStr = JSON.stringify(message);
  
  courseConnections.forEach((connections, courseId) => {
    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  });
}

module.exports = {
  initializeWebSocket,
  broadcastToCourse,
  broadcastToAll
};
