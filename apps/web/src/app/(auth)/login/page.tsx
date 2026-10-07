import dynamic from 'next/dynamic';

const LoginPageClient = dynamic(() => import('./login-client'), { ssr: false });

export default function LoginPage() {
  return <LoginPageClient />;
}