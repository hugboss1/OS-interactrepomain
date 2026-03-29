'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getMe, updateProfile, logout, resendVerification } from '@/lib/auth';

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const [name, setName] = useState('');
  const [saveMsg, setSaveMsg] = useState('');

  const updateMutation = useMutation({
    mutationFn: () => updateProfile({ name: name || user?.name }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me'] });
      setSaveMsg('Profile updated.');
      setTimeout(() => setSaveMsg(''), 3000);
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => resendVerification(user!.email),
    onSuccess: (res) => setSaveMsg(res.message),
  });

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Profile</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div>
          <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Email</p>
          <div className="flex items-center gap-2">
            <p className="text-gray-700">{user.email}</p>
            {user.emailVerified ? (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Verified
              </span>
            ) : (
              <button
                onClick={() => resendMutation.mutate()}
                disabled={resendMutation.isPending}
                className="text-xs text-blue-600 hover:underline disabled:opacity-50"
              >
                Resend verification
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 uppercase font-semibold mb-1">
            Display name
          </label>
          <input
            type="text"
            defaultValue={user.name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {saveMsg && <p className="text-green-600 text-sm">{saveMsg}</p>}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
