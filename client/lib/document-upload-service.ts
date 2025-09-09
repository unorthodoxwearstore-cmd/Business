import * as XLSX from 'xlsx';

export interface UploadedFile {
  file: File;
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface ExtractedData {
  id: string;
  sourceFile: string;
  extractedFields: { [key: string]: any };
  confidence: number;
  warnings: string[];
}

export interface DataMappingRule {
  sourceField: string;
  targetField: string;
  transformation?: (value: any) => any;
  required?: boolean;
  validation?: (value: any) => boolean;
}

export interface BulkUploadResult {
  success: boolean;
  data: ExtractedData[];
  errors: string[];
  totalProcessed: number;
  successCount: number;
  failedCount: number;
}

export type DataType = 
  | 'product' 
  | 'customer' 
  | 'vendor' 
  | 'recipe' 
  | 'raw-material' 
  | 'invoice' 
  | 'sale';

export class DocumentUploadService {
  private static instance: DocumentUploadService;
  
  private readonly SUPPORTED_FORMATS = {
    excel: ['.xls', '.xlsx', '.csv'],
    word: ['.doc', '.docx'],
    pdf: ['.pdf'],
    image: ['.jpg', '.jpeg', '.png']
  };

  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  static getInstance(): DocumentUploadService {
    if (!DocumentUploadService.instance) {
      DocumentUploadService.instance = new DocumentUploadService();
    }
    return DocumentUploadService.instance;
  }

  /**
   * Validate uploaded file
   */
  validateFile(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`File size exceeds 10MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const allSupportedFormats = [
      ...this.SUPPORTED_FORMATS.excel,
      ...this.SUPPORTED_FORMATS.word,
      ...this.SUPPORTED_FORMATS.pdf,
      ...this.SUPPORTED_FORMATS.image
    ];

    if (!allSupportedFormats.includes(extension)) {
      errors.push(`Unsupported file format: ${extension}. Supported: ${allSupportedFormats.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Process uploaded file and extract data
   */
  async processFile(file: File, dataType: DataType): Promise<BulkUploadResult> {
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      return {
        success: false,
        data: [],
        errors: validation.errors,
        totalProcessed: 0,
        successCount: 0,
        failedCount: 1
      };
    }

    try {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (this.SUPPORTED_FORMATS.excel.includes(extension)) {
        return await this.processExcelFile(file, dataType);
      } else if (this.SUPPORTED_FORMATS.word.includes(extension)) {
        return await this.processWordFile(file, dataType);
      } else if (this.SUPPORTED_FORMATS.pdf.includes(extension)) {
        return await this.processPdfFile(file, dataType);
      } else {
        throw new Error(`Unsupported file format: ${extension}`);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      return {
        success: false,
        data: [],
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        totalProcessed: 0,
        successCount: 0,
        failedCount: 1
      };
    }
  }

  /**
   * Process Excel files
   */
  private async processExcelFile(file: File, dataType: DataType): Promise<BulkUploadResult> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const result: BulkUploadResult = {
            success: true,
            data: [],
            errors: [],
            totalProcessed: 0,
            successCount: 0,
            failedCount: 0
          };

          // Process each worksheet
          workbook.SheetNames.forEach((sheetName, index) => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length > 0) {
              const headers = jsonData[0] as string[];
              const rows = jsonData.slice(1) as any[][];
              
              rows.forEach((row, rowIndex) => {
                if (row.some(cell => cell !== undefined && cell !== '')) {
                  try {
                    const extractedData = this.mapRowToDataType(headers, row, dataType, rowIndex);
                    result.data.push({
                      id: `${file.name}_${sheetName}_${rowIndex}`,
                      sourceFile: file.name,
                      extractedFields: extractedData,
                      confidence: 0.9,
                      warnings: []
                    });
                    result.successCount++;
                  } catch (error) {
                    result.errors.push(`Sheet "${sheetName}", Row ${rowIndex + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    result.failedCount++;
                  }
                  result.totalProcessed++;
                }
              });
            }
          });

          result.success = result.errors.length === 0 || result.successCount > 0;
          resolve(result);
        } catch (error) {
          resolve({
            success: false,
            data: [],
            errors: [error instanceof Error ? error.message : 'Error reading Excel file'],
            totalProcessed: 0,
            successCount: 0,
            failedCount: 1
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          data: [],
          errors: ['Error reading file'],
          totalProcessed: 0,
          successCount: 0,
          failedCount: 1
        });
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Process Word files (basic text extraction)
   */
  private async processWordFile(file: File, dataType: DataType): Promise<BulkUploadResult> {
    // For now, return a placeholder implementation
    // In a real implementation, you'd use libraries like mammoth.js for .docx
    return {
      success: false,
      data: [],
      errors: ['Word file processing is not yet implemented. Please use Excel files for bulk uploads.'],
      totalProcessed: 0,
      successCount: 0,
      failedCount: 1
    };
  }

  /**
   * Process PDF files (basic text extraction)
   */
  private async processPdfFile(file: File, dataType: DataType): Promise<BulkUploadResult> {
    // For now, return a placeholder implementation
    // In a real implementation, you'd use libraries like pdf-parse or PDF.js
    return {
      success: false,
      data: [],
      errors: ['PDF file processing is not yet implemented. Please use Excel files for bulk uploads.'],
      totalProcessed: 0,
      successCount: 0,
      failedCount: 1
    };
  }

  /**
   * Map row data to specific data type
   */
  private mapRowToDataType(headers: string[], row: any[], dataType: DataType, rowIndex: number): any {
    const mappings = this.getDataTypeMappings(dataType);
    const result: any = {};

    headers.forEach((header, index) => {
      const value = row[index];
      if (value !== undefined && value !== '') {
        const normalizedHeader = this.normalizeFieldName(header);
        const mapping = mappings.find(m => 
          this.normalizeFieldName(m.sourceField) === normalizedHeader ||
          m.sourceField.toLowerCase() === header.toLowerCase()
        );

        if (mapping) {
          try {
            result[mapping.targetField] = mapping.transformation 
              ? mapping.transformation(value)
              : value;

            // Validate if required
            if (mapping.validation && !mapping.validation(result[mapping.targetField])) {
              throw new Error(`Invalid value for ${mapping.targetField}: ${value}`);
            }
          } catch (error) {
            throw new Error(`Error processing ${header}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        } else {
          // Store unmapped fields for manual mapping
          result[`unmapped_${normalizedHeader}`] = value;
        }
      }
    });

    // Validate required fields
    const requiredMappings = mappings.filter(m => m.required);
    requiredMappings.forEach(mapping => {
      if (!(mapping.targetField in result)) {
        throw new Error(`Required field missing: ${mapping.targetField}`);
      }
    });

    return result;
  }

  /**
   * Get data type mappings for field mapping
   */
  private getDataTypeMappings(dataType: DataType): DataMappingRule[] {
    switch (dataType) {
      case 'product':
        return [
          { sourceField: 'name', targetField: 'name', required: true },
          { sourceField: 'product_name', targetField: 'name', required: true },
          { sourceField: 'sku', targetField: 'sku', required: true },
          { sourceField: 'product_code', targetField: 'sku', required: true },
          { sourceField: 'price', targetField: 'price', transformation: parseFloat, required: true },
          { sourceField: 'cost', targetField: 'cost', transformation: parseFloat },
          { sourceField: 'category', targetField: 'category' },
          { sourceField: 'description', targetField: 'description' },
          { sourceField: 'stock', targetField: 'stock', transformation: parseInt },
          { sourceField: 'quantity', targetField: 'stock', transformation: parseInt },
          { sourceField: 'unit', targetField: 'unit' }
        ];

      case 'customer':
        return [
          { sourceField: 'name', targetField: 'name', required: true },
          { sourceField: 'customer_name', targetField: 'name', required: true },
          { sourceField: 'phone', targetField: 'phone', required: true },
          { sourceField: 'mobile', targetField: 'phone', required: true },
          { sourceField: 'email', targetField: 'email' },
          { sourceField: 'address', targetField: 'address' },
          { sourceField: 'city', targetField: 'city' },
          { sourceField: 'company', targetField: 'company' },
          { sourceField: 'gst_number', targetField: 'gstNumber' },
          { sourceField: 'gst', targetField: 'gstNumber' }
        ];

      case 'vendor':
        return [
          { sourceField: 'name', targetField: 'name', required: true },
          { sourceField: 'vendor_name', targetField: 'name', required: true },
          { sourceField: 'company', targetField: 'company', required: true },
          { sourceField: 'contact_person', targetField: 'contactPerson' },
          { sourceField: 'phone', targetField: 'phone', required: true },
          { sourceField: 'email', targetField: 'email' },
          { sourceField: 'address', targetField: 'address' },
          { sourceField: 'gst_number', targetField: 'gstNumber' },
          { sourceField: 'payment_terms', targetField: 'paymentTerms' }
        ];

      case 'raw-material':
        return [
          { sourceField: 'name', targetField: 'name', required: true },
          { sourceField: 'material_name', targetField: 'name', required: true },
          { sourceField: 'code', targetField: 'code', required: true },
          { sourceField: 'material_code', targetField: 'code', required: true },
          { sourceField: 'unit', targetField: 'unit', required: true },
          { sourceField: 'cost_per_unit', targetField: 'costPerUnit', transformation: parseFloat },
          { sourceField: 'cost', targetField: 'costPerUnit', transformation: parseFloat },
          { sourceField: 'supplier', targetField: 'supplier' },
          { sourceField: 'category', targetField: 'category' },
          { sourceField: 'stock', targetField: 'currentStock', transformation: parseInt },
          { sourceField: 'quantity', targetField: 'currentStock', transformation: parseInt }
        ];

      case 'recipe':
        return [
          { sourceField: 'recipe_name', targetField: 'name', required: true },
          { sourceField: 'name', targetField: 'name', required: true },
          { sourceField: 'product', targetField: 'productName', required: true },
          { sourceField: 'yield', targetField: 'yield', transformation: parseInt },
          { sourceField: 'quantity', targetField: 'yield', transformation: parseInt },
          { sourceField: 'unit', targetField: 'unit' },
          { sourceField: 'material', targetField: 'materialName' },
          { sourceField: 'material_quantity', targetField: 'materialQuantity', transformation: parseFloat },
          { sourceField: 'notes', targetField: 'notes' }
        ];

      default:
        return [
          { sourceField: 'name', targetField: 'name', required: true },
          { sourceField: 'description', targetField: 'description' },
          { sourceField: 'value', targetField: 'value' }
        ];
    }
  }

  /**
   * Normalize field names for better matching
   */
  private normalizeFieldName(fieldName: string): string {
    return fieldName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  /**
   * Get template download for data type
   */
  getTemplateForDataType(dataType: DataType): { filename: string; headers: string[] } {
    const mappings = this.getDataTypeMappings(dataType);
    const headers = mappings.map(m => m.sourceField);

    return {
      filename: `${dataType}_upload_template.xlsx`,
      headers
    };
  }

  /**
   * Generate and download template file
   */
  downloadTemplate(dataType: DataType): void {
    const template = this.getTemplateForDataType(dataType);
    
    // Create workbook with headers
    const ws = XLSX.utils.aoa_to_sheet([template.headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');

    // Download file
    XLSX.writeFile(wb, template.filename);
  }
}

export const documentUploadService = DocumentUploadService.getInstance();
