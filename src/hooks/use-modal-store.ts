import { ChannelType, SelectConversation } from '@/schema/tables';
import { ServerWithMembersWithProfiles } from '@/type';
import { create } from 'zustand';

export type ModalType =
  | 'createServer'
  | 'invite'
  | 'editServer'
  | 'editChannel'
  | 'members'
  | 'createChannel'
  | 'leaveServer'
  | 'deleteServer'
  | 'deleteChannel';

interface ModalData {
  server?: ServerWithMembersWithProfiles;
  channel?: SelectConversation;
  preDetermineChannelType?: ChannelType;
}

interface ModalStore {
  type: ModalType | null;
  data: ModalData | null;
  opened: boolean;
  onOpen(type: NonNullable<this['type']>, data?: ModalData): void;
  onClose: () => void;
}

export const useModal = create<ModalStore>((set, get) => ({
  opened: false,
  type: null,
  data: null,
  onOpen: (type, data) => {
    set({ opened: true, type, data: { ...get().data, ...data } });
  },

  onClose: () => set({ type: null, opened: false, data: null }),
}));
