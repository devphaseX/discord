'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useModal } from '@/hooks/use-modal-store';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import axios from 'axios';

import { useParams, useRouter } from 'next/navigation';

export const DeleteChannelModal = () => {
  const { onClose, opened, type, data } = useModal();
  const shouldOpenModal = type === 'deleteChannel' && opened;
  const { server, channel } = data ?? {};
  const [leaveChannelActionActive, setLeaveChannelActionActive] =
    useState(false);
  const router = useRouter();
  const params = useParams() as { serverId: string };

  const onLeaveServer = async () => {
    if (!channel?.id) return;
    try {
      setLeaveChannelActionActive(true);
      const serverId = server?.id ?? params.serverId;

      const url = new URL(
        `/api/channels/${channel?.id}`,
        window.location.origin
      );

      url.search = new URLSearchParams({
        serverId,
      }).toString();

      await axios.delete(url.toString());
      onClose();
      router.push(`/servers/${serverId}`);
      router.refresh();
    } catch (e) {
    } finally {
      setLeaveChannelActionActive(false);
    }
  };
  return (
    <Dialog open={shouldOpenModal} onOpenChange={onClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Delete Channel
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500">
            Are you sure you want to do this{' '}
            <span className="font-semibold text-indigo-500">
              #{channel?.name ?? ''}
            </span>{' '}
            will permanently be deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="bg-gray-100 px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <Button
              disabled={leaveChannelActionActive}
              variant="ghost"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              disabled={leaveChannelActionActive}
              variant="primary"
              onClick={onLeaveServer}
            >
              Confirm
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
