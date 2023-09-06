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
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const InitialModal = () => {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const createInitServerForm = useForm<ClientInsertServer>({
    defaultValues: { name: '', imageUrl: '' },
    resolver: zodResolver(clientInsertServer),
  });

  const preparingFormSubmit = createInitServerForm.formState.isLoading;

  const onSubmitCreateServer = createInitServerForm.handleSubmit(
    async (payload) => {
      try {
        await axios.post('/api/servers', payload);
        createInitServerForm.reset();
        router.refresh();
        window.location.reload();
      } catch (e) {
        console.log(e);
      }
    }
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // if (!mounted) return null;

  return (
    <Dialog open={true}>
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
                        disabled={preparingFormSubmit}
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
              <Button variant="primary" disabled={preparingFormSubmit}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
