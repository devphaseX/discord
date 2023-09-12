import { currentProfile } from '@/lib/current-profile';
import { db } from '@/schema/db';
import {
  ChannelType,
  MemberRole,
  SelectConversation,
  SelectProfile,
  SelectServer,
  channels,
  members,
  profiles,
  servers,
} from '@/schema/tables';
import { and, eq, not, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { ServerHeader } from './server-header';
import { GroupedChannel } from '@/type';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchEntity, ServerSearch } from './server-search';
import { Hash, Mic, ShieldAlert, ShieldCheck, Video } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ServerSection } from './server-section';
import { ServerChannel } from './server-channel';
import { ServerMember } from './server-member';
import { headers } from 'next/headers';

interface ServerSidebarProps {
  serverId: string;
}

export const ServerSidebar = async ({ serverId }: ServerSidebarProps) => {
  const profile = await currentProfile();
  if (!profile) {
    return redirect('/');
  }

  const [[currentUserMembership], [joined_server]] = await Promise.all([
    db
      .select()
      .from(members)
      .where(
        and(eq(members.profileId, profile.id), eq(members.serverId, serverId))
      ),
    db
      .select({
        id: servers.id,
        name: servers.name,

        imageUrl: servers.imageUrl,
        createdAt: servers.createdAt,
        inviteCode: servers.inviteCode,
        updateAt: servers.updatedAt,
        profileId: servers.profileId,
        channels: sql<Array<GroupedChannel>>`json_agg(${channels})`.mapWith(
          (value: Array<SelectConversation>) =>
            value.reduce((acc, cur) => {
              const channelTypeList = acc[cur.type] || (acc[cur.type] = []);
              channelTypeList.push(cur);
              return acc;
            }, {} as GroupedChannel)
        ),

        currentMembersSize: sql<number>`(
          SELECT
            COUNT(DISTINCT ${members.profileId}) AS member_count
          FROM ${members}
          WHERE ${members.serverId} = ${servers.id}
        )`
          .mapWith(Number)
          .as('member_count'),
        members: sql<
          | {
              id: string;
              name: string;
              email: string;
              role: MemberRole;
              imageUrl: string;
              memberId: string;
              serverId: string;
              profileId: string;
              userId: string;
              profile: SelectProfile;
            }[]
        >`(SELECT
          json_agg(json_build_object('id', ${members.id},'name', ${profiles.name},
          'email', ${profiles.email},'imageUrl', ${profiles.imageUrl},'memberId',${members.id},
          'role',${members.role}, 'serverId', ${members.serverId},'userId', ${profiles.userId}, 'profileId',
         ${members.profileId}, 'profile',
         jsonb_build_object('id',${profiles.id},
         'name', ${profiles.name},'email',
         ${profiles.email},'userId', ${profiles.userId},
          'imageUrl', ${profiles.imageUrl})))
        FROM ${members}
        INNER JOIN profiles ON ${members.profileId} = ${profiles.id}
        WHERE ${members.serverId} = ${servers.id}
        GROUP BY ${members.serverId})
        `,
      })
      .from(servers)
      .where(eq(servers.id, serverId))
      .innerJoin(channels, eq(channels.serverId, servers.id))
      .groupBy(servers.id),
  ]);

  if (!(joined_server && currentUserMembership)) {
    return redirect('/');
  }

  const { channels: channelsData, members: membersData } = joined_server;

  const currentUserRole = currentUserMembership.role;
  const searchOptions: Array<SearchEntity> = [];
  {
    const availableServerChannelsType = Object.keys(
      channelsData
    ) as ReadonlyArray<ChannelType>;

    availableServerChannelsType.forEach((type) => {
      searchOptions.push({
        label: `${type.toUpperCase()} Channels`,
        type: 'channel',
        data: channelsData[type]?.map(({ id, name }) => ({
          id,
          name,
          icon: iconMap[type],
        })),
      });
    });
  }

  if (!membersData) joined_server.members = [];

  if (membersData?.length) {
    searchOptions.push({
      label: 'Member Channels',
      type: 'member',
      data: membersData.map(({ id, name, role }) => ({
        id,
        name,
        icon: roleIconMap[role],
      })),
    });
  }

  return (
    <div className="flex flex-col h-full text-primary w-full dark:bg-[#2B2D31] bg-[#F2F3F5]">
      <ServerHeader
        server={joined_server}
        currentUserServerRole={currentUserMembership.role}
      />
      <ScrollArea className="flex-1 px-3">
        <div className="mt-2">
          <ServerSearch entities={searchOptions} />
        </div>
        <Separator className="bg-zinc-200 dark:bg-zinc-700 rounded-md my-2" />

        {(Object.keys(channelsData) as Array<ChannelType>).map(
          (channelType) => (
            <div className="mb-2">
              <ServerSection
                sectionType="channel"
                role={currentUserRole}
                key={channelType}
                channelType={channelType}
                label={`${channelType.toUpperCase()} Channels`}
              />
              {channelsData[channelType].map((channel) => (
                <ServerChannel
                  key={channel.id}
                  channel={channel as SelectConversation}
                  server={joined_server}
                  role={currentUserRole}
                />
              ))}
            </div>
          )
        )}

        {membersData.length && (
          <div className="mb-2">
            <ServerSection
              sectionType="member"
              role={currentUserRole}
              label="Members"
            />
            {membersData.map((member) => (
              <ServerMember
                member={member}
                server={joined_server}
                key={member.id}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

const iconMap: Record<ChannelType, React.ReactNode | null> = {
  TEXT: <Hash className="mr-2 h-4 w-4" />,
  AUDIO: <Mic className="mr-2 h-4 w-4" />,
  VIDEO: <Video className="mr-2 h-4 w-4" />,
};

const roleIconMap: Record<MemberRole, React.ReactNode> = {
  GUEST: null,
  MODERATOR: <ShieldCheck className="h-4 w-4 mr-2 text-indigo-500" />,
  ADMIN: <ShieldAlert className="h-4 w-4 mr-2 text-rose-500" />,
};
