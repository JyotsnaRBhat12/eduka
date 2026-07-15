import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, tokens } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const notificationSocketRef = useRef(null);

  // Notifications socket connection
  useEffect(() => {
    if (!user || !tokens?.access) {
      setNotifications([]);
      if (notificationSocketRef.current) {
        notificationSocketRef.current.close();
        notificationSocketRef.current = null;
      }
      return;
    }

    let ws;
    let reconnectTimeout;
    let isComponentMounted = true;

    const connect = () => {
      if (!isComponentMounted) return;

      const wsUrl = `ws://localhost:8000/ws/notifications/?token=${tokens.access}`;
      ws = new WebSocket(wsUrl);
      notificationSocketRef.current = ws;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'initial_notifications') {
          setNotifications(data.notifications);
        } else if (data.type === 'new_notification') {
          setNotifications((prev) => [data.notification, ...prev]);
        } else if (data.type === 'notification_read') {
          setNotifications((prev) =>
            prev.map((n) => (n.id === data.notification_id ? { ...n, read_status: true } : n)).filter(n => !n.read_status)
          );
        }
      };

      ws.onclose = (event) => {
        console.log('Notification socket closed. Code:', event.code);
        if (isComponentMounted && user && tokens?.access) {
          reconnectTimeout = setTimeout(() => {
            console.log('Attempting to reconnect notification socket...');
            connect();
          }, 5000);
        }
      };

      ws.onerror = (err) => {
        console.error('Notification socket encountered error:', err);
        ws.close();
      };
    };

    connect();

    return () => {
      isComponentMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [user, tokens]);

  const markNotificationRead = (notificationId) => {
    if (notificationSocketRef.current && notificationSocketRef.current.readyState === WebSocket.OPEN) {
      notificationSocketRef.current.send(
        JSON.stringify({
          action: 'mark_read',
          notification_id: notificationId,
        })
      );
    }
  };

  // Chat socket instantiator helper
  const connectToChat = (courseId, onMessageReceived, onMessageModerated) => {
    if (!tokens?.access) return null;

    const wsUrl = `ws://localhost:8000/ws/chat/${courseId}/?token=${tokens.access}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message' && onMessageReceived) {
        onMessageReceived(data.message);
      } else if (data.type === 'moderate' && onMessageModerated) {
        onMessageModerated(data.message_id);
      }
    };

    const sendMessage = (content, parentId = null) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            action: 'message',
            content,
            parent_id: parentId,
          })
        );
      }
    };

    const moderateMessage = (messageId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            action: 'moderate',
            message_id: messageId,
          })
        );
      }
    };

    return {
      socket: ws,
      sendMessage,
      moderateMessage,
      close: () => ws.close(),
    };
  };

  return (
    <SocketContext.Provider value={{ notifications, markNotificationRead, connectToChat }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
