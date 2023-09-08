import { GroupedChannel } from '@/components/server/server-sidebar';
import { currentProfile } from '@/lib/current-profile';
import { db } from '@/schema/db';
import {
  SelectChannel,
  SelectProfile,
  channels,
  clientInsertServer,
  members,
  profiles,
  servers,
} from '@/schema/tables';
import { ServerWithMembersWithProfiles } from '@/type';
import { DrizzleError, eq, sql } from 'drizzle-orm';
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  UNAUTHORIZED,
  UNPROCESSABLE_ENTITY,
} from 'http-status';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

interface ServerIdParams {
  serverId: string;
}

interface UpdateServerAPIContext {
  params: ServerIdParams;
}

export const PATCH = async (
  req: Request,
  { params: { serverId } }: UpdateServerAPIContext
) => {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse('Unauthorize', { status: UNAUTHORIZED });
    }

    const { name, imageUrl } = clientInsertServer
      .deepPartial()
      .parse(await req.json());

    const updateServerInfo = await db
      .update(servers)
      .set({ name, imageUrl })
      .where(
        sql`${servers.id} = ${serverId} and ${servers.profileId} = ${profile.id}`
      )
      .returning();

    return NextResponse.json(updateServerInfo);
  } catch (e) {
    console.log('[PATCH SERVER iD]: ', e);
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

interface GetServerIdAPIContext {
  params: ServerIdParams;
}

export const GET = async (
  _req: Request,
  { params: { serverId } }: GetServerIdAPIContext
) => {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse('Unauthorize', { status: UNAUTHORIZED });
    }

    const [joined_server] = await db
      .select({
        server: servers,
        channels: sql<GroupedChannel>`json_agg(${channels})`.mapWith(
          (value: Array<SelectChannel>) =>
            value.reduce((acc, cur) => {
              const channelTypeList = acc[cur.type] || (acc[cur.type] = []);
              channelTypeList.push(cur);
              return acc;
            }, {} as GroupedChannel)
        ),
        currentMembersSize: sql<number>`count(${members})`.mapWith(Number),
        members: sql<
          {
            id: string;
            role: string;
            serverId: string;
            profileId: string;
            profile: SelectProfile;
          }[]
        >`json_agg(json_build_object('id', ${members.id}, 'role',
       ${members.role}, 'serverId', ${members.serverId}, 'profileId',
       ${members.profileId}, 'profile', 
       json_build_object('id',${profiles.id}, 
       'name', ${profiles.name},'email', 
       ${profiles.email},'userId', ${profiles.userId},
        'imageUrl', ${profiles.imageUrl})))`,
      })
      .from(servers)
      .where(eq(servers.id, serverId))
      .innerJoin(channels, eq(channels.serverId, servers.id))
      .innerJoin(members, eq(members.serverId, servers.id))
      .innerJoin(profiles, eq(members.profileId, profiles.id))
      .groupBy(servers.id);

    if (!joined_server) {
      return new NextResponse('Server not found', { status: NOT_FOUND });
    }

    const { server, currentMembersSize, members: _members } = joined_server;

    const serverWithMembers: ServerWithMembersWithProfiles = {
      ...server,
      currentMembersSize,
      members: _members as ServerWithMembersWithProfiles['members'],
    };

    return NextResponse.json(serverWithMembers);
  } catch (e) {
    console.log('[GET SERVER ID]', e);
    return new NextResponse('Something went wrong while getting server', {
      status: INTERNAL_SERVER_ERROR,
    });
  }
};
