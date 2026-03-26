/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import { ExtendedDialog } from './Dialog';
import { ExtendedDrawer } from './Drawer';
import { useIsMobile } from '@/hooks/useIsMobile';

interface Props {
  children?: React.ReactNode;
  isOpen: boolean;
  onClose?: () => unknown;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footerContent?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<Props> = ({ isOpen, onClose, children, title, description, footerContent, size = 'md' }) => {
  const [open, setOpen] = useState<boolean>(isOpen);
  useEffect(() => setOpen(isOpen), [isOpen]);

  const handleClose = () => {
    onClose?.();
    setOpen(false);
  };
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <ExtendedDialog isOpen={open} onClose={handleClose} title={title} description={description} footerContent={footerContent} size={size}>
        {children}
      </ExtendedDialog>
    );
  }

  return (
    <ExtendedDrawer isOpen={open} onClose={handleClose} title={title} description={description} footerContent={footerContent}>
      <div className="px-4 pb-10">{children}</div>
    </ExtendedDrawer>
  );
};
