import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  timestamp,
  varchar,
  text,
  boolean,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { TypeOf, string } from 'zod';

import { channels, members } from '.';

const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content'),
  deleted: boolean('deleted').default(false).notNull(),
  fileUrl: varchar('file_url', { length: 256 }),
  memberId: uuid('member_id')
    .references(() => members.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  channelId: uuid('channel_id')
    .references(() => channels.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
});

export const messageRelations = relations(messages, ({ one }) => ({
  member: one(members, {
    fields: [messages.memberId],
    references: [members.id],
  }),
  channel: one(channels, {
    fields: [messages.memberId],
    references: [channels.id],
  }),
}));

export const clientInsertMessage = createInsertSchema(messages, {
  fileUrl: string().url({ message: 'Provide an valid image' }),
}).pick({ content: true, fileUrl: true });

export type ClientInsertMessage = TypeOf<typeof clientInsertMessage>;

type InsertMessage = InferInsertModel<typeof messages>;
type SelectMessage = InferSelectModel<typeof messages>;

export type { InsertMessage, SelectMessage };
export { messages };
