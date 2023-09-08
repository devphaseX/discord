import { currentProfile } from '@/lib/current-profile';
import { db } from '@/schema/db';
import { MemberRole, memberRole, members, servers } from '@/schema/tables';
import { eq, sql } from 'drizzle-orm';
import {
  BAD_REQUEST,
  CONFLICT,
  INTERNAL_SERVER_ERROR,
  UNAUTHORIZED,
  UNPROCESSABLE_ENTITY,
} from 'http-status';
import { NextResponse } from 'next/server';
import { string, enum as enum_ } from 'zod';

interface UpdateMemberAPIContext {
  params: { memberId: string };
  query: { serverId?: string };
}

export const PATCH = async (
  req: Request,
  { params: { memberId } }: UpdateMemberAPIContext
) => {
  try {
    const query = <UpdateMemberAPIContext['query']>(
      Object.fromEntries(new URL(req.url).searchParams)
    );

    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse('Unauthorize', { status: UNAUTHORIZED });
    }

    if (!string().uuid().safeParse(memberId).success) {
      return new NextResponse('[Query]: Invalid member Id', {
        status: BAD_REQUEST,
      });
    }

    let body: { role: MemberRole };
    {
      const raw: { role: MemberRole | (unknown & {}) } = await req.json();

      const result = enum_(memberRole.enumValues).safeParse(raw.role);

      if (!result.success) {
        return new NextResponse(`[Body]: Invalid role type ${raw.role}`);
      }

      body = raw as typeof body;
    }

    const useServerIdSafely = string().uuid().safeParse(query.serverId).success;

    const [serverWithCurrentMember] = await db
      .select()
      .from(servers)
      .innerJoin(members, sql`${members.id} = ${memberId}`)
      .where(
        useServerIdSafely ? sql`${servers.id} = ${query.serverId}` : sql``
      );

    if (!serverWithCurrentMember) {
      return new NextResponse('Server not exist', {
        status: UNPROCESSABLE_ENTITY,
      });
    }

    if (!serverWithCurrentMember.members) {
      return new NextResponse('Not a valid server memeber', {
        status: CONFLICT,
      });
    }

    if (serverWithCurrentMember.members.role === body.role) {
      return new NextResponse(`Member already a ${body.role}`, {
        status: CONFLICT,
      });
    }

    const { servers: memberServer } = serverWithCurrentMember;

    if (memberServer.profileId !== profile.id) {
      return new NextResponse('Unauthorize cannot perform this operation', {
        status: UNAUTHORIZED,
      });
    }

    const membership = await db
      .update(members)
      .set({ role: body.role })
      .where(eq(members.id, memberId))
      .returning();

    return NextResponse.json(membership);
  } catch (e) {
    console.log('[GET MEMBER ID]', e);
    return new NextResponse('Something went wrong while updating member', {
      status: INTERNAL_SERVER_ERROR,
    });
  }
};

export const DELETE = async (
  req: Request,
  { params: { memberId } }: UpdateMemberAPIContext
) => {
  try {
    const query = <UpdateMemberAPIContext['query']>(
      Object.fromEntries(new URL(req.url).searchParams)
    );

    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse('Unauthorize', { status: UNAUTHORIZED });
    }

    if (!string().uuid().safeParse(memberId).success) {
      return new NextResponse('[Query]: Invalid member Id', {
        status: BAD_REQUEST,
      });
    }

    const useServerIdSafely = string().uuid().safeParse(query.serverId).success;

    const [serverWithCurrentMember] = await db
      .select()
      .from(servers)
      .innerJoin(members, sql`${members.id} = ${memberId}`)
      .where(
        useServerIdSafely ? sql`${servers.id} = ${query.serverId}` : sql``
      );

    if (!serverWithCurrentMember) {
      return new NextResponse('Server not exist', {
        status: UNPROCESSABLE_ENTITY,
      });
    }

    if (!serverWithCurrentMember.members) {
      return new NextResponse('Not a valid server memeber', {
        status: CONFLICT,
      });
    }

    const { servers: memberServer } = serverWithCurrentMember;

    if (memberServer.profileId !== profile.id) {
      return new NextResponse('Unauthorize cannot perform this operation', {
        status: UNAUTHORIZED,
      });
    }

    await db.delete(members).where(eq(members.id, memberId));

    return new NextResponse('Member removed from server');
  } catch (e) {
    console.log('[REMOVE MEMBER ID]', e);
    return new NextResponse('Something went wrong while removing member', {
      status: INTERNAL_SERVER_ERROR,
    });
  }
};
