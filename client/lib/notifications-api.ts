export type InboxNotification = {
  id: string;
  type: 'production' | 'inventory' | 'recipe' | 'info';
  title: string;
  message: string;
  link?: string;
  createdAt: string;
  read: boolean;
};

async function http<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const notificationsApi = {
  create(input: Omit<InboxNotification, 'id' | 'createdAt' | 'read'>) {
    return http<InboxNotification>('/api/notifications', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  list(unread?: boolean) {
    const q = unread ? '?unread=true' : '';
    return http<InboxNotification[]>(`/api/notifications${q}`);
  },
  markRead(id: string, read: boolean) {
    return http<InboxNotification>(`/api/notifications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ read }),
    });
  },
  markAllRead() {
    return http<{ success: true }>(`/api/notifications/mark-all-read`, {
      method: 'POST',
    });
  },
};
