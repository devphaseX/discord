import { SelectServer } from '@/schema/tables';
import { create } from 'zustand';

export type ModalType = 'createServer' | 'invite';

interface ModalData {
  server?: SelectServer;
}

interface ModalStore {
  type: ModalType | null;
  data: ModalData | null;
  opened: boolean;
  onOpen(type: NonNullable<this['type']>, data?: ModalData): void;
  onClose: () => void;
}

export const useModal = create<ModalStore>((set) => ({
  opened: false,
  type: null,
  data: null,
  onOpen: (type, data) => {
    set({ opened: true, type, data });
  },

  onClose: () => set({ type: null, opened: false, data: null }),
}));
