const { WebSocket, WebSocketServer } = require('ws');
const http = require('http');
const uuidv4 = require('uuid').v4;

const server = http.createServer();
const wsServer = new WebSocketServer({ server });
const port = 8000;
server.listen(port, '0.0.0.0', () => {
  console.log(
    `WebSocket server is running on port ${port} and accessible on the local network.`
  );
});

const clients = {};
const pairs = {};

function sendMessageToClient(clientId, json) {
  const data = JSON.stringify(json);
  const client = clients[clientId];
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(data);
  }
}

function handleMessage(message, userId) {
  let dataFromClient;

  try {
    dataFromClient = JSON.parse(message.toString());
    console.log(`Message received from ${userId}:`, message.toString());
    console.log(`Parsed data:`, dataFromClient);
  } catch (e) {
    console.log(`Invalid message received from ${userId}:`, message);
    return;
  }

  const {
    type,
    pairId,
    content,
    waterAmount,
    sugarAmount,
    lemonJuice,
    teaFilter,
    progress,
    status,
    number,
  } = dataFromClient;

  if (type === 'pair_request') {
    if (!pairs[pairId]) {
      pairs[pairId] = [userId];
      console.log(`Pair ${pairId} created with user ${userId}.`);
      sendMessageToClient(userId, { type: 'pair_status', status: 'waiting' });
    } else if (pairs[pairId].length === 1) {
      pairs[pairId].push(userId);
      console.log(`Pair ${pairId} updated with user ${userId}.`);
      pairs[pairId].forEach((id) =>
        sendMessageToClient(id, { type: 'pair_status', status: 'connected' })
      );
    } else {
      sendMessageToClient(userId, {
        type: 'pair_status',
        status: 'full',
      });
    }
  } else if (type === 'message' && pairId) {
    const pair = pairs[pairId];
    if (pair && pair.includes(userId)) {
      const recipientId = pair.find((id) => id !== userId);
      if (recipientId) {
        sendMessageToClient(recipientId, {
          type: 'message',
          content,
          from: userId,
        });
      }
    }
  } else if (type === 'tea_order' && pairId) {
    const pair = pairs[pairId];
    if (pair && pair.includes(userId)) {
      const recipientId = pair.find((id) => id !== userId);
      if (recipientId) {
        sendMessageToClient(recipientId, {
          type: 'tea_order',
          waterAmount,
          sugarAmount,
          lemonJuice,
          teaFilter,
          from: userId,
        });
      }
    }
  } else if (type === 'update_progress' && pairId) {
    const pair = pairs[pairId];
    if (pair && pair.includes(userId)) {
      const recipientId = pair.find((id) => id !== userId);
      if (recipientId) {
        sendMessageToClient(recipientId, {
          type: 'update_progress',
          status,
          progress,
          pairId,
        });
      }
    }
  } else if (type === 'error_status' && pairId) {
    const pair = pairs[pairId];
    if (pair && pair.includes(userId)) {
      const recipientId = pair.find((id) => id !== userId);
      if (recipientId) {
        sendMessageToClient(recipientId, {
          type: 'error_status',
          status,
          pairId,
          number,
        });
      }
    }
  }
}

function handleDisconnect(userId) {
  console.log(`${userId} disconnected.`);
  for (const pairId in pairs) {
    if (pairs[pairId].includes(userId)) {
      pairs[pairId] = pairs[pairId].filter((id) => id !== userId);
      const remainingUser = pairs[pairId][0];
      if (remainingUser) {
        sendMessageToClient(remainingUser, {
          type: 'pair_status',
          status: 'disconnected',
        });
      } else {
        delete pairs[pairId];
      }
    }
  }
  delete clients[userId];
}

wsServer.on('connection', function (connection) {
  const userId = uuidv4();
  console.log(`${userId} connected.`);
  clients[userId] = connection;
  connection.on('message', (message) => handleMessage(message, userId));
  connection.on('close', () => handleDisconnect(userId));
});
