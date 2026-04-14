'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getMe } from '@/lib/auth';
import {
  fetchWaitlist,
  exportWaitlistCsv,
  banEntry,
  unbanEntry,
  resendConfirmation,
  grantGenpoints,
  type WaitlistEntry,
} from '@/lib/admin';

type SortField = 'position' | 'email' | 'referralCount' | 'tier' | 'status' | 'createdAt';

function SortHeader({
  label,
  field,
  current,
  order,
  onSort,
}: {
  label: string;
  field: SortField;
  current: SortField;
  order: 'asc' | 'desc';
  onSort: (f: SortField) => void;
}) {
  const active = current === field;
  return (
    <th
      className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-900 select-none"
      onClick={() => onSort(field)}
    >
      {label}
      {active && <span className="ml-1">{order === 'asc' ? '\u25B2' : '\u25BC'}</span>}
    </th>
  );
}

function ActionButtons({
  entry,
  onAction,
}: {
  entry: WaitlistEntry;
  onAction: (msg: string) => void;
}) {
  const queryClient = useQueryClient();
  const [genpointsAmount, setGenpointsAmount] = useState('');
  const [showGrantInput, setShowGrantInput] = useState(false);

  const banMut = useMutation({
    mutationFn: () => (entry.status === 'banned' ? unbanEntry(entry.id) : banEntry(entry.id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-waitlist'] });
      onAction(entry.status === 'banned' ? `Unbanned ${entry.email}` : `Banned ${entry.email}`);
    },
  });

  const resendMut = useMutation({
    mutationFn: () => resendConfirmation(entry.id),
    onSuccess: (res) => onAction(res.message),
  });

  const grantMut = useMutation({
    mutationFn: () => grantGenpoints(entry.id, Number(genpointsAmount)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-waitlist'] });
      onAction(`Granted ${genpointsAmount} genpoints to ${entry.email}`);
      setGenpointsAmount('');
      setShowGrantInput(false);
    },
  });

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={() => resendMut.mutate()}
        disabled={resendMut.isPending}
        className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition disabled:opacity-50"
      >
        Resend
      </button>
      <button
        onClick={() => banMut.mutate()}
        disabled={banMut.isPending}
        className={`px-2 py-1 text-xs rounded transition disabled:opacity-50 ${
          entry.status === 'banned'
            ? 'bg-green-50 text-green-700 hover:bg-green-100'
            : 'bg-red-50 text-red-700 hover:bg-red-100'
        }`}
      >
        {entry.status === 'banned' ? 'Unban' : 'Ban'}
      </button>
      {showGrantInput ? (
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (Number(genpointsAmount) > 0) grantMut.mutate();
          }}
        >
          <input
            type="number"
            min="1"
            value={genpointsAmount}
            onChange={(e) => setGenpointsAmount(e.target.value)}
            placeholder="Pts"
            className="w-16 px-1.5 py-1 text-xs border border-gray-300 rounded"
          />
          <button
            type="submit"
            disabled={grantMut.isPending || Number(genpointsAmount) <= 0}
            className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition disabled:opacity-50"
          >
            Grant
          </button>
          <button
            type="button"
            onClick={() => setShowGrantInput(false)}
            className="px-1 py-1 text-xs text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowGrantInput(true)}
          className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition"
        >
          +GP
        </button>
      )}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<SortField>('position');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState('');
  const limit = 50;

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-waitlist', sortBy, sortOrder, page],
    queryFn: () => fetchWaitlist({ sortBy, sortOrder, page, limit }),
    enabled: !!user,
  });

  function handleSort(field: SortField) {
    if (field === sortBy) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleExport() {
    const csv = await exportWaitlistCsv();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'waitlist.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">
            Waitlist management &middot; {data?.total ?? 0} entries
          </p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition"
        >
          Export CSV
        </button>
      </div>

      {toast && (
        <div className="mb-4 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
          {toast}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <SortHeader label="#" field="position" current={sortBy} order={sortOrder} onSort={handleSort} />
                <SortHeader label="Email" field="email" current={sortBy} order={sortOrder} onSort={handleSort} />
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <SortHeader label="Referrals" field="referralCount" current={sortBy} order={sortOrder} onSort={handleSort} />
                <SortHeader label="Tier" field="tier" current={sortBy} order={sortOrder} onSort={handleSort} />
                <SortHeader label="Status" field="status" current={sortBy} order={sortOrder} onSort={handleSort} />
                <SortHeader label="Joined" field="createdAt" current={sortBy} order={sortOrder} onSort={handleSort} />
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={8} className="px-3 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                : data?.entries.map((entry) => (
                    <tr key={entry.id} className={entry.status === 'banned' ? 'bg-red-50/50' : ''}>
                      <td className="px-3 py-3 text-gray-600">{entry.position ?? '-'}</td>
                      <td className="px-3 py-3 font-medium text-gray-900">{entry.email}</td>
                      <td className="px-3 py-3 text-gray-600">{entry.name ?? '-'}</td>
                      <td className="px-3 py-3 text-gray-600">{entry.referralCount}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            entry.tier === 'elite'
                              ? 'bg-yellow-100 text-yellow-800'
                              : entry.tier === 'vip'
                                ? 'bg-purple-100 text-purple-800'
                                : entry.tier === 'silver'
                                  ? 'bg-gray-200 text-gray-700'
                                  : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {entry.tier}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            entry.status === 'banned'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-500 text-xs">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-3">
                        <ActionButtons entry={entry} onAction={showToast} />
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {data && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages} ({data.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
