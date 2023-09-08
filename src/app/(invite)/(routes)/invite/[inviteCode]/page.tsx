import { currentProfile } from '@/lib/current-profile';
import { db } from '@/schema/db';
import { members, servers } from '@/schema/tables';
import { eq } from 'drizzle-orm';
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
    .select()
    .from(servers)
    .where(eq(servers.inviteCode, inviteCode))
    .leftJoin(members, eq(members.profileId, profile.id));

  if (!existingServer) {
    return notFound();
  }

  if (existingServer.members) {
    return redirect(`/servers/${existingServer.servers.id}`);
  }

  await db.insert(members).values({
    profileId: profile.id as string,
    serverId: existingServer.servers.id,
  });

  return redirect(`/servers/${existingServer.servers.id}`);
};

export default InviteCodePage;
