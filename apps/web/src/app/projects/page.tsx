'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { listProjects } from '@/lib/projects';
import type { Project, ProjectCategory, ProjectStatus } from '@os-interact/types';

const CATEGORIES: { value: ProjectCategory | ''; label: string }[] = [
  { value: '', label: 'All categories' },
  { value: 'technology', label: 'Technology' },
  { value: 'art', label: 'Art' },
  { value: 'music', label: 'Music' },
  { value: 'film', label: 'Film' },
  { value: 'games', label: 'Games' },
  { value: 'food', label: 'Food' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'other', label: 'Other' },
];

const STATUSES: { value: ProjectStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'funded', label: 'Funded' },
  { value: 'expired', label: 'Expired' },
];

function progressPercent(raised: number, goal: number) {
  return Math.min(100, Math.round((raised / goal) * 100));
}

function daysLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
}

function ProjectCard({ project }: { project: Project }) {
  const pct = progressPercent(project.raisedAmount, project.goalAmount);
  const days = daysLeft(project.deadline);

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group block bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full capitalize">
            {project.category}
          </span>
          {project.status !== 'active' && (
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
              {project.status}
            </span>
          )}
        </div>
        <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-blue-600 transition line-clamp-2">
          {project.title}
        </h3>
        <p className="text-gray-500 text-sm line-clamp-2 mb-4">{project.description}</p>

        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="font-semibold text-gray-900">
              ${(project.raisedAmount / 100).toLocaleString()}
            </p>
            <p className="text-gray-400 text-xs">
              of ${(project.goalAmount / 100).toLocaleString()} goal
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900">{pct}%</p>
            <p className="text-gray-400 text-xs">{days} days left</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ProjectCategory | ''>('');
  const [status, setStatus] = useState<ProjectStatus | ''>('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', debouncedSearch, category, status],
    queryFn: () =>
      listProjects({
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(category ? { category } : {}),
        ...(status ? { status } : {}),
      }),
  });

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setSearch(v);
    clearTimeout((window as Window & { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer);
    (window as Window & { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(
      () => setDebouncedSearch(v),
      300,
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Discover Projects</h1>
          <p className="text-gray-500 mt-1">Back ideas that inspire you</p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
        >
          + Start a campaign
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search projects…"
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ProjectCategory | '')}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus | '')}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">No projects found</p>
          <p className="text-sm mt-1">Try adjusting your filters or be the first to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
