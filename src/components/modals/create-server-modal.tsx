'use client';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { ClientInsertServer, clientInsertServer } from '@/schema/tables';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileUpload } from '@/components/file-upload';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '@/hooks/use-modal-store';

export const CreateServerModal = () => {
  const router = useRouter();
  const { onClose, onOpen, opened, type } = useModal();
  const createInitServerForm = useForm<ClientInsertServer>({
    defaultValues: { name: '', imageUrl: '' },
    resolver: zodResolver(clientInsertServer),
  });

  const validatingFormSubmit = createInitServerForm.formState.isLoading;
  const [submittingForm, setFormSubmitting] = useState(false);
  const shouldOpenModal = type === 'createServer' && opened;

  const handleClose = () => {
    createInitServerForm.reset();
    onClose();
  };
  const onSubmitCreateServer = createInitServerForm.handleSubmit(
    async (payload) => {
      try {
        setFormSubmitting(true);
        await axios.post('/api/servers', payload);
        createInitServerForm.reset();
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
            Customize your server
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500">
            Give your server a personality with a name and an image. You can
            always change it later.
          </DialogDescription>
        </DialogHeader>
        <Form {...createInitServerForm}>
          <form onSubmit={onSubmitCreateServer} className="space-y-8">
            <div className="space-y-8 px-6">
              <div className="flex items-center justify-center text-center">
                <FormField
                  control={createInitServerForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileUpload
                          endpoint="serverImage"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createInitServerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70">
                      Server name
                    </FormLabel>
                    <FormControl>
                      <Input
                        disabled={validatingFormSubmit || submittingForm}
                        className="bg-zinc-300/50 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0"
                        placeholder="Enter server name"
                        {...field}
                      />
                    </FormControl>
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
