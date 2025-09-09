import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ImportBatchDetail(){
  const { batchId } = useParams();
  const batches = JSON.parse(localStorage.getItem('insygth_import_batches') || '[]');
  const batch = batches.find((b: any) => b.id === batchId);

  if (!batch) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">Batch not found</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <Link to="/dashboard/inventory" className="text-blue-600">← Back</Link>
      <Card>
        <CardHeader>
          <CardTitle>Import Batch {batch.id}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>Module: <b>{batch.module}</b></div>
          <div>Created: <b>{new Date(batch.createdAt).toLocaleString()}</b> by <b>{batch.createdBy}</b></div>
          <div>Branch: <b>{batch.branchId || 'All'}</b></div>
          <div>File: <b>{batch.fileName}</b></div>
          <div>Counts: Imported {batch.rowCounts.imported}, Updated {batch.rowCounts.updated}, Skipped {batch.rowCounts.skipped}</div>
          {batch.errorsCsv && <div><a href={batch.errorsCsv} target="_blank" className="text-red-600">Download Errors CSV</a></div>}
        </CardContent>
      </Card>
    </div>
  );
}
