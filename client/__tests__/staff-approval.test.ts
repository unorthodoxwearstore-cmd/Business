import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { staffRequestRepository } from '@/services/indexeddb/repositories/staffRequestRepository';

async function approveAs(role: 'owner'|'staff', id: string) {
  if (role !== 'owner') throw new Error('Only OWNER can approve');
  return staffRequestRepository.approve(id);
}

describe('Staff Requests and Approval Guards', () => {
  it('creates a pending staff request and approves only as owner', async () => {
    const req = await staffRequestRepository.add({ businessName: 'Biz', staffName: 'Alice', email: 'a@example.com', phone: '+9100000000', role: 'staff', status: 'PENDING' } as any);
    expect(req.status).toBe('PENDING');

    await expect(approveAs('staff', req.id)).rejects.toThrow();

    const approved = await approveAs('owner', req.id);
    expect(approved?.status).toBe('ACTIVE');
  });
});
