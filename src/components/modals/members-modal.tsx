'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useModal } from '@/hooks/use-modal-store';
import { ServerWithMembersWithProfiles } from '@/type';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from '@/components/user-avatar';
import { SelectMember, memberRole } from '@/schema/tables';
import {
  Check,
  Gavel,
  Loader2,
  MoreVertical,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import axios from 'axios';
import { useRouter } from 'next/navigation';

type RoleType = (typeof memberRole.enumValues)[number];
type RoleMapComponent = { [Role in RoleType]: React.ReactNode | null };
const roleIconMap = {
  GUEST: null,
  MODERATOR: <ShieldCheck className="h-4 w-4 ml-2 text-indigo-500" />,
  ADMIN: <ShieldAlert className="h-4 w-4 text-rose-500" />,
} satisfies RoleMapComponent;

function MarkActiveRole({
  expectedRole,
  member,
}: {
  member: SelectMember;
  expectedRole: RoleType;
}) {
  return member.role === expectedRole && <Check className="w-4 h-4 ml-auto" />;
}

export const MembersModal = () => {
  const { onClose, onOpen, opened, type, data } = useModal();
  const router = useRouter();
  const shouldOpenModal = type === 'members' && opened;
  const [currentActionUserId, setcurrentUserActionId] = useState<string | null>(
    null
  );

  if (!(shouldOpenModal && data?.server)) return null;

  const { server } = data as { server: ServerWithMembersWithProfiles };

  const onUserRoleChange = async ({
    memberId,
    role,
  }: {
    memberId: string;
    role: RoleType;
  }) => {
    try {
      setcurrentUserActionId(memberId);
      const url = new URL(`/api/members/${memberId}`, window.location.origin);
      const query = new URLSearchParams({
        ...url.searchParams,
        serverId: server.id,
      });
      url.search = query.toString();

      await axios.patch(url.toString(), { role });

      const response = await axios.get<ServerWithMembersWithProfiles>(
        `/api/servers/${server.id}`
      );
      router.refresh();

      onOpen('members', { server: response.data });
    } catch (e) {
      console.log(e);
    } finally {
      setcurrentUserActionId(null);
    }
  };

  const onKicKUser = async ({ memberId }: { memberId: string }) => {
    try {
      setcurrentUserActionId(memberId);
      const url = new URL(`/api/members/${memberId}`, window.location.origin);
      const query = new URLSearchParams({
        ...url.searchParams,
        serverId: server.id,
      });
      url.search = query.toString();

      await axios.delete(url.toString());

      const response = await axios.get<ServerWithMembersWithProfiles>(
        `/api/servers/${server.id}`
      );
      router.refresh();

      onOpen('members', { server: response.data });
    } catch (e) {
      console.log(e);
    } finally {
      setcurrentUserActionId(null);
    }
  };

  return (
    <Dialog open={shouldOpenModal} onOpenChange={onClose}>
      <DialogContent className="bg-white text-black overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Manage Members
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500">
            {server.currentMembersSize} members
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="mt-8 max-h-[420px] pr-6">
          {server.members.map((member) => (
            <div key={member.id} className="flex items-center gap-x-2 mb-6">
              <UserAvatar src={member.profile.imageUrl ?? undefined} />
              <div className="flex flex-col gap-y-1">
                <div className="text-xs font-semibold flex items-center gap-x-1">
                  {member.profile.name}
                  {member.role && roleIconMap[member.role]}
                </div>
                <p className="text-xs text-zinc-500`">{member.profile.email}</p>
              </div>
              {server.profileId !== member.profileId &&
                currentActionUserId !== member.id && (
                  <div className="ml-auto">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <MoreVertical className="h-4 w-4 text-zinc-500" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="left">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="flex items-center">
                            <ShieldQuestion className="h-4 w-4 mr-2" />
                            <span>Role</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              {(
                                ['GUEST', 'MODERATOR'] satisfies Array<
                                  Extract<RoleType, 'GUEST' | 'MODERATOR'>
                                >
                              ).map((role) => {
                                return (
                                  <DropdownMenuItem
                                    key={role}
                                    onClick={() =>
                                      member.role !== role &&
                                      onUserRoleChange({
                                        memberId: member.id,
                                        role,
                                      })
                                    }
                                  >
                                    <Shield className="w-4 h-4 mr-2 " />
                                    <span className="capitalize">
                                      {role.toLowerCase()}
                                    </span>
                                    <MarkActiveRole
                                      expectedRole={role}
                                      member={member}
                                    />
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onKicKUser({ memberId: member.id })}
                        >
                          <Gavel className="h-4 w-4 mr-2" />
                          Kick
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              {currentActionUserId === member.id && (
                <Loader2 className="animate-spin text-zinc-500 ml-auto w-4 h-4" />
              )}
            </div>
          ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
