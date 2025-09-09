import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet } from 'lucide-react';
import BulkUploadModal from './BulkUploadModal';
import { DataType, ExtractedData } from '@/lib/document-upload-service';
import { usePermissions } from '@/lib/permissions';

interface BulkUploadButtonProps {
  dataType: DataType;
  onDataImported: (data: ExtractedData[]) => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  title?: string;
  description?: string;
  requiredPermission?: string;
}

export default function BulkUploadButton({
  dataType,
  onDataImported,
  disabled = false,
  variant = 'outline',
  size = 'default',
  className = '',
  title,
  description,
  requiredPermission
}: BulkUploadButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { hasPermission } = usePermissions();

  // Check permissions if required
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null;
  }

  const handleDataProcessed = (data: ExtractedData[]) => {
    onDataImported(data);
    setIsModalOpen(false);
  };

  const getDataTypeLabel = (type: DataType): string => {
    switch (type) {
      case 'product':
        return 'Products';
      case 'customer':
        return 'Customers';
      case 'vendor':
        return 'Vendors';
      case 'recipe':
        return 'Recipes';
      case 'raw-material':
        return 'Raw Materials';
      case 'invoice':
        return 'Invoices';
      case 'sale':
        return 'Sales';
      default:
        return 'Data';
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
        className={`flex items-center gap-2 ${className}`}
      >
        <Upload className="w-4 h-4" />
        <span className="hidden sm:inline">
          Bulk Upload
        </span>
        <FileSpreadsheet className="w-4 h-4 sm:hidden" />
      </Button>

      <BulkUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dataType={dataType}
        onDataProcessed={handleDataProcessed}
        title={title}
        description={description}
      />
    </>
  );
}
