import { v4 as uuidv4 } from 'uuid';
import { currentProfile } from '@/lib/current-profile';
import { db } from '@/schema/db';
import {
  channels,
  clientInsertServer,
  members,
  servers,
} from '@/schema/tables';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { name, imageUrl } = clientInsertServer.parse(await req.json());
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const server = await db.transaction(async (tx) => {
      const [server] = await tx
        .insert(servers)
        .values({ profileId: profile.id, name, imageUrl, inviteCode: uuidv4() })
        .returning();

      await tx.insert(channels).values({
        name: 'general',
        profileId: profile.id,
        serverId: server.id,
        type: 'TEXT',
      });

      await tx
        .insert(members)
        .values({ profileId: profile.id, role: 'ADMIN', serverId: server.id });
      return server;
    });

    return NextResponse.json(server);
  } catch (e) {
    console.log('[SERVERS_POST]', e);

    return new NextResponse('Internal Error', { status: 500 });
  }
}
