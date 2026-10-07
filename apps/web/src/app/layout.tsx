import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: {
    default: 'Productivity Suite - Your Personal Productivity Hub',
    template: '%s | Productivity Suite',
  },
  description: 'Track expenses, manage tasks, pomodoro timer, routines, and schedule - all in one beautiful app.',
  keywords: ['productivity', 'expense tracker', 'task manager', 'pomodoro', 'routine', 'schedule'],
  authors: [{ name: 'Productivity Suite' }],
  creator: 'Productivity Suite',
  publisher: 'Productivity Suite',
  formatDetection: {
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Productivity Suite',
    title: 'Productivity Suite - Your Personal Productivity Hub',
    description: 'Track expenses, manage tasks, pomodoro timer, routines, and schedule - all in one beautiful app.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Productivity Suite Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Productivity Suite',
    description: 'Track expenses, manage tasks, pomodoro timer, routines, and schedule - all in one beautiful app.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  fallback: ['system-ui', 'sans-serif'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
  fallback: ['monospace'],
});

import type { ReactNode } from 'react';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}