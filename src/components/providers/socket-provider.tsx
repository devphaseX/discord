'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io as ClientIO } from 'socket.io-client';

export type ClientSocketIO = ReturnType<typeof ClientIO>;
type SocketContextType = {
  socket: ClientSocketIO | null;
  establishedConnection?: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  establishedConnection: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<ClientSocketIO | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketClient: ReturnType<typeof ClientIO> = new (ClientIO as any)(
      process.env.NEXT_PUBLIC_SITE_URL!,
      { path: '/api/socket/io', addTrailingSlash: false }
    );

    socketClient.on('connect', () => {
      setIsConnected(true);
    });

    socketClient.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(socketClient);

    return () => {
      socket?.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{ socket, establishedConnection: isConnected }}
    >
      {children}
    </SocketContext.Provider>
  );
};
