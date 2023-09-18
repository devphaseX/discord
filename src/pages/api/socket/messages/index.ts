import { NextApiResponseServerIo } from '@/type';
import { NextApiRequest } from 'next';
import {
  BAD_REQUEST,
  FORBIDDEN,
  METHOD_NOT_ALLOWED,
  NOT_FOUND,
  OK,
  UNAUTHORIZED,
  UNPROCESSABLE_ENTITY,
} from 'http-status';
import { currentProfilePage } from '@/lib/current-profile-pages';
import {
  SelectChannel,
  channels,
  clientInsertMessage,
  members,
  messages,
  profiles,
  servers,
} from '@/schema/tables';
import { ZodError, object, string } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { db } from '@/schema/db';
import { eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

const querySchema = object({
  channelId: string().uuid(),
  serverId: string().uuid(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (req.method?.toLowerCase() !== 'post') {
    return res.status(METHOD_NOT_ALLOWED).json({ error: 'Method not allowed' });
  }

  try {
    const profile = await currentProfilePage(req);
    const { content, fileUrl } = clientInsertMessage.parse(req.body);
    const { channelId, serverId } = querySchema.parse(req.query);
    if (!profile) {
      return res.status(UNAUTHORIZED).json({ error: 'Unauthorized' });
    }

    const s1 = alias(servers, 's1');
    const [serverInfo] = await db
      .select({
        id: s1.id,
        name: s1.name,
        inviteCode: s1.inviteCode,
        currentChannel: sql<
          [SelectChannel] | null
        >`(SELECT json_agg(${channels}) FROM ${channels}
           WHERE ${channels.serverId} = ${s1.id} AND ${channels.id} = ${channelId}
           )`,
        currentMember: members,
      })
      .from(s1)
      .innerJoin(profiles, eq(s1.profileId, profile.id))
      .leftJoin(
        members,
        sql`${s1.id} = ${members.serverId} AND ${members.profileId} = ${profile.id}`
      )
      .where(eq(s1.id, serverId));

    if (!serverInfo) {
      return res.status(NOT_FOUND).json({ message: 'Server not found' });
    }

    if (!serverInfo.currentMember) {
      return res
        .status(FORBIDDEN)
        .json({ message: 'You are not a member on this server' });
    }

    if (!serverInfo.currentChannel) {
      return res.status(NOT_FOUND).json({ message: 'Channel not found' });
    }

    const [message] = await db
      .insert(messages)
      .values({
        content,
        fileUrl,
        channelId,
        memberId: serverInfo.currentMember.id,
      })
      .returning();

    const messageWithExtraInfo = await db.query.messages.findFirst({
      where: eq(messages.id, message.id),
      with: { member: { with: { userProfile: true } } },
    });

    const channelKey = `chat:${channelId}:messages`;
    res?.socket?.server?.io.emit(channelKey, messageWithExtraInfo);
    return res.status(OK).json(messageWithExtraInfo);
  } catch (error) {
    if (error instanceof ZodError) {
      let invalidFormedRequest = !!error.issues.find(({ path: dataPath }) =>
        dataPath.find((seg) =>
          seg
            .toString()
            .toLowerCase()
            .match(/channelId|serverId/i)
        )
      );

      const statusCode = invalidFormedRequest
        ? BAD_REQUEST
        : UNPROCESSABLE_ENTITY;

      return res
        .status(statusCode)
        .json({ error: fromZodError(error).toString() });
    }
    console.log('[MESSAGES_POST]', error);
    return res.status(500).json({ error: 'Internal Error' });
  }
}
