import { currentProfile } from '@/lib/current-profile';
import { db } from '@/schema/db';
import {
  SelectConversation,
  channels,
  members,
  profiles,
  servers,
} from '@/schema/tables';
import { redirectToSignIn } from '@clerk/nextjs';
import { eq, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';

interface ServerIDPageProps {
  params: { serverId: string };
}

export const revalidate = 0;

const CurrentServerPage = async ({
  params: { serverId },
}: ServerIDPageProps) => {
  const profile = await currentProfile();
  if (!profile) return redirectToSignIn();

  const [serverMembershipInfo] = await db
    .select({
      id: members.id,
      role: members.role,
      profileId: members.profileId,
      serverId: members.serverId,
      server: servers,
      serverChannels: sql<
        Array<SelectConversation>
      >`(SELECT json_agg(${channels}) FROM ${channels} WHERE ${channels.serverId} = ${serverId} ANd ${channels.name} = 'general')`,
    })
    .from(members)
    .where(
      sql`${members.profileId} = ${profile.id} and ${members.serverId} = ${serverId}`
    )
    .innerJoin(servers, eq(servers.id, members.serverId))
    .innerJoin(profiles, eq(members.profileId, profile.id));

  if (!serverMembershipInfo) {
    return redirect('/');
  }

  const generalChannel = serverMembershipInfo.serverChannels?.find((channel) =>
    /general/i.test(channel.name)
  );

  if (!generalChannel) {
    return null;
  }

  return redirect(`/servers/${serverId}/channels/${generalChannel.id}`);
};

export default CurrentServerPage;
