import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm';
import { pgTable, uuid, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core';
import { profiles } from './profile';
import { servers } from './server';

export const memberRole = pgEnum('member_role', [
  'ADMIN',
  'MODERATOR',
  'GUEST',
]);

const members = pgTable(
  'members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    role: memberRole('role').default('GUEST'),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    serverId: uuid('server_id')
      .notNull()
      .references(() => servers.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
    updateAt: timestamp('updated_at').defaultNow(),
  },
  ({ profileId, serverId }) => ({
    uniq: unique('memberUniq').on(profileId, serverId),
  })
);

export const memberRelations = relations(members, ({ one }) => ({
  userProfile: one(profiles, {
    fields: [members.profileId],
    references: [profiles.id],
  }),

  server: one(servers, {
    fields: [members.serverId],
    references: [servers.id],
  }),
}));

type InsertMember = InferInsertModel<typeof members>;
type SelectMember = InferSelectModel<typeof members>;

export type { InsertMember, SelectMember };
export { members };
