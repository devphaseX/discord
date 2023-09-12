import { currentProfile } from '@/lib/current-profile';
import { db } from '@/schema/db';
import { members, profiles } from '@/schema/tables';
import { DrizzleError, inArray, sql } from 'drizzle-orm';
import {
  BAD_REQUEST,
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  SERVICE_UNAVAILABLE,
  UNAUTHORIZED,
} from 'http-status';
import { NextResponse } from 'next/server';
import { string } from 'zod';

interface LeaveServerAPIContext {
  params: { serverId: string };
}

export const DELETE = async (
  req: Request,
  { params: { serverId } }: LeaveServerAPIContext
) => {
  let profileId;
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse('Unauthorize', { status: UNAUTHORIZED });
    }

    profileId = profile.id;
    if (!string().uuid().safeParse(serverId).success) {
      return new NextResponse('[Query]: Invalid server Id', {
        status: BAD_REQUEST,
      });
    }

    await db
      .delete(members)
      .where(
        sql`${members.profileId} = ${profile.id} and ${
          members.serverId
        } = ${serverId} and ${inArray(members.role, ['GUEST', 'MODERATOR'])}`
      );

    return new NextResponse('Member removed from server');
  } catch (e) {
    console.log('[LEAVING SERVER ID]', e);

    if (e instanceof DrizzleError) {
      if (e.name.match(/42P01/i) || e.message.match(/no rows in result set/i)) {
        return new NextResponse('The requested resource does not exist.', {
          status: NOT_FOUND,
        });
      }

      if (profileId) {
        const [member] = await db.select().from(members).where(sql`
          ${members.profileId} = ${profileId} and ${members.serverId}
          `);

        if (member && member.role === 'ADMIN') {
          return new NextResponse('Admin cannot leave the server', {
            status: FORBIDDEN,
          });
        }
      }

      return new NextResponse('Something went wrong while leaving server', {
        status: SERVICE_UNAVAILABLE,
      });
    }
    return new NextResponse('Internal server error', {
      status: INTERNAL_SERVER_ERROR,
    });
  }
};
