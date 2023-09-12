import { currentProfile } from '@/lib/current-profile';
import { db } from '@/schema/db';
import {
  MemberRole,
  SelectMember,
  channels,
  clientInsertChannel,
  members,
  servers,
} from '@/schema/tables';
import { NextResponse } from 'next/server';
import { getUrlQuery } from '@/lib/query';
import { ZodError, object, string } from 'zod';
import { DrizzleError, eq, not, sql } from 'drizzle-orm';
import {
  BAD_REQUEST,
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
  SERVICE_UNAVAILABLE,
  UNAUTHORIZED,
  UNPROCESSABLE_ENTITY,
} from 'http-status';
import { fromZodError } from 'zod-validation-error';
interface UpdateChannelAPIContext {
  params: { channelId: string };
}

export async function DELETE(
  req: Request,
  { params }: UpdateChannelAPIContext
) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const { serverId } = getUrlQuery(req, (query) =>
      object({ serverId: string().uuid() }).parse(query)
    );
    const channelId = string()
      .uuid({ message: 'Invalid channel Id' })
      .parse(params.channelId);
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
    await db.delete(channels).where(
      sql`${channels.id} = ${channelId} and ${channels.profileId} = ${profile.id}
            and ${channels.serverId} = ${serverId}`
    );
    return new NextResponse('Delete channel with id ' + channelId);
  } catch (e) {
    console.log('[DELETE CHANNEL]', e);

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
interface UpdateChannelAPIContext {
  params: { channelId: string };
}

export const PATCH = async (
  req: Request,
  { params: { channelId } }: UpdateChannelAPIContext
) => {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse('Unauthorize', { status: UNAUTHORIZED });
    }
    const { serverId } = getUrlQuery(req, (query) =>
      object({ serverId: string().uuid() }).parse(query)
    );

    const body = clientInsertChannel.parse(await req.json());

    if (body.name.toLowerCase() === 'general') {
      return new NextResponse('General channel name cannot be change', {
        status: FORBIDDEN,
      });
    }

    const [server] = await db
      .select({
        id: servers.id,
        name: servers.name,
        inviteCode: servers.inviteCode,
        profileId: servers.profileId,
        membership: sql<
          Array<SelectMember>
        >`(SELECT json_agg(${members}) FROM ${members}
           WHERE ${members.profileId} = ${profile.id} and ${members.serverId} = ${serverId}
          )`,
        ownedChannel: channels,
      })
      .from(channels)
      .fullJoin(
        servers,
        sql`${channels.serverId} = ${servers.id} and ${serverId} = ${servers.id}`
      )
      .where(
        sql`${eq(channels.id, channelId)} and ${not(
          eq(channels.name, 'general')
        )}`
      );

    if (!server?.id) {
      return new NextResponse('Server not found in records.', {
        status: UNPROCESSABLE_ENTITY,
      });
    }

    if (!server.ownedChannel) {
      return new NextResponse('Channel not belong this server', {
        status: FORBIDDEN,
      });
    }

    if (!server.membership.length) {
      return new NextResponse('You are not a channel member', {
        status: FORBIDDEN,
      });
    }

    const [membership] = server.membership;

    if (membership.role === 'GUEST') {
      return new NextResponse(
        'Guests are not permitted to update channel related information',
        {
          status: FORBIDDEN,
        }
      );
    }

    const updatedChannel = await db
      .update(channels)
      .set(body)
      .where(eq(channels.id, channelId))
      .returning();

    return NextResponse.json(updatedChannel);
  } catch (e) {
    console.log('[PATCH CHANNEL iD]: ', e);
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

    if (e instanceof ZodError) {
      return new NextResponse(
        fromZodError(e, { issueSeparator: ';', prefix: '[Body]' }).message,
        { status: BAD_REQUEST }
      );
    }

    return new NextResponse('Something went wrong while updating server info', {
      status: INTERNAL_SERVER_ERROR,
    });
  }
};
