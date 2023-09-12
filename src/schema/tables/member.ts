import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm';
import { pgTable, uuid, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core';
import { profiles } from './profile';
import { servers } from './server';
import { InferEnumType } from '@/type';
import { convertPgEnumNative } from '../../lib/utils';
import { messages } from './message';
import { conversations, directMessages } from '.';

export const memberRole = pgEnum('member_role', [
  'ADMIN',
  'MODERATOR',
  'GUEST',
]);

export const nativeMemberRole = convertPgEnumNative(memberRole);

export type MemberRole = InferEnumType<typeof memberRole>;

const members = pgTable(
  'members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    role: memberRole('role').default('GUEST').notNull(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    serverId: uuid('server_id')
      .notNull()
      .references(() => servers.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  ({ profileId, serverId }) => ({
    uniq: unique('memberUniq').on(profileId, serverId),
  })
);

export const memberRelations = relations(members, ({ one, many }) => ({
  userProfile: one(profiles, {
    fields: [members.profileId],
    references: [profiles.id],
  }),

  server: one(servers, {
    fields: [members.serverId],
    references: [servers.id],
  }),

  messages: many(messages),
  conversationsParticipated: many(conversations, {
    relationName: 'consersationParticipator',
  }),
  conversationsInitated: many(conversations, {
    relationName: 'conversationInitator',
  }),
  directMessage: many(directMessages, { relationName: 'privateMessage' }),
}));

type InsertMember = InferInsertModel<typeof members>;
type SelectMember = InferSelectModel<typeof members>;

export type { InsertMember, SelectMember };
export { members };
