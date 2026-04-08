import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { getSession } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/admin';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session || !isAdmin(session.email)) {
    notFound();
  }

  return (
    <div className="admin-layout">
      <div className="admin-layout__header">
        <span className="admin-layout__label">admin</span>
        <span className="admin-layout__user">{session.email}</span>
      </div>
      {children}
    </div>
  );
}
