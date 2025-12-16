import { useState, useEffect } from 'react';

const TRADEFOX_CONNECTED_KEY = 'polytrak_tradefox_connected';

export function useTradeFoxConnection() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const connected = localStorage.getItem(TRADEFOX_CONNECTED_KEY) === 'true';
    setIsConnected(connected);
  }, []);

  const connect = () => {
    localStorage.setItem(TRADEFOX_CONNECTED_KEY, 'true');
    setIsConnected(true);
  };

  const disconnect = () => {
    localStorage.removeItem(TRADEFOX_CONNECTED_KEY);
    setIsConnected(false);
  };

  return { isConnected, connect, disconnect };
}
