import { currentProfile } from '@/lib/current-profile';
import { db } from '@/schema/db';
import { members, servers } from '@/schema/tables';
import { and, eq, sql } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { ClientRedirectAuth } from '@/components/client-auth-redirect';
import { auth } from '@clerk/nextjs';
import { initialProfile } from '@/lib/initial-profile';

interface InviteCodePageProps {
  params: {
    inviteCode: string;
  };
}

const InviteCodePage = async ({
  params: { inviteCode },
}: InviteCodePageProps) => {
  let profile = await currentProfile();
  const session = auth();

  if (!(profile || session.userId)) {
    return <ClientRedirectAuth createRoutePath={`/invite/${inviteCode}`} />;
  }

  if (session.userId && !profile) {
    profile = await initialProfile().catch(() => null);
  }

  if (!(inviteCode && profile)) return redirect('/');

  const [existingServer] = await db
    .select({
      id: servers.id,
      name: servers.name,
      membership: members,
    })
    .from(servers)
    .where(eq(servers.inviteCode, inviteCode))
    .leftJoin(
      members,
      sql`${members.serverId} = ${servers.id} and ${members.profileId} = ${profile.id}`
    );

  if (!existingServer) {
    return notFound();
  }

  if (existingServer.membership) {
    return redirect(`/servers/${existingServer.id}`);
  }

  await db.insert(members).values({
    profileId: profile.id as string,
    serverId: existingServer.id,
  });

  return redirect(`/servers/${existingServer.id}`);
};

export default InviteCodePage;
