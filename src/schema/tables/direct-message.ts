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

import { members, profiles } from '.';
import { conversations } from './conversation';

const directMessages = pgTable('direct_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  context: text('context'),
  deleted: boolean('deleted').default(false).notNull(),
  fileUrl: varchar('file_url', { length: 256 }),
  memberId: uuid('member_id').references(() => members.id, {
    onDelete: 'cascade',
  }),
  conversationId: uuid('conversation_id')
    .references(() => conversations.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const directMessageRelations = relations(directMessages, ({ one }) => ({
  member: one(profiles, {
    fields: [directMessages.memberId],
    references: [profiles.id],
    relationName: 'privateMessage',
  }),
}));

export const clientInsertDirectMessage = createInsertSchema(directMessages, {
  fileUrl: string().url({ message: 'Provide an valid image' }),
}).pick({ context: true, fileUrl: true });

export type ClientInsertDirectMessage = TypeOf<
  typeof clientInsertDirectMessage
>;

type InsertDirectMessage = InferInsertModel<typeof directMessages>;
type SelectDirectMessage = InferSelectModel<typeof directMessages>;

export type { InsertDirectMessage, SelectDirectMessage };
export { directMessages };
