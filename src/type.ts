import { PgEnum } from 'drizzle-orm/pg-core';
import {
  SelectChannel,
  SelectMember,
  SelectProfile,
  SelectServer,
} from './schema/tables';
import { Server as NetServer, Socket } from 'net';
import { NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';

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

export type NextApiResponseServerIo = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};
