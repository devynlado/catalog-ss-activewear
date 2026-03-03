'use client';

import { useEffect, useState } from 'react';
import { NextStudio } from 'next-sanity/studio';
import config from '../../../sanity.config';

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const STORAGE_KEY = PROJECT_ID ? `__sanity_auth_token_${PROJECT_ID}` : null;

export function StudioPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!STORAGE_KEY) {
      setReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/sanity-studio-token', { credentials: 'include' });
        if (cancelled) return;
        if (res.ok) {
          const { token } = await res.json();
          if (token) {
            try {
              localStorage.setItem(STORAGE_KEY, token);
            } catch {
              // localStorage may be unavailable
            }
          }
        }
      } catch {
        // Network error: Studio will show login
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a1a1a',
          color: '#fff',
        }}
      >
        Loading Studio…
      </div>
    );
  }

  return <NextStudio config={config} />;
}
