import { pgTable, uuid, timestamp, unique } from 'drizzle-orm/pg-core';
import { members } from '.';
import { relations, InferInsertModel } from 'drizzle-orm';
import { directMessages } from './direct-message';

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberOneId: uuid('member_one_id').references(() => members.id, {
      onDelete: 'cascade',
    }),
    memberTwoId: uuid('member_two_id').references(() => members.id, {
      onDelete: 'cascade',
    }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  ({ memberOneId, memberTwoId }) => ({
    uniq: unique('memberToMemberConversion').on(memberOneId, memberTwoId),
  })
);

export const conversationRelations = relations(
  conversations,
  ({ one, many }) => ({
    directMessages: many(directMessages, { relationName: 'privateMessage' }),
    memberOne: one(conversations, {
      fields: [conversations.memberOneId],
      references: [conversations.id],
      relationName: 'conversationInitator',
    }),

    memberTwo: one(conversations, {
      fields: [conversations.memberTwoId],
      references: [conversations.id],
      relationName: 'consersationParticipator',
    }),
  })
);

export type SelectConversation = InferInsertModel<typeof conversations>;
