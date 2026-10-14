'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@productivity-suite/ui';
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles, ArrowRight, CheckCircle, Shield, Zap, Target, Layers } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { useToast } from '@productivity-suite/ui';
import { SpaceBackground } from '@/components/SpaceBackground';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const features = [
  {
    icon: CheckCircle,
    title: 'Tasks & Projects',
    description: 'Organize work with kanban, lists, and timelines',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Target,
    title: 'Goals & Habits',
    description: 'Track progress with streaks and milestones',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Zap,
    title: 'Focus & Pomodoro',
    description: 'Deep work sessions with smart breaks',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: Layers,
    title: 'Finances & Routines',
    description: 'Budgets, expenses, and recurring habits',
    color: 'from-cyan-500 to-blue-500',
  },
];

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const supabase = getSupabaseBrowserClient();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast({
          type: 'error',
          title: 'Error',
          message: error.message,
        });
        return;
      }

      toast({
        type: 'success',
        title: 'Success',
        message: 'Welcome back!',
      });
      router.push(redirect);
      router.refresh();
    } catch {
      toast({
        type: 'error',
        title: 'Error',
        message: 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      toast({
        type: 'error',
        title: 'Error',
        message: error.message,
      });
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4 py-12">
        <div className="w-full max-w-[1200px] mx-auto">
          <SpaceBackground reducedMotion />
          <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
            <div className="animate-pulse glass-card w-full max-w-md p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <p className="text-neutral-400">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 relative overflow-hidden">
      {/* Cinematic Space Background */}
      <SpaceBackground />
      
      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-[1200px] mx-auto">
          {/* Desktop: Two-column layout | Mobile: Stacked */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[calc(100vh-3rem)]">
            {/* LEFT SIDE: Brand Introduction */}
            <div className="hidden lg:block lg:pr-8 animate-fade-in animate-slide-in-right stagger-1">
              <div className="max-w-xl">
                {/* Brand Mark */}
                <Link href="/" className="inline-flex items-center gap-3 mb-10" aria-label="Productivity Suite Home">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 flex items-center justify-center shadow-[0_8px_32px_rgba(117,103,255,0.4)]">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <span className="font-display text-3xl font-bold text-white">
                    Productivity Suite
                  </span>
                </Link>

                {/* Tagline */}
                <p className="text-lg text-primary-300/80 font-medium mb-6 tracking-wide uppercase">
                  Your Personal Life OS
                </p>

                {/* Main Heading */}
                <h1 className="font-display text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6">
                  Your universe.
                  <br />
                  <span className="bg-gradient-to-r from-primary-300 via-secondary-300 to-tertiary-300 bg-clip-text text-transparent">
                    Your productivity.
                  </span>
                </h1>

                {/* Supporting Description */}
                <p className="text-xl text-neutral-300/70 leading-relaxed mb-10 max-w-lg">
                  Bring tasks, finances, routines, goals, and focus together in one 
                  beautifully designed command center. Built for how you actually work.
                </p>

                {/* Feature Highlights */}
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <div 
                      key={feature.title} 
                      className="flex items-start gap-4 glass-card p-4 rounded-xl border-primary-500/10 hover:border-primary-500/30 transition-all duration-300 animate-fade-in animate-slide-up stagger-container"
                      style={{ animationDelay: `${(index + 1) * 100}ms` }}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${feature.color}`}>
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="pt-1">
                        <h3 className="font-semibold text-white text-base">{feature.title}</h3>
                        <p className="text-sm text-neutral-400 mt-0.5">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Trust Indicators */}
                <div className="mt-12 flex flex-wrap gap-6 text-sm text-neutral-500">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary-500/80" />
                    <span>End-to-end encryption</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success-500/80" />
                    <span>Local-first data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500/80" />
                    <span>Offline ready</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: Login Panel */}
            <div className="relative z-20 w-full max-w-md mx-auto lg:mx-0 animate-fade-in animate-slide-up stagger-2">
              <div className="glass-strong rounded-3xl p-6 lg:p-8 xl:p-10 shadow-[0_24px_64px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(120,113,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.2)] border-[rgba(120,113,255,0.25)] backdrop-blur-2xl relative overflow-hidden">
                {/* Subtle top glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent pointer-events-none" />
                
                {/* Brand Header */}
                <div className="text-center mb-8">
                  <Link href="/" className="inline-flex items-center gap-2 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-[0_8px_32px_rgba(117,103,255,0.4)]">
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <span className="font-display text-2xl font-bold text-white">
                      Productivity Suite
                    </span>
                  </Link>
                  <h1 className="text-2xl font-bold text-white mb-2">Sign In</h1>
                  <p className="text-neutral-400">
                    Enter your credentials to access your universe
                  </p>
                </div>

                {/* Login Form */}
                <Card variant="default" glass={false} className="space-y-0 bg-transparent shadow-none border-0 p-0">
                  <CardContent className="pb-2 px-0">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                      {/* Email Field */}
                      <div>
                        <Input
                          label="Email"
                          type="email"
                          placeholder="you@example.com"
                          icon={<Mail className="h-5 w-5" />}
                          error={errors.email?.message}
                          {...register('email')}
                          autoComplete="email"
                          disabled={isLoading}
                          className="h-12 text-base"
                        />
                      </div>

                      {/* Password Field */}
                      <div>
                        <div className="relative">
                          <Input
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            icon={<Lock className="h-5 w-5" />}
                            error={errors.password?.message}
                            {...register('password')}
                            autoComplete="current-password"
                            disabled={isLoading}
                            className="h-12 text-base pr-14"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-[38px] text-neutral-500 hover:text-neutral-200 transition-colors duration-200 p-1"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            disabled={isLoading}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      {/* Remember Me & Forgot Password */}
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-neutral-600/50 bg-neutral-900/50 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-neutral-950 accent-primary-500" 
                          />
                          <span className="text-sm text-neutral-300">Remember me</span>
                        </label>
                        <Link href="/forgot-password" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
                          Forgot password?
                        </Link>
                      </div>

                      {/* Sign In Button */}
                      <Button 
                        type="submit" 
                        className="w-full h-12 text-base font-semibold"
                        size="lg" 
                        loading={isLoading}
                        variant="primary"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          <>
                            Sign In
                            <ArrowRight className="h-5 w-5 ml-1" />
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-800/50" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-neutral-950/50 text-neutral-500 backdrop-blur-sm">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Social Login Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="glass"
                    onClick={() => handleOAuthLogin('google')}
                    disabled={isLoading}
                    className="h-11 gap-2 justify-center"
                    size="md"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </Button>
                  <Button
                    variant="glass"
                    onClick={() => handleOAuthLogin('github')}
                    disabled={isLoading}
                    className="h-11 gap-2 justify-center"
                    size="md"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </Button>
                </div>
              </div>

              {/* Sign Up Link */}
              <CardFooter className="pt-6 px-0">
                <p className="text-center text-sm text-neutral-400">
                  Don't have an account?{' '}
                  <Link href="/signup" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
                    Create one free
                    <ArrowRight className="w-4 h-4 ml-1 inline-block" />
                  </Link>
                </p>
              </CardFooter>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}