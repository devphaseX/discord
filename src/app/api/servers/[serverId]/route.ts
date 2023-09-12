import { currentProfile } from '@/lib/current-profile';
import { db } from '@/schema/db';
import {
  MemberRole,
  SelectChannel,
  SelectProfile,
  channels,
  clientInsertServer,
  members,
  profiles,
  servers,
} from '@/schema/tables';
import { GroupedChannel } from '@/type';
import { DrizzleError, eq, sql } from 'drizzle-orm';
import {
  BAD_REQUEST,
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  SERVICE_UNAVAILABLE,
  UNAUTHORIZED,
  UNPROCESSABLE_ENTITY,
} from 'http-status';
import { NextResponse } from 'next/server';
import { ZodError, string } from 'zod';
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
        id: servers.id,
        name: servers.name,

        imageUrl: servers.imageUrl,
        createdAt: servers.createdAt,
        inviteCode: servers.inviteCode,
        updateAt: servers.updatedAt,
        profileId: servers.profileId,
        channels: sql<Array<GroupedChannel>>`json_agg(${channels})`.mapWith(
          (value: Array<SelectChannel>) =>
            value.reduce((acc, cur) => {
              const channelTypeList = acc[cur.type] || (acc[cur.type] = []);
              channelTypeList.push(cur);
              return acc;
            }, {} as GroupedChannel)
        ),

        currentMembersSize: sql<number>`(
        SELECT
        COUNT(DISTINCT ${members.profileId}) AS member_count
        FROM ${members}
        INNER JOIN ${profiles} ON ${members.profileId} = ${profiles.id}
        WHERE ${members.serverId} = ${servers.id}
        GROUP BY ${members.serverId}
      )`
          .mapWith(Number)
          .as('member_count'),
        members: sql<
          {
            id: string;
            name: string;
            email: string;
            role: MemberRole;
            imageUrl: string;
            memberId: string;
            serverId: string;
            profileId: string;
            userId: string;
            profile: SelectProfile;
          }[]
        >`(SELECT
        json_agg(json_build_object('id', ${members.id},'name', ${profiles.name},
        'email', ${profiles.email},'imageUrl', ${profiles.imageUrl},'memberId',${members.id},
        'role',${members.role}, 'serverId', ${members.serverId},'userId', ${profiles.userId}, 'profileId',
       ${members.profileId}, 'profile',
       jsonb_build_object('id',${profiles.id},
       'name', ${profiles.name},'email',
       ${profiles.email},'userId', ${profiles.userId},
        'imageUrl', ${profiles.imageUrl})))
      FROM members
      INNER JOIN profiles ON members.profile_id = profiles.id
      WHERE ${members.serverId} = ${servers.id}
      GROUP BY ${members.serverId})
      `,
      })
      .from(servers)
      .where(eq(servers.id, serverId))
      .innerJoin(channels, eq(channels.serverId, servers.id))
      .groupBy(servers.id);

    if (!joined_server) {
      return new NextResponse('Server not found', { status: NOT_FOUND });
    }
    return NextResponse.json(joined_server);
  } catch (e) {
    console.log('[GET SERVER ID]', e);
    return new NextResponse('Something went wrong while getting server', {
      status: INTERNAL_SERVER_ERROR,
    });
  }
};

interface DeleteServerAPIContext {
  params: { serverId: string };
}

export const DELETE = async (
  _req: Request,
  { params: { serverId } }: DeleteServerAPIContext
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
        sql`${members.profileId} = ${profile.id} and ${members.serverId} = ${serverId} and ${members.role} = 'ADMIN'`
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

        if (member && member.role !== 'ADMIN') {
          return new NextResponse(`Unauthorized`, {
            status: UNAUTHORIZED,
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
