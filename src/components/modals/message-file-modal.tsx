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
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileUpload } from '@/components/file-upload';
import { useRouter } from 'next/navigation';
import { useModal } from '@/hooks/use-modal-store';
import { TypeOf, object, string } from 'zod';
import { useState } from 'react';

const uploadFileSchema = object({
  fileUrl: string().nonempty({ message: 'Attachment is required' }),
});
type UploadFileForm = TypeOf<typeof uploadFileSchema>;
export const MessageFileModal = () => {
  const router = useRouter();
  const { opened, onClose, type, data } = useModal();
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const modalOpenTriggered = opened && type === 'messageFile';
  const uploadFileForm = useForm<UploadFileForm>({
    defaultValues: { fileUrl: '' },
    resolver: zodResolver(uploadFileSchema),
  });

  const preparingFormSubmit = uploadFileForm.formState.isLoading;
  const { apiUrl, query } = data ?? {};
  const onUploadFile = uploadFileForm.handleSubmit(async (payload) => {
    try {
      setUploadInProgress(true);
      const url = new URL(apiUrl ?? '', location.origin);
      url.search = new URLSearchParams(query ?? {}).toString();
      await axios.post(url.toString(), {
        ...payload,
        content: payload.fileUrl,
      });
      uploadFileForm.reset();
      router.refresh();
      onClose();
    } catch (e) {
      console.log(e);
    } finally {
      setUploadInProgress(false);
    }
  });

  const handleClose = () => {
    uploadFileForm.reset();
    onClose();
  };

  return (
    <Dialog open={modalOpenTriggered} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Add an attachment
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500">
            Send a file as a message
          </DialogDescription>
        </DialogHeader>
        <Form {...uploadFileForm}>
          <form onSubmit={onUploadFile} className="space-y-8">
            <div className="space-y-8 px-6">
              <div className="flex items-center justify-center text-center">
                <FormField
                  control={uploadFileForm.control}
                  name="fileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileUpload
                          endpoint="messageFile"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter className="bg-gray-100 px-6 py-4">
              <Button
                variant="primary"
                disabled={uploadInProgress || preparingFormSubmit}
              >
                Send
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
