'use client';

import { SelectMember } from '@/schema/tables';
import { ServerWithMembersWithProfiles } from '@/type';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import {
  ChevronDown,
  LogOut,
  PlusCircle,
  Settings,
  Trash,
  UserPlus,
  Users,
} from 'lucide-react';
import { useModal } from '@/hooks/use-modal-store';

interface ServerHeaderProps {
  server: ServerWithMembersWithProfiles;
  currentUserServerRole?: SelectMember['role'];
}

export const ServerHeader: React.FC<ServerHeaderProps> = ({
  server,
  currentUserServerRole,
}) => {
  const { onOpen } = useModal();
  const adminRoleUser = currentUserServerRole === 'ADMIN';
  const moderatorRoleUser =
    adminRoleUser || currentUserServerRole === 'MODERATOR';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none" asChild>
        <button className="w-full text-md font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2 hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition">
          {server.name}
          <ChevronDown className="h-5 w-5 ml-auto" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 text-xs font-medium text-black dark:text-neutral-400 space-y-[2px]">
        {moderatorRoleUser && (
          <>
            <DropdownMenuItem
              className="text-indigo-600 dark:text-indigo-400 px-3 py-2 text-sm cursor-pointer"
              onClick={() => onOpen('invite', { server })}
            >
              Invite People
              <UserPlus className="h-4 w-4 ml-auto" />
            </DropdownMenuItem>
            <DropdownMenuItem
              className="px-3 py-2 text-sm cursor-pointer"
              onClick={() => onOpen('createChannel')}
            >
              Create Channel
              <PlusCircle className="h-4 w-4 ml-auto" />
            </DropdownMenuItem>
          </>
        )}

        {adminRoleUser && (
          <>
            <DropdownMenuItem
              className="px-3 py-2 text-sm cursor-pointer"
              onClick={() => onOpen('editServer', { server })}
            >
              Server Settings
              <Settings className="h-4 w-4 ml-auto" />
            </DropdownMenuItem>
            <DropdownMenuItem
              className="px-3 py-2 text-sm cursor-pointer"
              onClick={() => onOpen('members', { server })}
            >
              Manage Members
              <Users className="h-4 w-4 ml-auto" />
            </DropdownMenuItem>
          </>
        )}

        {moderatorRoleUser && <DropdownMenuSeparator />}

        {adminRoleUser && (
          <>
            <DropdownMenuItem
              className="text-rose-500 px-3 py-2 text-sm cursor-pointer"
              onClick={() => onOpen('deleteServer', { server })}
            >
              Delete Channel
              <Trash className="h-4 w-4 ml-auto" />
            </DropdownMenuItem>
          </>
        )}

        {!adminRoleUser && (
          <>
            <DropdownMenuItem
              className="text-rose-500 px-3 py-2 text-sm cursor-pointer"
              onClick={() => onOpen('leaveServer', { server })}
            >
              Leave Server
              <LogOut className="h-4 w-4 ml-auto" />
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
