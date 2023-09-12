'use client';

import { cn } from '@/lib/utils';
import {
  MemberRole,
  SelectConversation,
  SelectServer,
  channelTypeNative,
} from '@/schema/tables';
import { Edit, Hash, Lock, Mic, Trash, Video } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { ActionTooltip } from '../navigation/action-tooltip';
import { useModal } from '@/hooks/use-modal-store';
import { ServerWithMembersWithProfiles } from '@/type';

type Channel = SelectConversation;
type Server = SelectServer;

const iconMap = {
  [channelTypeNative.TEXT]: Hash,
  [channelTypeNative.AUDIO]: Mic,
  [channelTypeNative.VIDEO]: Video,
};

interface ServerChannelProps {
  channel: Channel;
  server: ServerWithMembersWithProfiles;
  role?: MemberRole;
}

interface ServerChannelContextParams {
  channelId?: string;
  serverId?: string;
}
export const ServerChannel: React.FC<ServerChannelProps> = ({
  channel,
  server,
  role: currentUserRole,
}) => {
  const params = useParams() as ServerChannelContextParams;
  const router = useRouter();

  const { onOpen } = useModal();

  const onClick = () => {
    router.push(`/servers/${params.serverId}/channels/${channel.id}`);
  };

  const Icon = iconMap[channel.type];
  return (
    <button
      onClick={onClick}
      className={cn(
        'group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1',
        params.channelId === channel.id && 'bg-zinc-700/20 dark:bg-zinc-700'
      )}
    >
      <Icon className="flex-shrink-0 w-5 h-5 text-zinc-500" />
      <p
        className={cn(
          'line-clamp-1 font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition',

          params.channelId === channel.id &&
            'text-primary dark:text-zinc-200 dark:group-hover:text-white'
        )}
      >
        {channel.name}
      </p>

      {channel.name.toLowerCase() !== 'general' &&
        currentUserRole !== 'GUEST' && (
          <div className="ml-auto flex items-center gap-x-2">
            <ActionTooltip label="Edit">
              <Edit
                className="hidden group-hover:block w-4 h-4 mr-2 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen('editChannel', {
                    channel,
                    server,
                  });
                }}
              />
            </ActionTooltip>
            <ActionTooltip label="Delete">
              <Trash
                className="hidden group-hover:block w-4 h-4 mr-2 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen('deleteChannel', { channel });
                }}
              />
            </ActionTooltip>
          </div>
        )}

      {channel.name.toLowerCase() === 'general' && (
        <Lock className="ml-auto w-4 h-4 text-zinc-400 dark:text-zinc-400" />
      )}
    </button>
  );
};
