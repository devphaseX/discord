import { ServerSidebar } from '@/components/server/server-sidebar';
import { currentProfile } from '@/lib/current-profile';
import { db } from '@/schema/db';
import { members, servers } from '@/schema/tables';
import { redirectToSignIn } from '@clerk/nextjs';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

interface CurrentServerLayoutPageContext {
  children: React.ReactNode;
  params: { serverId: string };
}

const CurrentServerLayoutPage = async ({
  children,
  params: { serverId },
}: CurrentServerLayoutPageContext) => {
  const profile = await currentProfile();

  if (!profile) {
    return redirectToSignIn();
  }

  const [joined_server] = await db
    .select()
    .from(servers)
    .where(eq(servers.id, serverId))
    .innerJoin(members, eq(members.profileId, profile.id));

  if (!joined_server) {
    return redirect('/');
  }
  const { servers: server } = joined_server;
  return (
    <div className="h-full">
      <div className="hidden md:flex h-full w-60 z-20 fixed flex-col inset-y-0">
        <ServerSidebar serverId={server.id} />
      </div>
      <main className="h-full md:pl-60">{children}</main>
    </div>
  );
};

export default CurrentServerLayoutPage;
