import { InitialModal } from '@/components/modals/initial-modal';
import { initialProfile } from '@/lib/initial-profile';
import { db } from '@/schema/db';
import { members, profiles, servers } from '@/schema/tables';
import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

const SetupPage = async () => {
  const profile = await initialProfile();

  const [server] = await db
    .select({
      id: servers.id,
      name: servers.name,
    })
    .from(members)
    .innerJoin(servers, eq(servers.id, members.serverId))
    .where(eq(members.profileId, profile.id));

  if (server) {
    return redirect(`/servers/${server.id}`);
  }

  return <InitialModal />;
};

export default SetupPage;
