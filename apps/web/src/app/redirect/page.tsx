'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function RedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary-600 dark:text-primary-400 animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Redirecting...</h1>
      </div>
    </div>
  );
}