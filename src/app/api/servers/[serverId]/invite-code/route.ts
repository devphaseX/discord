import { currentProfile } from '@/lib/current-profile';
import { db } from '@/schema/db';
import { servers } from '@/schema/tables';
import { Params } from 'next/dist/shared/lib/router/utils/route-matcher';
import { NextResponse } from 'next/server';
import { string } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { DrizzleError, sql } from 'drizzle-orm';
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  UNAUTHORIZED,
  UNPROCESSABLE_ENTITY,
} from 'http-status';

interface CurrentServerAPIParams extends Params {
  serverId: string;
}

interface UpdateServerAPIContext {
  params: CurrentServerAPIParams;
}

export const PATCH = async (
  req: Request,
  { params: { serverId } }: UpdateServerAPIContext
) => {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse('Unauthorized', { status: UNAUTHORIZED });
    }

    if (!string().uuid().safeParse(serverId).success) {
      return new NextResponse('Server ID not valid', { status: BAD_REQUEST });
    }

    const [server] = await db
      .update(servers)
      .set({ inviteCode: uuidv4() })

      .where(
        sql`${servers.id} = ${serverId} and ${servers.profileId} = ${profile.id}`
      )
      .returning();

    return NextResponse.json(server);
  } catch (e) {
    if (e instanceof DrizzleError) {
      const message = e.message.toLowerCase();
      if (
        message.match(/UPDATE ON CONFLICT DO NOTHING/i) ||
        (message.includes('update') &&
          message.includes('conflict') &&
          message.includes('do nothing'))
      ) {
        return new NextResponse('Invalid server Id', {
          status: UNPROCESSABLE_ENTITY,
        });
      }
    }

    return new NextResponse('An error occured', {
      status: INTERNAL_SERVER_ERROR,
    });
  }
};
