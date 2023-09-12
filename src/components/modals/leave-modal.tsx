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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Copy, RefreshCw } from 'lucide-react';
import { useOrigin } from '@/hooks/use-origin';
import { useCopyToClipboard } from 'usehooks-ts';
import { useState } from 'react';
import axios from 'axios';
import { SelectServer, clientSelectServer } from '@/schema/tables';
import { ServerWithMembersWithProfiles } from '@/type';
import { useRouter } from 'next/navigation';

export const LeaveServerModal = () => {
  const { onClose, onOpen, opened, type, data } = useModal();
  const shouldOpenModal = type === 'leaveServer' && opened;
  const { server } = data ?? {};
  const [leaveServerActionActive, setLeaveServerActionActive] = useState(false);
  const router = useRouter();

  const onLeaveServer = async () => {
    try {
      setLeaveServerActionActive(true);

      await axios.delete(`/api/servers/${server?.id}/leave`);
      onClose();
      router.refresh();
      router.push('/');
    } catch (e) {
    } finally {
      setLeaveServerActionActive(false);
    }
  };
  return (
    <Dialog open={shouldOpenModal} onOpenChange={onClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Leave Server
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500">
            Are you sure you want to leave{' '}
            <span className="font-semibold text-indigo-500">
              {server?.name ?? ''}
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="bg-gray-100 px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <Button
              disabled={leaveServerActionActive}
              variant="ghost"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              disabled={leaveServerActionActive}
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
