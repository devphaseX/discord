import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/schema/db';
import { eq } from 'drizzle-orm';
import { profiles } from '@/schema/tables';
import { NextApiRequest } from 'next';

export const currentProfilePage = async (req: NextApiRequest) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return null;
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });

  return profile;
};
