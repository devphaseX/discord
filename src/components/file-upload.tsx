'use client';
import { X } from 'lucide-react';
import Image from 'next/image';
import { UploadDropzone } from '@/lib/uploadThings';
import '@uploadthing/react/styles.css';

import { ourFileRouter } from '@/app/api/uploadthing/core';
import { FC } from 'react';

interface FileUploadProps {
  endpoint: keyof typeof ourFileRouter;
  value: string | null | undefined;
  onChange: (url?: string) => void;
}
export const FileUpload: FC<FileUploadProps> = ({
  value,
  endpoint,
  onChange,
}) => {
  const fileType = value?.split('.').pop();

  if (value && fileType?.toLowerCase() !== 'pdf') {
    return (
      <div className="relative h-20 w-20">
        <Image fill src={value} alt="Upload" className="rounded-full" />
        <button
          onClick={() => onChange('')}
          className="bg-rose-500 text-white p-1 rounded-full absolute top-0 right-0 shadow-sm"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <UploadDropzone
      onClientUploadComplete={(res) => {
        onChange(res?.[0].url as string);
      }}
      onUploadError={(error) => {
        console.log(error);
      }}
      endpoint={endpoint}
    />
  );
};
