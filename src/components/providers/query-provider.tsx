'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRef } from 'react';

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useRef(new QueryClient()).current;
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
