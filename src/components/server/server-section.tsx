'use client';

import {
  ChannelType,
  MemberRole,
  memberRole,
  nativeMemberRole,
} from '@/schema/tables';
import { SearchEntityType } from './server-search';
import { ServerWithMembersWithProfiles } from '@/type';
import { convertPgEnumNative } from '@/lib/utils';
import { ActionTooltip } from '@/components/navigation/action-tooltip';
import { Plus, Settings } from 'lucide-react';
import { useModal } from '@/hooks/use-modal-store';

interface ServerSectionProps {
  label: string;
  role?: MemberRole;
  sectionType: SearchEntityType;
  channelType?: ChannelType;
  server?: ServerWithMembersWithProfiles;
}

export const ServerSection: React.FC<ServerSectionProps> = ({
  label,
  role,
  sectionType,
  channelType,
  server,
}) => {
  const { onOpen } = useModal();
  return (
    <div className="flex items-center justify-between py-2">
      <p className="text-xs uppercase font-semibold text-zinc-500  dark:text-zinc-400">
        {label}
      </p>
      {role !== nativeMemberRole.GUEST && sectionType === 'channel' && (
        <ActionTooltip label="Create Channel" side="top">
          <button
            className="text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
            onClick={() =>
              onOpen('createChannel', { preDetermineChannelType: channelType })
            }
          >
            <Plus className="w-4 h-4 " />
          </button>
        </ActionTooltip>
      )}

      {role === 'ADMIN' && sectionType === 'member' && (
        <ActionTooltip label="Settings" side="top">
          <button
            className="text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
            onClick={() => onOpen('members', { server })}
          >
            <Settings className="w-4 h-4 " />
          </button>
        </ActionTooltip>
      )}
    </div>
  );
};
