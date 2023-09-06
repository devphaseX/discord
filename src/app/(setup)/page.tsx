import { InitialModal } from '@/components/modals/initial-modal';
import { initialProfile } from '@/lib/initial-profile';
import { db } from '@/schema/db';
import { members } from '@/schema/tables';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

const SetupPage = async () => {
  const profile = await initialProfile();

  const server = await db.query.servers.findFirst({
    where: eq(members.profileId, profile.id),
    with: { serverMembers: true },
  });

  if (server) {
    return redirect(`/servers/${server.id}`);
  }

  return <InitialModal />;
};

export default SetupPage;
