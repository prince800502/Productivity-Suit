import dynamic from 'next/dynamic';

const AuthCallbackClient = dynamic(() => import('./auth-callback-client'), { ssr: false });

export default function AuthCallbackPage() {
  return <AuthCallbackClient />;
}