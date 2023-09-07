import { currentProfile } from '@/lib/current-profile';
import { removeTableInternalFields } from '@/lib/utils';
import { db } from '@/schema/db';
import {
  SelectChannel,
  SelectProfile,
  channels,
  members,
  profiles,
  servers,
} from '@/schema/tables';
import { eq, not, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { ServerHeader } from './server-header';
import { ServerWithMembersWithProfiles } from '@/type';

interface ServerSidebarProps {
  serverId: string;
}

export const ServerSidebar = async ({ serverId }: ServerSidebarProps) => {
  const profile = await currentProfile();
  if (!profile) {
    return redirect('/');
  }

  type GroupedChannel = { [T in SelectChannel['type']]: Array<SelectChannel> };

  const [[currentUserMembership], [joined_server]] = await Promise.all([
    db.select().from(members).where(eq(members.profileId, profile.id)),
    db
      .select({
        server: servers,
        channels: sql<GroupedChannel>`json_agg(${channels})`.mapWith(
          (value: Array<SelectChannel>) =>
            value.reduce((acc, cur) => {
              const channelTypeList = acc[cur.type] || (acc[cur.type] = []);
              channelTypeList.push(cur);
              return acc;
            }, {} as GroupedChannel)
        ),
        members: sql<
          {
            id: string;
            role: string;
            serverId: string;
            profileId: string;
            profile: SelectProfile;
          }[]
        >`json_agg(json_build_object('id', ${members.id}, 'role',
         ${members.role}, 'serverId', ${members.serverId}, 'profileId',
         ${members.profileId}, 'profile', ${profiles}))`,
      })
      .from(servers)
      .where(eq(servers.id, serverId))
      .innerJoin(channels, eq(channels.serverId, servers.id))
      .innerJoin(members, eq(members.serverId, servers.id))
      .innerJoin(profiles, eq(members.profileId, profile.id))
      .groupBy(servers.id),
  ]);

  if (!(joined_server && currentUserMembership)) {
    return redirect('/');
  }

  const { server, members: _members } = joined_server;
  const serverWithMembers: ServerWithMembersWithProfiles = {
    ...server,
    members: _members as ServerWithMembersWithProfiles['members'],
  };

  return (
    <div className="flex flex-col h-full text-primary w-full dark:bg-[#2B2D31] bg-[#F2F3F5]">
      <ServerHeader
        server={serverWithMembers}
        currentUserServerRole={currentUserMembership.role}
      />
    </div>
  );
};
