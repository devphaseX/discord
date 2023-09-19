'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '../providers/socket-provider';
import { Badge } from './badge';

export const SocketIndicator = () => {
  const { establishedConnection } = useSocket();

  const [isMounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isMounted) return false;

  if (!establishedConnection) {
    return (
      <Badge variant="outline" className="bg-yellow-600 text-white border-none">
        Fallback: Polling every 1s
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-emerald-600 text-white border-none">
      Live: Real-time updates
    </Badge>
  );
};
