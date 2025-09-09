import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Upload, Image as ImageIcon, FileText } from 'lucide-react';
import React from 'react';

export type ImportTriggerProps = {
  onImport: (type: 'image' | 'file') => void;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
};

export const SmartImportButton: React.FC<ImportTriggerProps> = ({ onImport, size = 'sm', variant = 'outline' }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <Upload className="w-4 h-4 mr-2" />
          Smart Import
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onImport('image')}>
          <ImageIcon className="w-4 h-4 mr-2" /> Import from Image
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onImport('file')}>
          <FileText className="w-4 h-4 mr-2" /> Import from File
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
