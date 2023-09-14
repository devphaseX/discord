import { ChatHeader } from '@/components/chat/chat-header';
import {
  ConversationCreateResult,
  ConversationInit,
  UserSavedConversation,
  getOrCreateConversation,
} from '@/lib/conversation';
import { currentProfile } from '@/lib/current-profile';
import { db } from '@/schema/db';
import { members } from '@/schema/tables';
import { redirectToSignIn } from '@clerk/nextjs';
import { eq, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';

interface MemberIdPageProps {
  params: { memberId: string; serverId: string };
}

const MemberIdPage = async ({ params }: MemberIdPageProps) => {
  const profile = await currentProfile();
  if (!profile) return redirectToSignIn();

  const { memberId: nextMemberId, serverId } = params;
  const [currentMember, nextMember] = await Promise.all([
    db.query.members.findFirst({
      where: sql`${members.serverId} = ${serverId} AND ${members.profileId} = ${profile.id}`,
    }),
    db.query.members.findFirst({ where: eq(members.id, nextMemberId) }),
  ]);

  if (!currentMember) return redirect('/');
  if (!nextMember) return redirect(`/servers/${serverId}`);

  let conversation;
  const result = await getOrCreateConversation({
    memberOneId: currentMember.id,
    memberTwoId: nextMemberId,
  });

  if (result) {
    if (result instanceof Error) {
      return redirect(`/servers/${serverId}`);
    }

    if (
      'type' in result &&
      ['init', 'issue'].includes(result.type as string) &&
      (result as ConversationCreateResult).type === 'init'
    ) {
      return redirect(
        `/servers/${serverId}/conversations/${
          (result as ConversationInit).data.id
        }`
      );
    }
  } else if (!result) {
    return redirect(`/servers/${serverId}`);
  }

  conversation = result as UserSavedConversation;

  let { memberOne, memberTwo } = conversation;

  if (!(memberOne && memberTwo)) {
    return redirect(`/servers/${serverId}`);
  }

  if (memberOne.length !== 1 && memberTwo.length !== 1) {
    if (process.env.NODE_ENV?.toLowerCase() === 'production') {
      return redirect(`/servers/${serverId}`);
    } else {
      throw new Error(
        'MemberOne or MemberTwo contains two items. Check your query for possible errors'
      );
    }
  }

  if (memberTwo.find(({ id }) => id === currentMember.id)) {
    [memberOne, memberTwo] = [memberTwo, memberOne];
  }

  const [memberOneInfo] = memberOne;
  const [memberTwoInfo] = memberTwo;

  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <ChatHeader
        serverId={serverId}
        type="conservation"
        name={memberTwoInfo.profile.name}
        imageUrl={memberTwoInfo.profile.imageUrl as string}
      />
    </div>
  );
};

export default MemberIdPage;
