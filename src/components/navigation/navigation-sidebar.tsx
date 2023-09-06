import { currentProfile } from '@/lib/current-profile';
import { db } from '@/schema/db';
import { servers } from '@/schema/tables';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { NavigationAction } from './navigation-action';

export const NavigationSidebar = async () => {
  const profile = await currentProfile();

  if (!profile) {
    return redirect('/');
  }

  db.query.servers.findMany({ where: eq(servers.profileId, profile.id) });
  return (
    <div className="space-y-4 flex flex-col items-center h-full text-primary w-full dark:bg-[#1E1F22] py-3">
      <NavigationAction />
    </div>
  );
};
