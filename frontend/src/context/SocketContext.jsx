import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { API_ORIGIN } from '../services/api';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket,          setSocket]          = useState(null);
  const [connected,       setConnected]       = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const intentionalRef = useRef(false);
  const isFirstConnectRef = useRef(true); // suppress toast on initial connect

  useEffect(() => {
    if (!user) {
      intentionalRef.current = true;
      if (socket) { socket.disconnect(); setSocket(null); }
      setConnected(false);
      setConnectionError(null);
      isFirstConnectRef.current = true;
      return;
    }

    intentionalRef.current = false;

    const token = localStorage.getItem('cp_token');
    const newSocket = io(API_ORIGIN || window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      setConnectionError(null);
      // Only show reconnect toast — not the first connection
      if (!isFirstConnectRef.current) {
        toast.success('Reconnected to live updates', { duration: 2000, id: 'socket-reconnect' });
      }
      isFirstConnectRef.current = false;
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      if (!intentionalRef.current) {
        setConnectionError('Live updates paused. Reconnecting…');
      }
    });

    // Attach reconnect_failed to the Manager (socket.io) — not the socket itself
    newSocket.io.on('reconnect_failed', () => {
      setConnected(false);
      if (!intentionalRef.current) {
        setConnectionError('Could not reconnect. Please refresh the page.');
        toast.error('Live updates unavailable. Refresh to retry.', { duration: 6000, id: 'socket-fail' });
      }
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
      setConnected(false);
    });

    newSocket.on('new_complaint', ({ complaint }) => {
      toast.success(`📢 New complaint: "${complaint.title}"`, { duration: 5000 });
    });

    newSocket.on('status_update', ({ title, status }) => {
      toast(`🔔 "${title}" → ${status}`, {
        icon: status === 'Resolved' ? '✅' : '🔄', duration: 5000,
      });
    });

    newSocket.on('priority_update', ({ title, priority }) => {
      toast(`⚑ Priority for "${title}" → ${priority}`, { duration: 5000 });
    });

    setSocket(newSocket);

    return () => {
      newSocket.io.off('reconnect_failed');
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected, connectionError }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
