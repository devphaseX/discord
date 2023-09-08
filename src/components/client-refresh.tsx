'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const ClientRefresh = () => {
  const router = useRouter();

  useEffect(() => {
    router.refresh();
  }, []);

  return null;
};
