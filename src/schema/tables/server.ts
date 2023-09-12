import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { profiles } from './profile';
import { pgTable, uuid, timestamp, varchar, text } from 'drizzle-orm/pg-core';
import { members } from './member';
import { channels } from './channel';
import { TypeOf, date, string } from 'zod';

const servers = pgTable('servers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 256 }).notNull().unique(),
  imageUrl: text('image_url'),
  inviteCode: text('invite_code').unique(),
  profileId: uuid('profile_id')
    .notNull()
    .references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
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

const clientInsertServer = createInsertSchema(servers, {
  name: string({ required_error: 'Provide a name for the server' })
    .max(256)
    .min(1, { message: 'Server name is required' }),
  imageUrl: string({
    required_error: 'profile image required for the created server',
    invalid_type_error: 'invalid image type',
  }).url({ message: 'invalid image type' }),
}).pick({
  name: true,
  imageUrl: true,
});

const clientSelectServer = createSelectSchema(servers, {
  createdAt: date({ coerce: true }).optional(),
  updatedAt: date({ coerce: true }).optional(),
});

type ClientInsertServer = TypeOf<typeof clientInsertServer>;

export type { InsertServer, SelectServer, ClientInsertServer };
export { servers, clientInsertServer, clientSelectServer };
