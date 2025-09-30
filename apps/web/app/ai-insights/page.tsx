"use client";
import { useEffect, useState } from 'react';

const PROVIDERS = [
  { value: 'tavily', label: 'Tavily' },
  { value: 'brave', label: 'Brave' },
  { value: 'bing', label: 'Bing' },
  { value: 'serper', label: 'Serper (Google)' },
];

export default function AiInsightsPage() {
  const [provider, setProvider] = useState<string>('tavily');

  useEffect(() => {
    const fromCookie = document.cookie.split('; ').find((c) => c.startsWith('search_provider='))?.split('=')[1];
    const fromEnv = process.env.NEXT_PUBLIC_SEARCH_DEFAULT || process.env.SEARCH_API_PROVIDER;
    setProvider(fromCookie || fromEnv || 'tavily');
  }, []);

  function onProviderChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    setProvider(v);
    document.cookie = `search_provider=${v}; path=/; max-age=${60 * 60 * 24 * 365}`;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">AI Insights</h1>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-700">Search provider</label>
        <select className="border rounded px-2 py-1" value={provider} onChange={onProviderChange}>
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>
      <p className="text-sm text-gray-600">Your choice is saved in a cookie and used by /api/analyze.</p>
    </div>
  );
}

