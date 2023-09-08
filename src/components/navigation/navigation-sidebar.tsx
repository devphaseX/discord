import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { currentProfile } from '@/lib/current-profile';
import { db } from '@/schema/db';
import { members, servers } from '@/schema/tables';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NavigationAction } from './navigation-action';
import { NavigationItem } from './navigation-item';
import { ModeToggle } from '@/components/mode-toggle';
import { UserButton } from '@clerk/nextjs';

export const NavigationSidebar = async () => {
  const profile = await currentProfile();

  if (!profile) {
    return redirect('/');
  }

  const joinedServers = await db
    .select({
      id: servers.id,
      name: servers.name,
      imageUrl: servers.imageUrl,
      inviteCode: servers.inviteCode,
      profileId: servers.profileId,
      createdAt: servers.createdAt,
      updateAt: servers.updateAt,
    })
    .from(members)
    .innerJoin(servers, eq(servers.id, members.serverId))
    .where(eq(members.profileId, profile.id));

  return (
    <div className="space-y-4 flex flex-col items-center h-full text-primary w-full dark:bg-[#1E1F22] py-3">
      <NavigationAction />
      <Separator className="h-[2px] bg-zinc-300 dark:bg-zinc-700 rounded-md w-10 mx-auto" />
      <ScrollArea className="flex-1 w-full">
        {joinedServers.map((server) => (
          <div key={server.id} className="mb-4">
            <NavigationItem
              id={server.id}
              name={server.name}
              key={server.id}
              imageUrl={server.imageUrl ?? ''}
            />
          </div>
        ))}
      </ScrollArea>

      <div className="pb-3 mt-auto flex items-center flex-col gap-y-4">
        <ModeToggle />
        <UserButton
          afterSignOutUrl="/"
          appearance={{ elements: { avatarBox: 'h-[48px] w-[48px]' } }}
        />
      </div>
    </div>
  );
};
