import { PgEnum } from 'drizzle-orm/pg-core';
import { SelectMember, SelectProfile, SelectServer } from './schema/tables';

export type ServerWithMembersWithProfiles = SelectServer & {
  currentMembersSize: number;
  members: Array<SelectMember & { profile: SelectProfile }>;
};

export type InferEnumType<Enum> = Enum extends PgEnum<infer EnumTypes>
  ? EnumTypes[number]
  : never;
