import { currentProfilePage } from '@/lib/current-profile-pages';
import { db } from '@/schema/db';
import {
  channels,
  clientInsertMessage,
  members,
  messages,
  servers,
} from '@/schema/tables';
import { NextApiResponseServerIo } from '@/type';
import { eq, sql } from 'drizzle-orm';
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  METHOD_NOT_ALLOWED,
  NOT_FOUND,
  UNAUTHORIZED,
} from 'http-status';
import { NextApiRequest } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  const method = req.method?.toLowerCase();
  if (method !== 'delete' && method !== 'patch') {
    return res.status(METHOD_NOT_ALLOWED).json({ error: 'Method not allowed' });
  }

  try {
    const profile = await currentProfilePage(req);

    if (!profile) {
      return res.status(UNAUTHORIZED).json({ error: 'Unauthorized' });
    }

    const { channelId, serverId, messageId } = req.query as {
      messageId: string;
      serverId: string;
      channelId: string;
    };

    if (!channelId) {
      return res.status(BAD_REQUEST).json({ error: 'Channel ID missing' });
    }

    if (!serverId) {
      return res.status(BAD_REQUEST).json({ error: 'Server ID missing' });
    }

    if (!messageId) {
      return res.status(BAD_REQUEST).json({ error: 'Message ID missing' });
    }

    const verifyRecordAccess = (await db.execute(sql`SELECT 
    (
      SELECT id as server_id FROM  ${servers}
      WHERE servers.id = ${serverId}
      ) as "serverId",
    (
      SELECT id as channel_id FROM ${channels}
      WHERE channels.id = ${channelId} AND channels.server_id = server_id
    ) as "channelId",
    (
      SELECT id as member_id FROM ${members}
      WHERE members.server_id = ${serverId} AND members.profile_id = ${profile.id}
    ) as "memberId",
    (
        SELECT json_build_object('id', messages.id,
        'content', messages.content, 'deleted', messages.deleted
        ) FROM ${messages}
        WHERE messages.id = ${messageId} AND messages.memberId = member_id
    )
    `)) as unknown as {
      serverId?: string;
      channelId?: string;
      memberId?: string;
    };

    if (!verifyRecordAccess.serverId) {
      return res.status(NOT_FOUND).json({ error: 'Server not found' });
    }

    if (!verifyRecordAccess.channelId) {
      return res.status(NOT_FOUND).json({ error: 'Channel not found' });
    }

    if (!verifyRecordAccess.memberId) {
      return res.status(NOT_FOUND).json({ error: 'User not a server member' });
    }

    const { content } = clientInsertMessage
      .pick({ content: true })
      .parse(req.body);

    await db
      .update(messages)
      .set({ content, updatedAt: new Date() })
      .where(eq(messages.id, messageId));
  } catch (e) {
    console.log('[MESSAGE_ID]', e);
    return res.status(INTERNAL_SERVER_ERROR).json({ error: 'Internal Error' });
  }
}
