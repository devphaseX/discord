'use client';
import { CreateServerModal } from '@/components/modals/create-server-modal';
import { useEffect, useState } from 'react';
import { InviteModal } from '@/components/modals/invite-modal';
import { EditServerModal } from '@/components/modals/edit-server-modal';
import { MembersModal } from '@/components/modals/members-modal';
import { ChannelModal } from '@/components/modals/channel-modal';
import { LeaveServerModal } from '../modals/leave-modal';
import { DeleteServerModal } from '../modals/delete-server';
import { DeleteChannelModal } from '../modals/delete-channel-modal';

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
      <EditServerModal />
      <MembersModal />
      <ChannelModal />
      <LeaveServerModal />
      <DeleteServerModal />
      <DeleteChannelModal />
    </>
  );
};
