'use client';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  ClientInsertChannel,
  channelType,
  clientInsertChannel,
} from '@/schema/tables';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useModal } from '@/hooks/use-modal-store';
import {
  SelectContent,
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const CreateChannelModal = () => {
  const router = useRouter();
  const params = useParams() as { serverId?: string };
  const { onClose, onOpen, opened, type } = useModal();
  const createChannelForm = useForm<ClientInsertChannel>({
    defaultValues: { name: '', type: 'TEXT' },
    resolver: zodResolver(clientInsertChannel),
  });

  const validatingFormSubmit = createChannelForm.formState.isLoading;
  const [submittingForm, setFormSubmitting] = useState(false);
  const shouldOpenModal = type === 'createChannel' && opened;

  const handleClose = () => {
    createChannelForm.reset();
    onClose();
  };
  const onSubmitCreateServer = createChannelForm.handleSubmit(
    async (payload) => {
      try {
        if (!params.serverId) {
          return new TypeError('Server Id missing');
        }
        const url = new URL('/api/channels', window.location.origin);
        const query = new URLSearchParams({
          serverId: params.serverId,
        });

        url.search = query.toString();
        setFormSubmitting(true);
        await axios.post(url.toString(), payload);
        createChannelForm.reset();
        router.refresh();
        onClose();
      } catch (e) {
        console.log(e);
      } finally {
        setFormSubmitting(false);
      }
    }
  );

  return (
    <Dialog open={shouldOpenModal} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Create Channel
          </DialogTitle>
        </DialogHeader>
        <Form {...createChannelForm}>
          <form onSubmit={onSubmitCreateServer} className="space-y-8">
            <div className="space-y-8 px-6">
              <FormField
                control={createChannelForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70">
                      Channel name
                    </FormLabel>
                    <FormControl>
                      <Input
                        disabled={validatingFormSubmit || submittingForm}
                        className="bg-zinc-300/50 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0"
                        placeholder="Enter channel name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createChannelForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Type</FormLabel>
                    <Select
                      disabled={validatingFormSubmit || submittingForm}
                      onOpenChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger
                          className="bg-zinc-300/50 border-0 
                        focus:ring-0 text-black ring-offset-0 focus:ring-offset-0
                        outline-none
                        "
                        >
                          <SelectValue placeholder="Select a channel type" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        {channelType.enumValues.map((type) => (
                          <SelectItem
                            key={type}
                            value={type}
                            className="capitalize"
                          >
                            {type.toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="bg-gray-100 px-6 py-4">
              <Button
                variant="primary"
                disabled={validatingFormSubmit || submittingForm}
              >
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
