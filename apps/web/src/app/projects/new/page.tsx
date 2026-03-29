'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { createProject } from '@/lib/projects';
import { authStore } from '@/lib/auth-store';
import type { ProjectCategory } from '@os-interact/types';

const CATEGORIES: { value: ProjectCategory; label: string }[] = [
  { value: 'technology', label: 'Technology' },
  { value: 'art', label: 'Art' },
  { value: 'music', label: 'Music' },
  { value: 'film', label: 'Film' },
  { value: 'games', label: 'Games' },
  { value: 'food', label: 'Food' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'other', label: 'Other' },
];

export default function NewProjectPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalDollars, setGoalDollars] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('technology');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      createProject({
        title,
        description,
        goalAmount: Math.round(parseFloat(goalDollars) * 100),
        deadline,
        category,
      }),
    onSuccess: (project) => {
      router.push(`/projects/${project.id}`);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!authStore.isLoggedIn()) {
      router.push('/login');
      return;
    }

    const goal = parseFloat(goalDollars);
    if (!goal || goal < 1) {
      setError('Goal must be at least $1.');
      return;
    }

    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      setError('Deadline must be in the future.');
      return;
    }

    mutation.mutate();
  }

  // Minimum deadline date: tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Start a campaign</h1>
        <p className="text-gray-500 mt-1">Share your idea and start raising funds.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Campaign title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={160}
            required
            placeholder="A clear, compelling title"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">{title.length}/160</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={5}
            placeholder="Describe your project, why it matters, and how you'll use the funds."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Funding goal (USD) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                value={goalDollars}
                onChange={(e) => setGoalDollars(e.target.value)}
                required
                min="1"
                step="0.01"
                placeholder="1000"
                className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Deadline <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              min={minDateStr}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ProjectCategory)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            {mutation.isPending ? 'Creating…' : 'Launch campaign'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
