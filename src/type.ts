import { PgEnum } from 'drizzle-orm/pg-core';
import {
  MemberRole,
  SelectChannel,
  SelectMember,
  SelectProfile,
  SelectServer,
} from './schema/tables';

export type GroupedChannel = {
  [T in SelectChannel['type']]: Array<RemoveDocDate<SelectChannel>>;
};

export type RemoveDocDate<DocRecord extends Record<string, unknown>> = Omit<
  DocRecord,
  'createdAt' | 'updatedAt'
>;

export interface MemberInfo
  extends RemoveDocDate<SelectMember>,
    RemoveDocDate<SelectProfile> {
  memberId: string;
  profile?: RemoveDocDate<SelectProfile> | null;
}

export type ServerWithMembersWithProfiles = RemoveDocDate<SelectServer> & {
  channels: GroupedChannel;
  currentMembersSize: number;
  members: Array<MemberInfo>;
};

export type InferEnumType<Enum> = Enum extends PgEnum<infer EnumTypes>
  ? EnumTypes[number]
  : never;
