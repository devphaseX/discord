'use client';
import { cn } from '@/lib/utils';
import {
  SelectMember,
  SelectProfile,
  SelectServer,
  memberRelations,
  nativeMemberRole,
} from '@/schema/tables';
import { RemoveDocDate } from '@/type';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/user-avatar';

type Member = RemoveDocDate<SelectMember> & {
  profile: RemoveDocDate<SelectProfile>;
};

interface ServerMemberProps {
  member: Member;
  server: RemoveDocDate<SelectServer>;
}

const roleIconMap = {
  [nativeMemberRole.GUEST]: null,
  [nativeMemberRole.MODERATOR]: (
    <ShieldCheck className="h-4 w-4 text-indigo-500" />
  ),
  [nativeMemberRole.ADMIN]: <ShieldAlert className="h-4 w-4 text-rose-500" />,
};

export const ServerMember: React.FC<ServerMemberProps> = ({ member }) => {
  const params = useParams() as { memberId: string; serverId: string };
  const router = useRouter();

  const roleIcon = roleIconMap[member.role];

  const onClick = () => {
    router.push(`/servers/${params.serverId}/conversations/${member.id}`);
  };

  return (
    <button
      className={cn(
        'group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1',
        params.memberId == member.id && 'bg-zinc-700/20 dark:bg-zinc-700'
      )}
      onClick={onClick}
    >
      <UserAvatar
        src={member.profile.imageUrl ?? undefined}
        className="h-8 w-8 md:h-8 md:w-8"
      />
      <p
        className={cn(
          'font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400  dark:group-hover:text-zinc-300 transition',
          params.memberId == member.id &&
            'text-primary dark:text-zinc-200 dark:group-hover:text-white '
        )}
      >
        {member.profile.name}
      </p>
      {roleIcon}
    </button>
  );
};
