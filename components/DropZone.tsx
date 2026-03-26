'use client';

import { useDropzone } from 'react-dropzone';
import { Card } from './ui/card';

interface Props {
  onUpload: (url: File[]) => unknown;
}

export const DropZone: React.FC<Props> = ({ onUpload }) => {
  const onDrop = (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    onUpload(acceptedFiles);
  };

  const { getInputProps, getRootProps } = useDropzone({ onDrop });

  return (
    <Card {...getRootProps({ className: 'dropzone' })} className="border-dashed cursor-pointer">
      <input className="input-zone" {...getInputProps()} />
      <div className="items-center justify-center flex flex-col">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-all">
          <span className="text-2xl font-light text-muted-foreground group-hover:text-foreground">+</span>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Import Media</p>
          <p className="text-xs text-muted-foreground mt-1">Drag and drop or browse</p>
        </div>
      </div>
    </Card>
  );
};
