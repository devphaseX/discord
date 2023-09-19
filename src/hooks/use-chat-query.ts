import { QueryFunction, useInfiniteQuery } from '@tanstack/react-query';
import { useSocket } from '@/components/providers/socket-provider';
import { MessageInfo } from '@/app/api/messages/route';

interface ChatQueryProps {
  queryKey: string;
  apiUrl: string;
  paramKey: 'channelId' | 'conversationId';
  paramValue: string;
}

export const useChatQuery = ({
  apiUrl,
  paramKey,
  paramValue,
  queryKey,
}: ChatQueryProps) => {
  const { establishedConnection } = useSocket();

  const retrieveMessages: QueryFunction<{
    items: MessageInfo[];
    cursor: Date | null;
  }> = async ({ pageParam }) => {
    const url = new URL(apiUrl, window.location.origin);
    url.search = new URLSearchParams({
      [paramKey]: paramValue,
      cursor: (pageParam ?? '').toString(),
    }).toString();

    const res = await fetch(url);
    return res.json();
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: [queryKey],
      queryFn: retrieveMessages,
      getNextPageParam: (lastPage) => lastPage.cursor,
      refetchInterval: establishedConnection ? false : 1000,
    });

  return { data, fetchNextPage, hasNextPage, isFetchingNextPage, status };
};
