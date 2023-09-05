import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm';
import { profiles } from './profile';
import { pgTable, uuid, timestamp, varchar, text } from 'drizzle-orm/pg-core';
import { members } from './member';
import { channels } from './channel';

const servers = pgTable('servers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 256 }).notNull(),
  imageUrl: text('image_url'),
  inviteCode: text('invite_code'),
  profileId: uuid('profile_id')
    .notNull()
    .references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow(),
  updateAt: timestamp('updated_at').defaultNow(),
});

export const serverRelations = relations(servers, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [servers.profileId],
    references: [profiles.id],
  }),
  serverMembers: many(members),
  channels: many(channels),
}));

type InsertServer = InferInsertModel<typeof servers>;
type SelectServer = InferSelectModel<typeof servers>;

export type { InsertServer, SelectServer };
export { servers };
