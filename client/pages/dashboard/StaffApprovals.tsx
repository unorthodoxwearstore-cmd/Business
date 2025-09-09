import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { staffRequestRepository } from '@/services/indexeddb/repositories/staffRequestRepository';
import { usePermissions } from '@/lib/permissions';

interface Req {
  id: string;
  businessName: string;
  staffName: string;
  phone: string;
  email: string;
  role: string;
  status: 'PENDING'|'ACTIVE'|'REJECTED';
  reason?: string;
  createdAt: string;
}

export default function StaffApprovals() {
  const [requests, setRequests] = useState<Req[]>([]);
  const permissions = usePermissions();

  useEffect(() => {
    staffRequestRepository.getAll().then(list => setRequests(list.filter(r => r.status === 'PENDING')));
  }, []);

  if (!permissions.isOwner) {
    return (
      <div className="p-6"><Card><CardContent className="p-6 text-center">Owner access required</CardContent></Card></div>
    );
  }

  const approve = async (id: string) => {
    await staffRequestRepository.approve(id);
    setRequests(prev => prev.filter(r => r.id !== id));
  };
  const reject = async (id: string) => {
    await staffRequestRepository.reject(id);
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Staff Approvals</h1>
      <Card>
        <CardHeader><CardTitle>Pending Requests</CardTitle></CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-sm text-gray-500">No pending staff requests.</div>
          ) : (
            <div className="overflow-x-auto border rounded">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 text-left">Staff</th>
                    <th className="p-2 text-left">Role</th>
                    <th className="p-2 text-left">Contact</th>
                    <th className="p-2 text-left">Business</th>
                    <th className="p-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2">{r.staffName}</td>
                      <td className="p-2">{r.role}</td>
                      <td className="p-2">{r.email} · {r.phone}</td>
                      <td className="p-2">{r.businessName}</td>
                      <td className="p-2 text-right space-x-2">
                        <Button size="sm" onClick={()=>approve(r.id)}>Approve</Button>
                        <Button size="sm" variant="outline" onClick={()=>reject(r.id)}>Reject</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
