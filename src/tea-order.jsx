import React, { useState, useEffect } from 'react';
import errorMessages from './error.json'; // Importáljuk a JSON fájlt
import './tea-order.css';

const TeaOrder = () => {
  const pairId = 'teaorder';
  const [socket, setSocket] = useState(null);
  const [waterAmount, setWaterAmount] = useState('');
  const [sugarAmount, setSugarAmount] = useState('');
  const [lemonJuice, setLemonJuice] = useState('');
  const [teaFilter, setTeaFilter] = useState('');
  const [status, setStatus] = useState('');
  const [connected, setConnected] = useState(false);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [progress, setProgress] = useState(0);
  const [orderProcessed, setOrderProcessed] = useState(false);
  const [send, setSend] = useState(false);
  const [error, setError] = useState(false);
  const [errorNumber, setErrorNumber] = useState(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000');

    ws.onopen = () => {
      setStatus('Kapcsolódva a szerverhez.');
      setConnected(true);

      ws.send(
        JSON.stringify({
          type: 'pair_request',
          pairId: pairId,
        })
      );
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'pair_status') {
        if (message.status === 'connected') {
          setStatus('Kapcsolat létrejött a partnerrel.');
          setPartnerConnected(true);
        } else if (message.status === 'disconnected') {
          setStatus('Partner lecsatlakozott.');
          setPartnerConnected(false);
        }
      } else if (message.type === 'update_progress') {
        if (message.status === 'completed') {
          setOrderProcessed(true);
          setStatus('Kész, egészségedre!');
          setProgress(100);
        } else {
          setProgress(message.progress);
          setStatus(`Folyamat állapota: ${message.progress}%`);
        }
      } else if (message.type === 'error_status') {
        setErrorNumber(message.number);
        setError(true);

        const errorMessage =
          errorMessages.find((err) => err.code === message.number)?.message ||
          'Ismeretlen hiba történt.';
        setStatus(`${errorMessage}`);
      }
    };

    ws.onclose = () => {
      setStatus('A kapcsolat megszakadt.');
      setConnected(false);
      setPartnerConnected(false);
    };

    ws.onerror = (error) => {
      setStatus(`Hiba a kapcsolatban: ${error.message}`);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [pairId]);

  const handleOrderSubmit = () => {
    if (socket && socket.readyState === WebSocket.OPEN && partnerConnected) {
      const order = {
        type: 'tea_order',
        pairId,
        waterAmount: parseInt(waterAmount, 10),
        sugarAmount: parseInt(sugarAmount, 10),
        lemonJuice: parseInt(lemonJuice, 10),
        teaFilter,
      };

      socket.send(JSON.stringify(order));
      setStatus('Rendelés elküldve!');
      setSend(true);
    } else {
      setStatus('A WebSocket kapcsolat nincs aktív vagy nincs partner.');
    }
  };

  return (
    <div className="container">
      <h1>Tea rendelés</h1>
      <p
        className={`status ${status.includes('Hiba') ? 'error' : 'connected'}`}
      >
        Állapot: {status}
      </p>
      {!send && !error && (
        <>
          <div className="input-group">
            <label>Víz mennyisége (ml):</label>
            <input
              type="number"
              value={waterAmount}
              onChange={(e) => setWaterAmount(e.target.value)}
              placeholder="Pl.: 200"
            />
          </div>
          <div className="input-group">
            <label>Cukor (mg):</label>
            <input
              type="number"
              value={sugarAmount}
              onChange={(e) => setSugarAmount(e.target.value)}
              placeholder="Pl.: 10"
            />
          </div>
          <div className="input-group">
            <label>Citromlé (ml):</label>
            <input
              type="number"
              value={lemonJuice}
              onChange={(e) => setLemonJuice(e.target.value)}
              placeholder="Pl.: 5"
            />
          </div>
          <div className="input-group">
            <label>Tea filter típusa:</label>
            <select
              value={teaFilter}
              onChange={(e) => setTeaFilter(e.target.value)}
            >
              <option value="">Válassz egy típust</option>
              <option value="black">Fekete tea</option>
              <option value="green">Zöld tea</option>
              <option value="herbal">Gyümölcs tea</option>
            </select>
          </div>
          <button
            onClick={handleOrderSubmit}
            disabled={
              !connected ||
              !partnerConnected ||
              !waterAmount ||
              !sugarAmount ||
              !lemonJuice ||
              !teaFilter
            }
          >
            Rendelés elküldése
          </button>
        </>
      )}
      {error && (
        <div className="error-display">
          <svg width="150" height="150" viewBox="0 0 150 150">
            <circle
              cx="75"
              cy="75"
              r="70"
              stroke="red"
              strokeWidth="10"
              fill="none"
            />
            <line
              x1="45"
              y1="45"
              x2="105"
              y2="105"
              stroke="red"
              strokeWidth="10"
            />
            <line
              x1="105"
              y1="45"
              x2="45"
              y2="105"
              stroke="red"
              strokeWidth="10"
            />
          </svg>
        </div>
      )}
      {send && !error && (
        <div className="progress-circle">
          <svg width="150" height="150" viewBox="0 0 150 150">
            <circle
              cx="75"
              cy="75"
              r="70"
              stroke="#ddd"
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx="75"
              cy="75"
              r="70"
              stroke={orderProcessed ? 'green' : 'orange'}
              strokeWidth="10"
              strokeDasharray={`${(progress / 100) * 440} 440`}
              fill="none"
            />
            {orderProcessed ? (
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                stroke="green"
                strokeWidth="2px"
                dy=".3em"
                fontSize="50"
              >
                ✔️
              </text>
            ) : (
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                strokeWidth="2px"
                dy=".3em"
                fontSize="30"
              >
                {progress}%
              </text>
            )}
          </svg>
          <button
            onClick={() => {
              setSend(false);
              setProgress(0);
              setOrderProcessed(false);
            }}
            className="reset-button"
          >
            Új rendelés
          </button>
        </div>
      )}
    </div>
  );
};

export default TeaOrder;
