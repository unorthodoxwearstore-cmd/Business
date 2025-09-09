import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  Download, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Eye,
  FileSpreadsheet,
  FileImage,
  File,
  Trash2
} from 'lucide-react';
import { documentUploadService, DataType, ExtractedData, BulkUploadResult } from '@/lib/document-upload-service';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataType: DataType;
  onDataProcessed: (data: ExtractedData[]) => void;
  title?: string;
  description?: string;
}

export default function BulkUploadModal({
  isOpen,
  onClose,
  dataType,
  onDataProcessed,
  title,
  description
}: BulkUploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BulkUploadResult | null>(null);
  const [previewData, setPreviewData] = useState<ExtractedData[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'results'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetModal = useCallback(() => {
    setFiles([]);
    setProcessing(false);
    setProgress(0);
    setResults(null);
    setPreviewData([]);
    setCurrentStep('upload');
  }, []);

  const handleClose = useCallback(() => {
    resetModal();
    onClose();
  }, [resetModal, onClose]);

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <FileSpreadsheet className="w-8 h-8 text-green-600" />;
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-600" />;
      case 'doc':
      case 'docx':
        return <File className="w-8 h-8 text-blue-600" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <FileImage className="w-8 h-8 text-purple-600" />;
      default:
        return <File className="w-8 h-8 text-gray-600" />;
    }
  };

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles);
    const validFiles: File[] = [];
    const errors: string[] = [];

    newFiles.forEach(file => {
      const validation = documentUploadService.validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.errors.join(', ')}`);
      }
    });

    if (errors.length > 0) {
      toast({
        title: "File Validation Errors",
        description: errors.join('\n'),
        variant: "destructive"
      });
    }

    setFiles(prev => [...prev, ...validFiles]);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const processFiles = useCallback(async () => {
    if (files.length === 0) return;

    setProcessing(true);
    setProgress(0);
    const allResults: ExtractedData[] = [];
    const allErrors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress(((i + 1) / files.length) * 100);

      try {
        const result = await documentUploadService.processFile(file, dataType);
        
        if (result.success) {
          allResults.push(...result.data);
          toast({
            title: "File Processed",
            description: `${file.name}: ${result.successCount} records extracted`,
            variant: "default"
          });
        } else {
          allErrors.push(...result.errors.map(error => `${file.name}: ${error}`));
        }
      } catch (error) {
        allErrors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const finalResult: BulkUploadResult = {
      success: allResults.length > 0,
      data: allResults,
      errors: allErrors,
      totalProcessed: allResults.length + allErrors.length,
      successCount: allResults.length,
      failedCount: allErrors.length
    };

    setResults(finalResult);
    setPreviewData(allResults);
    setProcessing(false);
    setCurrentStep('preview');

    if (allErrors.length > 0) {
      toast({
        title: "Processing Completed with Errors",
        description: `${allResults.length} records extracted, ${allErrors.length} errors occurred`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Processing Completed",
        description: `Successfully extracted ${allResults.length} records`,
        variant: "default"
      });
    }
  }, [files, dataType, toast]);

  const confirmData = useCallback(() => {
    onDataProcessed(previewData);
    setCurrentStep('results');
    
    toast({
      title: "Data Imported",
      description: `${previewData.length} records have been imported successfully`,
      variant: "default"
    });
  }, [previewData, onDataProcessed, toast]);

  const downloadTemplate = useCallback(() => {
    documentUploadService.downloadTemplate(dataType);
    toast({
      title: "Template Downloaded",
      description: "Upload template has been downloaded to your computer",
      variant: "default"
    });
  }, [dataType, toast]);

  const renderUploadStep = () => (
    <div className="space-y-6">
      {/* Template Download */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg text-blue-800">Download Template</CardTitle>
          </div>
          <CardDescription className="text-blue-700">
            Download a pre-formatted template to ensure your data is structured correctly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadTemplate} variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download {dataType.charAt(0).toUpperCase() + dataType.slice(1)} Template
          </Button>
        </CardContent>
      </Card>

      {/* File Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Select or drag & drop Excel, Word, or PDF files to extract data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supported formats: Excel (.xlsx, .xls, .csv), Word (.doc, .docx), PDF (.pdf)
            </p>
            <p className="text-xs text-gray-400">
              Maximum file size: 10MB per file
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".xlsx,.xls,.csv,.doc,.docx,.pdf"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="mt-6 space-y-2">
              <h4 className="font-medium text-gray-900">Selected Files ({files.length})</h4>
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file)}
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Process Button */}
          {files.length > 0 && (
            <div className="mt-6 flex gap-2">
              <Button 
                onClick={processFiles} 
                disabled={processing}
                className="flex-1"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Process Files
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setFiles([])}>
                Clear All
              </Button>
            </div>
          )}

          {/* Progress */}
          {processing && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Processing files...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
          <CardDescription>
            Review the extracted data before importing. You can edit individual records if needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{results?.successCount || 0}</div>
              <div className="text-sm text-gray-600">Records Extracted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{results?.failedCount || 0}</div>
              <div className="text-sm text-gray-600">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{results?.totalProcessed || 0}</div>
              <div className="text-sm text-gray-600">Total Processed</div>
            </div>
          </div>

          {/* Errors */}
          {results?.errors && results.errors.length > 0 && (
            <Alert className="mb-4" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <details>
                  <summary className="cursor-pointer font-medium">
                    {results.errors.length} error(s) occurred during processing
                  </summary>
                  <ul className="mt-2 list-disc list-inside text-sm">
                    {results.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </details>
              </AlertDescription>
            </Alert>
          )}

          {/* Data Table */}
          {previewData.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-900">Source</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-900">Data</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-900">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 10).map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2 text-gray-600">
                          <Badge variant="outline" className="text-xs">
                            {item.sourceFile}
                          </Badge>
                        </td>
                        <td className="px-4 py-2">
                          <div className="space-y-1">
                            {Object.entries(item.extractedFields).slice(0, 3).map(([key, value]) => (
                              <div key={key} className="flex gap-2">
                                <span className="text-gray-500 min-w-20">{key}:</span>
                                <span className="text-gray-900">{String(value)}</span>
                              </div>
                            ))}
                            {Object.keys(item.extractedFields).length > 3 && (
                              <div className="text-xs text-gray-400">
                                +{Object.keys(item.extractedFields).length - 3} more fields
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <Badge 
                            variant={item.confidence > 0.8 ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {Math.round(item.confidence * 100)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewData.length > 10 && (
                <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 text-center">
                  Showing 10 of {previewData.length} records
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-6">
            <Button onClick={confirmData} className="flex-1" disabled={previewData.length === 0}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Import {previewData.length} Records
            </Button>
            <Button variant="outline" onClick={() => setCurrentStep('upload')}>
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderResultsStep = () => (
    <div className="space-y-6">
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <CardTitle className="text-green-800">Import Completed Successfully</CardTitle>
          <CardDescription className="text-green-700">
            {previewData.length} records have been imported and are now available in your system
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={handleClose} className="w-full">
            Done
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {title || `Bulk Upload ${dataType.charAt(0).toUpperCase() + dataType.slice(1)}s`}
          </DialogTitle>
          <DialogDescription>
            {description || `Upload and import multiple ${dataType}s from Excel, Word, or PDF files`}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentStep} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" disabled={currentStep !== 'upload'}>
              1. Upload Files
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={currentStep === 'upload'}>
              2. Preview Data
            </TabsTrigger>
            <TabsTrigger value="results" disabled={currentStep !== 'results'}>
              3. Complete
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            {renderUploadStep()}
          </TabsContent>

          <TabsContent value="preview">
            {renderPreviewStep()}
          </TabsContent>

          <TabsContent value="results">
            {renderResultsStep()}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
