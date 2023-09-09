import { currentProfile } from '@/lib/current-profile';
import { db } from '@/schema/db';
import {
  MemberRole,
  channels,
  clientInsertChannel,
  members,
  servers,
} from '@/schema/tables';
import { NextResponse } from 'next/server';
import { getUrlQuery } from '@/lib/query';
import { ZodError, object, string } from 'zod';
import { DrizzleError, eq } from 'drizzle-orm';
import {
  FORBIDDEN,
  SERVICE_UNAVAILABLE,
  UNPROCESSABLE_ENTITY,
} from 'http-status';
import { fromZodError } from 'zod-validation-error';
interface CreateChannelAPIContext {
  params: { channelId: string };
}

export async function POST(req: Request, {}: CreateChannelAPIContext) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { serverId } = getUrlQuery(req, (query) =>
      object({ serverId: string().uuid() }).parse(query)
    );

    const body = clientInsertChannel.parse(await req.json());

    const [server] = await db
      .select({
        id: servers.id,
        name: servers.name,
        members: members,
      })
      .from(servers)
      .where(eq(servers.id, serverId))
      .leftJoin(members, eq(members.profileId, profile.id));

    if (!server) {
      return new NextResponse('Server not found in records.', {
        status: UNPROCESSABLE_ENTITY,
      });
    }

    if (!server.members) {
      return new NextResponse('You are not a member of this server.', {
        status: FORBIDDEN,
      });
    }

    if (server.members.role === 'GUEST') {
      return new NextResponse(
        `Only ${(<Array<MemberRole>>['ADMIN', 'MODERATOR'])
          .map((role) => `${role.toLowerCase()}s`)
          .join(' and ')} can create channels.`,
        { status: FORBIDDEN }
      );
    }

    const [channel] = await db
      .insert(channels)
      .values({
        name: body.name,
        type: body.type,
        profileId: profile.id,
        serverId,
      })
      .returning();

    return NextResponse.json(channel);
  } catch (e) {
    console.log('[CHANNEL_POST]', e);

    if (e instanceof ZodError) {
      return new NextResponse(fromZodError(e).toString(), {
        status: UNPROCESSABLE_ENTITY,
      });
    }

    if (e instanceof DrizzleError) {
      if (e.message.match(/duplicate key value/i)) {
        return new NextResponse(
          'duplicate channel with same name not allowed.',
          { status: UNPROCESSABLE_ENTITY }
        );
      }
      return new NextResponse('Service unavailable, please try again later.', {
        status: SERVICE_UNAVAILABLE,
      });
    }

    return new NextResponse('Internal Error', { status: 500 });
  }
}
