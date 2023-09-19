import { ChatMessages } from '@/components/chat-messages';
import { ChatHeader } from '@/components/chat/chat-header';
import { ChatInput } from '@/components/chat/chat-input';
import { currentProfile } from '@/lib/current-profile';
import { db } from '@/schema/db';
import {
  SelectMember,
  channels,
  members,
  profiles,
  servers,
} from '@/schema/tables';
import { redirectToSignIn } from '@clerk/nextjs';
import { eq, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';

interface ChannelIdPageProps {
  params: {
    serverId: string;
    channelId: string;
  };
}

const ChannelIdPage = async ({ params }: ChannelIdPageProps) => {
  const profile = await currentProfile();
  if (!profile) {
    return redirectToSignIn();
  }

  const [channelInfo] = await db
    .select({
      id: channels.id,
      name: channels.name,
      serverId: channels.serverId,
      profileId: channels.profileId,
      associatedServer: servers,
      currentUserMembership: sql<[SelectMember] | null>`(SELECT
        json_agg(json_build_object('id', ${members.id},'name', ${profiles.name},
        'email', ${profiles.email},'imageUrl', ${profiles.imageUrl},'memberId',${members.id},
        'role',${members.role}, 'serverId', ${members.serverId},'userId', ${profiles.userId}, 'profileId',
       ${members.profileId}, 'profile',
       jsonb_build_object('id',${profiles.id},
       'name', ${profiles.name},'email',
       ${profiles.email},'userId', ${profiles.userId},
        'imageUrl', ${profiles.imageUrl})))
      FROM ${members}
      INNER JOIN ${profiles} ON ${members.profileId} = ${profiles.id}
      WHERE ${members.serverId} = ${params.serverId} AND ${members.profileId} = ${profile.id})
      `,
    })
    .from(channels)
    .innerJoin(servers, eq(channels.serverId, servers.id))
    .where(eq(channels.id, params.channelId));

  if (!(channelInfo && channelInfo.currentUserMembership?.[0])) {
    return redirect('/');
  }

  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <ChatHeader
        name={channelInfo.name}
        serverId={channelInfo.serverId}
        type="channel"
      />
      <ChatMessages
        member={channelInfo.currentUserMembership[0]!}
        name={channelInfo.name}
        chatId={channelInfo.id}
        type="channel"
        apiUrl="/api/messages"
        socketUrl="/api/socket/messages"
        socketQuery={{
          channelId: channelInfo.id,
          serverId: channelInfo.serverId,
        }}
        paramKey="channelId"
        paramValue={channelInfo.id}
      />
      <ChatInput
        name={channelInfo.name}
        type="channel"
        apiUrl="/api/socket/messages"
        query={{
          channelId: channelInfo.id,
          serverId: channelInfo.serverId,
        }}
      />
    </div>
  );
};

export default ChannelIdPage;
