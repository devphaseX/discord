import { currentUser, redirectToSignIn } from '@clerk/nextjs';
import { db } from '@/schema/db';
import { eq } from 'drizzle-orm';
import { SelectProfile, profiles } from '@/schema/tables';

export const initialProfile = async (): Promise<SelectProfile> => {
  const user = await currentUser();
  if (!user) {
    return redirectToSignIn();
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.id),
  });

  if (profile) return profile;

  const [newProfile] = await db
    .insert(profiles)
    .values({
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      imageUrl: user.imageUrl,
      email: user.emailAddresses[0].emailAddress,
    })
    .returning();

  return newProfile;
};
