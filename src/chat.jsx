import React, { useState, useEffect } from 'react';
import './chat.css';

const ChatApp = () => {
  const [ws, setWs] = useState(null);
  const [pairId, setPairId] = useState('');
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000');
    setWs(socket);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'pair_status') {
        setStatus(data.status);
        setConnected(data.status === 'connected');
      } else if (data.type === 'message') {
        setMessages((prev) => [
          ...prev,
          { from: data.from, content: data.content },
        ]);
      }
    };

    socket.onclose = () => {
      setStatus('disconnected');
      setConnected(false);
    };

    return () => {
      socket.close();
    };
  }, []);

  const handlePairRequest = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: 'pair_request', pairId }));
    }
  };

  const handleSendMessage = () => {
    if (ws && connected) {
      ws.send(
        JSON.stringify({ type: 'message', pairId, content: inputMessage })
      );
      setMessages((prev) => [...prev, { from: 'me', content: inputMessage }]);
      setInputMessage('');
    }
  };

  return (
    <div className="chat-app">
      <h1>Chat App</h1>
      <div className="status">Status: {status}</div>
      <div className="pair-section">
        <input
          type="text"
          placeholder="Enter Pair ID"
          value={pairId}
          onChange={(e) => setPairId(e.target.value)}
          disabled={connected}
        />
        <button onClick={handlePairRequest} disabled={connected}>
          Connect
        </button>
      </div>
      <div className="messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.from === 'me' ? 'sent' : 'received'}`}
          >
            <span className="from">{msg.from}:</span> {msg.content}
          </div>
        ))}
      </div>
      {connected && (
        <div className="send-message">
          <input
            type="text"
            placeholder="Type a message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
          />
          <button onClick={handleSendMessage}>Send</button>
        </div>
      )}
    </div>
  );
};

export default ChatApp;
