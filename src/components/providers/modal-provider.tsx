'use client';
import { CreateServerModal } from '@/components/modals/create-server-modal';
import { useEffect, useState } from 'react';
import { InviteModal } from '@/components/modals/invite-modal';
export const ModalProvider = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <CreateServerModal />
      <InviteModal />
    </>
  );
};
