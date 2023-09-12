import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  timestamp,
  pgEnum,
  varchar,
  unique,
  text,
} from 'drizzle-orm/pg-core';
import { profiles } from './profile';
import { servers } from './server';
import { createInsertSchema } from 'drizzle-zod';
import { TypeOf, string } from 'zod';
import { InferEnumType } from '@/type';
import { convertPgEnumNative } from '../../lib/utils';
import { messages } from './message';

export const channelType = pgEnum('channel_type', ['TEXT', 'AUDIO', 'VIDEO']);
export const channelTypeNative = convertPgEnumNative(channelType);
export type ChannelType = InferEnumType<typeof channelType>;
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
    name: varchar('name', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  ({ profileId, serverId, name }) => ({
    uniq: unique('channelMemberShip').on(profileId, serverId, name),
  })
);

export const channelRelations = relations(channels, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [channels.profileId],
    references: [profiles.id],
  }),
  server: one(servers, {
    fields: [channels.profileId],
    references: [servers.id],
  }),
  messages: many(messages),
}));

export const clientInsertChannel = createInsertSchema(channels, {
  name: string({ required_error: 'Channel name is required' })
    .max(50)
    .nonempty({ message: 'Channel name cannot be empty' })
    .toLowerCase()
    .refine((name) => name !== 'general', {
      message: 'Channel cannot be name `general`',
    }),
}).pick({ name: true, type: true });

export type ClientInsertChannel = TypeOf<typeof clientInsertChannel>;

type InsertChannel = InferInsertModel<typeof channels>;
type SelectChannel = InferSelectModel<typeof channels>;

export type { InsertChannel, SelectChannel };
export { channels };
