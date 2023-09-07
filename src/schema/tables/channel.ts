import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  timestamp,
  pgEnum,
  varchar,
  unique,
} from 'drizzle-orm/pg-core';
import { profiles } from './profile';
import { servers } from './server';

export const channelType = pgEnum('channel_type', ['TEXT', 'AUDIO', 'VIDEO']);

const channels = pgTable(
  'channels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: channelType('type').notNull(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    serverId: uuid('server_id')
      .notNull()
      .references(() => servers.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 256 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updateAt: timestamp('updated_at').defaultNow(),
  },
  ({ profileId, serverId }) => ({
    uniq: unique('channelMemberShip').on(profileId, serverId),
  })
);

export const channelRelations = relations(channels, ({ one }) => ({
  profile: one(profiles, {
    fields: [channels.profileId],
    references: [profiles.id],
  }),
  server: one(servers, {
    fields: [channels.profileId],
    references: [servers.id],
  }),
}));

type InsertChannel = InferInsertModel<typeof channels>;
type SelectChannel = InferSelectModel<typeof channels>;

export type { InsertChannel, SelectChannel };
export { channels };
