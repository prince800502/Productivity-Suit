'use client';

import { useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@productivity-suite/ui';

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.exchangeCodeForSession(searchParams.toString());

      if (error) {
        console.error('Auth callback error:', error);
        router.push('/login?error=auth_callback_failed');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <Card variant="default" glass={true} className="w-full max-w-sm">
        <CardContent className="py-12 px-8 text-center">
          <Loader2 className="w-12 h-12 text-primary-500 dark:text-primary-400 animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Completing sign in...</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2">Please wait while we verify your account</p>
        </CardContent>
      </Card>
    </div>
  );
}