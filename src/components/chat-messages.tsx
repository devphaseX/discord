'use client';

import { ChatWelcome } from './chat/chat-welcome';
import { useChatQuery } from '@/hooks/use-chat-query';
import { Loader2, ServerCrash } from 'lucide-react';
import { Fragment } from 'react';
import { ChatItem } from './chat/chat-item';
import { MessageInfo } from '@/app/api/messages/route';
import { format } from 'date-fns';

export type MessageMeansType = 'channel' | 'conversation';

interface ChatMessagesProps {
  name: string;
  member: MessageInfo['member'];
  chatId: string;
  apiUrl: string;
  socketUrl: string;
  socketQuery: Record<string, string>;
  paramKey: 'channelId' | 'conversationId';
  paramValue: string;
  type: MessageMeansType;
}

const DATE_FORMAT = 'd MMM yyyy, HH:mm';
export const ChatMessages: React.FC<ChatMessagesProps> = ({
  name,
  member,
  apiUrl,
  chatId,
  paramKey,
  paramValue,
  socketQuery,
  socketUrl,
  type,
}) => {
  const queryKey = `chat:${chatId}`;
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useChatQuery({ apiUrl, paramKey, paramValue, queryKey });

  if (status === 'loading') {
    return (
      <div className="flex flex-col flex-1 justify-center items-center ">
        <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Loading messages...
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col flex-1 justify-center items-center ">
        <ServerCrash className="h-7 w-7 text-zinc-500" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          something went wrong!
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-1 flex-col py-4 overflow-y-auto">
      <div className="flex-1" />
      <ChatWelcome type={type} name={name} />
      <div className="flex flex-col mt-auto">
        {data?.pages.map((group, i) => (
          <Fragment key={i}>
            {group.items.map((message) => {
              console.log(message);
              //@ts-ignore
              message.createdAt = new Date(message.createdAt);
              message.updatedAt = new Date(message.updatedAt);

              return (
                <ChatItem
                  currentMember={member}
                  key={message.id}
                  id={message.id}
                  member={message.member}
                  content={message.content}
                  channelId={message.channelId}
                  fileUrl={message.fileUrl}
                  memberId={message.memberId}
                  timestamp={format(message.createdAt!, DATE_FORMAT)}
                  socketQuery={socketQuery}
                  socketUrl={socketUrl}
                  createdAt={message.createdAt}
                  updatedAt={message.updatedAt}
                  deleted={message.deleted}
                  isUpdated={
                    message.createdAt.getTime() !== message.updatedAt.getTime()
                  }
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
};
