'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    console.info('Signing up with:', { name, email, password });
  };

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center p-4 sm:p-24 relative z-10">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a]/80 p-8 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors mb-6"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Home
        </Link>

        <h1 className="mb-8 text-center text-3xl font-bold text-white">Create an Account</h1>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium text-white/80">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-white/40">
                <User size={18} />
              </div>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-10 pr-4 text-white placeholder-white/40 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-white/80">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-white/40">
                <Mail size={18} />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-10 pr-4 text-white placeholder-white/40 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-white/80">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-white/40">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-10 pr-10 text-white placeholder-white/40 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                placeholder="Create a password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/40 hover:text-white/80 transition focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1 pb-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-white/80">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-white/40">
                <Lock size={18} />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-10 pr-10 text-white placeholder-white/40 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                placeholder="Confirm your password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/40 hover:text-white/80 transition focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[#5C45FD] py-3 text-sm font-semibold text-white shadow-lg shadow-[#5C45FD]/30 transition hover:bg-[#4a35da] hover:shadow-[#5C45FD]/50 mt-2"
          >
            Create Account
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="mx-4 text-xs text-white/40">OR</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-transparent bg-white px-4 py-3 text-sm font-medium text-gray-900 transition hover:bg-gray-100"
          >
            <GoogleIcon />
            Sign up with Google
          </button>

          <p className="text-center text-sm text-white/60 pt-2">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-blue-400 hover:text-blue-300 transition"
            >
              Log in instead
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
