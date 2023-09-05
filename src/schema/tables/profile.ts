import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm';
import { pgTable, uuid, timestamp, varchar, text } from 'drizzle-orm/pg-core';
import { servers } from './server';
import { members } from './member';
import { channels } from './channel';

const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  name: text('name').notNull(),
  imageUrl: text('image_url'),
  email: varchar('image', { length: 256 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updateAt: timestamp('updated_at').defaultNow(),
});

export const profileRelation = relations(profiles, ({ many }) => ({
  ownedServers: many(servers),
  memberships: many(members),
  channels: many(channels),
}));

type InsertUser = InferInsertModel<typeof profiles>;
type SelectUser = InferSelectModel<typeof profiles>;

export type { InsertUser, SelectUser };
export { profiles };
