import { auth } from '@clerk/nextjs';
import { db } from '@/schema/db';
import { eq } from 'drizzle-orm';
import { profiles } from '@/schema/tables';

export const currentProfile = async () => {
  const { userId } = auth();

  if (!userId) {
    return null;
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });

  return profile;
};
