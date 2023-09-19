import { MessageInfo } from '@/app/api/messages/route';
import {
  MemberRole,
  SelectMessage,
  clientInsertMessage,
  memberRole,
  messages,
} from '@/schema/tables';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '../user-avatar';
import { ActionTooltip } from '../navigation/action-tooltip';
import {
  Edit,
  FileIcon,
  ShieldAlert,
  ShieldCheck,
  Trash,
  X,
} from 'lucide-react';
import { MemberInfo } from '@/type';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TypeOf } from 'zod';
import { MouseEvent, KeyboardEvent } from 'react';

interface ChatItemProps extends SelectMessage {
  currentMember: MessageInfo['member'];
  member: MessageInfo['member'];
  isUpdated: boolean;
  socketUrl: string;
  socketQuery: Record<string, string>;
  timestamp: string;
}

const roleIconMap: Record<MemberRole, React.ReactNode> = {
  GUEST: null,
  MODERATOR: <ShieldCheck className="h-4 w-4 ml-2 text-indigo-500" />,
  ADMIN: <ShieldAlert className="h-4 w-4 ml-2 text-rose-500" />,
};

const formSchema = clientInsertMessage.pick({ content: true });

export const ChatItem: React.FC<ChatItemProps> = ({
  id,
  content,
  channelId,
  deleted,
  createdAt,
  fileUrl,
  isUpdated,
  member,
  currentMember,
  memberId,
  socketQuery,
  socketUrl,
  updatedAt,
  timestamp,
}) => {
  const form = useForm<TypeOf<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content,
    },
  });

  const fileType = fileUrl?.match(/\.(?<ext>\.\w+$)/i)?.groups?.ext;
  const isAdmin = currentMember.role === 'ADMIN';
  const isModerator = currentMember.role === 'MODERATOR';
  const isOwner = member.id === currentMember.id;
  const messageDeletable = !deleted && (isAdmin || isModerator || isOwner);
  const messageEditable = !deleted && isOwner && !fileUrl;
  const messageIsFilePdfType = fileType && fileType.toLowerCase() === 'pdf';
  const messageIsImageType = !messageIsFilePdfType && fileUrl;
  const [currentlyEditing, setCurrentlyEditing] = useState(false);
  const [currentlyDeleting, setCurrentlyDeleting] = useState(false);

  const isLoading = form.formState.isSubmitting;
  useEffect(() => {
    form.reset({ content: content });
  }, [content]);

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key.toLowerCase() === 'escape' || event.keyCode === 27) {
        setCurrentlyEditing(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const onSubmit = form.handleSubmit(async (value) => {
    try {
      const url = new URL(`${socketUrl}/${id}`, window.location.origin);
      url.search = new URLSearchParams(socketQuery).toString();

      await axios.post(url.toString(), value);
    } catch (e) {
      console.log(e);
    }
  });

  return (
    <div className="relative group flex items-center hover:bg-black/5 p-4 transition w-full">
      <div className="group flex gap-x-2 items-start w-full">
        <div className="cursor-pointer hover:drop-shadow-md transition">
          <UserAvatar src={member.profile.imageUrl ?? undefined} />
        </div>
        <div className="flex flex-col w-full">
          <div className="flex items-center gap-x-2">
            <div className="flex items-center">
              <p className="font-semibold text-sm hover:underline cursor-pointer">
                {member.profile.name}
              </p>
              <ActionTooltip label={member.role}>
                <p>{roleIconMap[member.role]}</p>
              </ActionTooltip>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {timestamp}
            </span>
          </div>
          {messageIsImageType ? (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square rounded-md mt-2 overflow-hidden border
          flex items-center bg-secondary h-48 w-48
          "
            >
              <Image
                src={fileUrl}
                alt={content!}
                fill
                className="object-cover"
              />
            </a>
          ) : null}

          {messageIsFilePdfType ? (
            <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
              <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-200" />
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline"
              >
                PDF file
              </a>
            </div>
          ) : null}

          {!fileUrl && !currentlyEditing && (
            <p
              className={cn(
                'text-sm text-zinc-600 dark:text-zinc-300',
                deleted &&
                  'italic text-zinc-500 dark:text-zinc-400 text-xs mt-1'
              )}
            >
              {content}
              {isUpdated && !deleted && (
                <span className="text-[10px] mx-2 text-zinc-500 dark:text-zinc-400">
                  (edited)
                </span>
              )}
            </p>
          )}

          {!fileUrl && currentlyEditing && (
            <Form {...form}>
              <form
                onSubmit={onSubmit}
                className="flex items-center w-full gap-x-2 pt-2"
              >
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => {
                    return (
                      <FormItem className="flex-1">
                        <FormControl>
                          <div className="relative w-full">
                            <Input
                              disabled={isLoading}
                              className="p-2 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
                              placeholder="Edited message"
                              {...field}
                              value={field.value ?? undefined}
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    );
                  }}
                />
                <Button disabled={isLoading} size="sm" variant="primary">
                  Save
                </Button>
              </form>
              <span className="text-[10px] mt-1 text-zinc-400">
                Press escape to cancel, enter to save
              </span>
            </Form>
          )}
        </div>
      </div>
      {messageDeletable ? (
        <div className="hidden group-hover:flex items-center gap-x-2 absolute p-1 -top-2 right-5 bg-white dark:bg-zinc-800 border rounded-sm">
          {messageEditable && (
            <ActionTooltip label="Edit">
              <Edit
                className="cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
                onClick={() => setCurrentlyEditing(true)}
              />
            </ActionTooltip>
          )}

          <ActionTooltip label="Delete">
            <Trash className="cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition" />
          </ActionTooltip>
        </div>
      ) : null}
    </div>
  );
};
