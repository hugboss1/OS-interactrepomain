'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { getProject, listPledges, createPledge } from '@/lib/projects';
import { authStore } from '@/lib/auth-store';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
);

function progressPercent(raised: number, goal: number) {
  return Math.min(100, Math.round((raised / goal) * 100));
}

function daysLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
}

// ─── Stripe checkout form ─────────────────────────────────────────────────────

function CheckoutForm({
  projectId,
  clientSecret,
  amountCents,
  onSuccess,
  onCancel,
}: {
  projectId: string;
  clientSecret: string;
  amountCents: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [stripeError, setStripeError] = useState('');

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setStripeError('');

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      setStripeError(error.message ?? 'Payment failed. Please try again.');
      setSubmitting(false);
    } else {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <p className="text-sm text-gray-600">
        Pledging{' '}
        <span className="font-semibold text-gray-900">
          ${(amountCents / 100).toFixed(2)}
        </span>
      </p>
      <PaymentElement />
      {stripeError && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {stripeError}
        </p>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || !stripe}
          className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50"
        >
          {submitting ? 'Processing…' : 'Confirm pledge'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Pledge panel ─────────────────────────────────────────────────────────────

function PledgePanel({ projectId }: { projectId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [amountDollars, setAmountDollars] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amountCents, setAmountCents] = useState(0);
  const [pledgeError, setPledgeError] = useState('');
  const [pledged, setPledged] = useState(false);

  const mutation = useMutation({
    mutationFn: (cents: number) => createPledge(projectId, cents),
    onSuccess: (res) => {
      setClientSecret(res.clientSecret);
      setAmountCents(amountCents);
    },
    onError: (err: Error) => {
      setPledgeError(err.message);
    },
  });

  function handleInitiatePledge(e: React.FormEvent) {
    e.preventDefault();
    setPledgeError('');

    if (!authStore.isLoggedIn()) {
      router.push('/login');
      return;
    }

    const dollars = parseFloat(amountDollars);
    if (!dollars || dollars < 1) {
      setPledgeError('Minimum pledge is $1.');
      return;
    }

    const cents = Math.round(dollars * 100);
    setAmountCents(cents);
    mutation.mutate(cents);
  }

  if (pledged) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
        <p className="text-green-700 font-semibold text-lg">Thanks for backing this project!</p>
        <p className="text-green-600 text-sm mt-1">Your pledge was successful.</p>
        <button
          onClick={() => {
            setPledged(false);
            setClientSecret(null);
            setAmountDollars('');
            void queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            void queryClient.invalidateQueries({ queryKey: ['pledges', projectId] });
          }}
          className="mt-4 text-sm text-green-700 underline hover:text-green-900"
        >
          Back again
        </button>
      </div>
    );
  }

  if (clientSecret) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Complete your pledge</h3>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm
            projectId={projectId}
            clientSecret={clientSecret}
            amountCents={amountCents}
            onSuccess={() => setPledged(true)}
            onCancel={() => {
              setClientSecret(null);
              setAmountDollars('');
            }}
          />
        </Elements>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-1">Back this project</h3>
      <p className="text-gray-500 text-sm mb-4">Choose an amount to pledge.</p>

      {/* Quick-pick amounts */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[10, 25, 50, 100, 250].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setAmountDollars(String(d))}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition ${
              amountDollars === String(d)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-200 text-gray-700 hover:border-blue-300'
            }`}
          >
            ${d}
          </button>
        ))}
      </div>

      <form onSubmit={handleInitiatePledge} className="space-y-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input
            type="number"
            value={amountDollars}
            onChange={(e) => setAmountDollars(e.target.value)}
            placeholder="Custom amount"
            min="1"
            step="0.01"
            className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {pledgeError && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {pledgeError}
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50"
        >
          {mutation.isPending ? 'Preparing…' : 'Pledge now'}
        </button>
      </form>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
  });

  const { data: pledgesData } = useQuery({
    queryKey: ['pledges', projectId],
    queryFn: () => listPledges(projectId),
    enabled: !!project,
  });

  if (projectLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-2/3" />
          <div className="h-4 bg-gray-100 rounded w-1/3" />
          <div className="h-32 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Project not found.</p>
      </div>
    );
  }

  const pct = progressPercent(project.raisedAmount, project.goalAmount);
  const days = daysLeft(project.deadline);
  const backerCount = pledgesData?.backerCount ?? 0;
  const isActive = project.status === 'active';

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: project info */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <span className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full capitalize mb-3">
              {project.category}
            </span>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">{project.title}</h1>
          </div>

          {/* Stats bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  ${(project.raisedAmount / 100).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  of ${(project.goalAmount / 100).toLocaleString()} goal
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{backerCount}</p>
                <p className="text-xs text-gray-400 mt-0.5">backers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{days}</p>
                <p className="text-xs text-gray-400 mt-0.5">days to go</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">About this project</h2>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
              {project.description}
            </p>
          </div>

          {/* Meta */}
          <div className="text-sm text-gray-500 flex flex-wrap gap-x-6 gap-y-1">
            <span>
              Status:{' '}
              <span className="font-semibold text-gray-700 capitalize">{project.status}</span>
            </span>
            <span>
              Deadline:{' '}
              <span className="font-semibold text-gray-700">
                {new Date(project.deadline).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </span>
            <span>
              Funded:{' '}
              <span className="font-semibold text-gray-700">{pct}%</span>
            </span>
          </div>
        </div>

        {/* Right: pledge panel */}
        <div className="lg:col-span-1">
          {isActive ? (
            <PledgePanel projectId={projectId} />
          ) : (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 text-center">
              <p className="text-gray-500 font-medium capitalize">{project.status}</p>
              <p className="text-gray-400 text-sm mt-1">
                This campaign is no longer accepting pledges.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
