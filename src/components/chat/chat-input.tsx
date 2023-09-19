'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z, object, string } from 'zod';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '../ui/input';
import { Plus, Smile } from 'lucide-react';
import axios from 'axios';
import { useModal } from '@/hooks/use-modal-store';
import { EmojiPicker } from '../emoji-picker';
import { useRouter } from 'next/navigation';

interface ChatInputProps {
  apiUrl: string;
  query: { channelId: string; serverId: string; [other: string]: string };
  name: string;
  type: 'conversion' | 'channel';
}

const formSchema = object({
  content: string().nonempty(),
});

export const ChatInput: React.FC<ChatInputProps> = ({
  name,
  type,
  apiUrl,
  query,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: { content: '' },
    resolver: zodResolver(formSchema),
  });

  const { onOpen } = useModal();
  const isLoading = form.formState.isLoading;
  const router = useRouter();

  const onSubmit = form.handleSubmit(async (value) => {
    try {
      const url = new URL(apiUrl, window.location.origin);
      url.search = new URLSearchParams(query).toString();
      await axios.post(url.toString(), value);
      form.reset();
      router.refresh();
    } catch (e) {
      console.log(e);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => {
            return (
              <FormItem>
                <FormControl>
                  <div className="relative p-4 pb-6">
                    <button
                      type="button"
                      onClick={() => onOpen('messageFile', { apiUrl, query })}
                      className="absolute top-7 left-8 h-[24px] w-[24px]
                       bg-zinc-500 dark:bg-zinc-400 hover:bg-zinc-600 dark:hover:bg-zinc-300 rounded-full p-1 flex items-center justify-center"
                    >
                      <Plus className="text-white dark:text-[#313338]" />
                    </button>
                    <Input
                      disabled={isLoading}
                      className="px-14 py-6 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200 "
                      placeholder={`Message ${
                        type === 'conversion' ? name : '#' + name
                      }`}
                      {...field}
                    />
                    <div className="absolute top-7 right-8 ml-auto">
                      <EmojiPicker
                        onChange={(emoji) =>
                          field.onChange(`${field.value}${emoji}`)
                        }
                      />
                    </div>
                  </div>
                </FormControl>
              </FormItem>
            );
          }}
        />
      </form>
    </Form>
  );
};
