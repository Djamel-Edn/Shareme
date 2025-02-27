'use client'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  const handleGoogleSignIn = () => {
    signIn('google',{ callbackUrl: '/' });
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <button
        onClick={handleGoogleSignIn}
        className="p-6 px-20 border rounded-xl bg-white border-slate-700"
      >
        Sign In with Google
      </button>
    </div>
  );
}
