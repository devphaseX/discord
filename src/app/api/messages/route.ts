import { currentProfile } from '@/lib/current-profile';
import { db } from '@/schema/db';
import {
  SelectMember,
  SelectMessage,
  SelectProfile,
  members,
  messages,
  profiles,
} from '@/schema/tables';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, UNAUTHORIZED } from 'http-status';
import { NextResponse } from 'next/server';

let BATCHED_MESSAGED_LENGTH = 10;

export interface MessageInfo extends SelectMessage {
  member: SelectMember & { profile: SelectProfile };
}

export const GET = async (req: Request) => {
  try {
    const profile = await currentProfile();
    const { searchParams } = new URL(req.url);

    let cursorDate: Date | null = null;
    {
      const cursor = searchParams.get('cursor');
      if (cursor) {
        try {
          cursorDate = new Date(cursor);
          if (Object.is(cursorDate.getTime(), NaN)) {
            cursorDate = null;
          }
        } catch (e) {}
      }
    }

    const channelId = searchParams.get('channelId');

    if (!profile) {
      return new NextResponse('Unauthorized', { status: UNAUTHORIZED });
    }

    if (!channelId) {
      return new NextResponse('Channel ID is missing', { status: BAD_REQUEST });
    }

    let channelMessages = await (db.execute(sql`
    SELECT ${messages.id}, ${messages.content},
      ${messages.deleted}, messages.file_url as "fileUrl",
        messages.member_id as "memberId", messages.channel_id as "channelId",
      messages.created_at as "createdAt", messages.updated_at as "updatedAt",
json_build_object('id', ${members.id} ,'role',
${members.role}, 'profileId', ${members.profileId},
'profile', json_build_object('id', ${profiles.id}, 'name', ${profiles.name},
'imageUrl', ${profiles.imageUrl}, 'email', ${profiles.email}, 'userId', ${
      profiles.userId
    }
),'serverId', ${members.serverId},
'createdAt', ${members.createdAt},'updatedAt', ${members.updatedAt}
) as member
FROM ${messages}
INNER JOIN ${members} ON ${members.id} = ${messages.memberId}
INNER JOIN ${profiles} ON ${profiles.id} = ${members.profileId}
WHERE ${messages.channelId} = ${channelId}
ORDER BY ${messages.createdAt} DESC
OFFSET ${
      cursorDate
        ? `(SELECT COUNT(*) FROM messages WHERE ${
            messages.createdAt.name
          } <= TIMESTAMP ${cursorDate?.toISOString().replace(/$\.\d+z/, '')})`
        : 0
    }
LIMIT ${BATCHED_MESSAGED_LENGTH}
    `) as unknown as postgres.RowList<Array<MessageInfo>>);

    let nextCursor: Date | null = null;

    if (channelMessages.length === BATCHED_MESSAGED_LENGTH) {
      nextCursor = channelMessages.at(-1)!.createdAt;
    }

    console.log(channelMessages);

    return NextResponse.json({ items: channelMessages, cursor: nextCursor });
  } catch (e) {
    console.log('[MESSAGE_GET]', e);
    return new NextResponse('Internal Error', {
      status: INTERNAL_SERVER_ERROR,
    });
  }
};
