import { db } from '@/schema/db';
import {
  MemberRole,
  SelectConversation,
  SelectProfile,
  conversations,
  members,
  profiles,
  servers,
} from '@/schema/tables';
import { aliasedTable, sql } from 'drizzle-orm';

export const getOrCreateConversation = async ({
  memberOneId,
  memberTwoId,
}: {
  memberOneId: string;
  memberTwoId: string;
}) => {
  try {
    let [conversation] =
      (await getConversion({ memberOneId, memberTwoId })) ||
      (await getConversion({
        memberOneId: memberTwoId,
        memberTwoId: memberOneId,
      }));

    if (conversation) return conversation;
    if (!conversation) {
      const result = await createConversation({ memberOneId, memberTwoId });

      if (result.type === 'init') {
        //@ts-ignore
        return result.data;
      }

      console.log(result.cause);
      return new Error(result.message, { cause: result.cause });
    }
  } catch (e) {
    return new Error(`[unknown]: ${String(e)}`);
  }
};

export type UserSavedConversation = Awaited<
  ReturnType<typeof getConversion>
>[number];

export const getConversion = async ({
  memberOneId: memberOne,
  memberTwoId: memberTwo,
}: {
  memberOneId: string;
  memberTwoId: string;
}) => {
  return db
    .select({
      id: conversations.id,
      memberOneId: conversations.memberOneId,
      memberTwoId: conversations.memberTwoId,
      memberOne: sql<
        | [
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
            }
          ]
        | null
      >`(SELECT
        json_agg(json_build_object('id', members.id,'name', profiles.name,
        'email', profiles.image,'imageUrl', profiles.image_url,'memberId',members.id,
        'role',members.role, 'serverId', members.server_id,'userId', profiles.user_id, 'profileId',
       members.profile_id, 'profile',
       jsonb_build_object('id',profiles.id,
       'name', profiles.name,'email',
       profiles.image,'userId', profiles.user_id,
        'imageUrl', profiles.image_url)))
      FROM ${members}
      INNER JOIN ${profiles} ON members.profile_id = profiles.id
      WHERE members.id = ${memberOne})`,

      memberTwo: sql<
        | [
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
            }
          ]
        | null
      >`(SELECT
        json_agg(json_build_object('id', members.id,'name', profiles.name,
        'email', profiles.image,'imageUrl', profiles.image_url,'memberId',members.id,
        'role',members.role, 'serverId', members.server_id,'userId', profiles.user_id, 'profileId',
       members.profile_id, 'profile',
       jsonb_build_object('id',profiles.id,
       'name', profiles.name,'email',
       profiles.image,'userId', profiles.user_id,
        'imageUrl', profiles.image_url)))
      FROM ${members}
      INNER JOIN ${profiles} ON members.profile_id = profiles.id
      WHERE members.id = ${memberTwo})`,
    })
    .from(conversations)
    .where(
      sql`${conversations.memberOneId} = ${memberOne} AND ${conversations.memberTwoId} = ${memberTwo}`
    );
};

export type ConversationCreateIssue = {
  type: 'issue';
  message: string;
  cause?: unknown;
};
export type ConversationInit = { type: 'init'; data: SelectConversation };
export type ConversationCreateResult =
  | ConversationCreateIssue
  | ConversationInit;

export const createConversation = async ({
  memberOneId: memberOne,
  memberTwoId: memberTwo,
}: {
  memberOneId: string;
  memberTwoId: string;
}): Promise<ConversationCreateResult> => {
  try {
    const sameServerRelation = await db.select().from(servers)
      .where(sql`${servers.id} = (
        SELECT
          server_id
        FROM
          ${members}
        WHERE
          ${members.id} = ${memberOne}
      ) 
      AND
      ${servers.id} = (
        SELECT
          server_id
        FROM
          ${members}
        WHERE
          ${members.id} = ${memberTwo}
      )
      `);

    if (!sameServerRelation) {
      return { type: 'issue', message: 'Both not a member of same server' };
    }

    const [conversation] = await db
      .insert(conversations)
      .values({ memberOneId: memberOne, memberTwoId: memberTwo })
      .returning();

    return { type: 'init', data: conversation };
  } catch (e) {
    return {
      type: 'issue',
      message: 'Something really bad happened',
      cause: e,
    };
  }
};
