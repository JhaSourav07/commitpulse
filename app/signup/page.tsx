'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Check,
  X,
} from 'lucide-react';
import { signIn } from 'next-auth/react';

function GithubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

interface FormFields {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreeTerms?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpPage() {
  const [fields, setFields] = useState<FormFields>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Password strength checks
  const passwordChecks = useMemo(() => {
    const p = fields.password;
    return {
      minLength: p.length >= 8,
      hasUpper: /[A-Z]/.test(p),
      hasLower: /[a-z]/.test(p),
      hasNumberOrSpecial: /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p),
    };
  }, [fields.password]);

  const passwordScore = useMemo(() => {
    return Object.values(passwordChecks).filter(Boolean).length;
  }, [passwordChecks]);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!fields.fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    }

    if (!fields.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!EMAIL_RE.test(fields.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!fields.password) {
      newErrors.password = 'Password is required';
    } else if (passwordScore < 3) {
      newErrors.password = 'Please fulfill the password strength criteria below';
    }

    if (!fields.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (fields.password !== fields.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!fields.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the Terms of Service & Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fields, passwordScore]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFields((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fields.fullName,
          email: fields.email,
          password: fields.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account. Please try again.');
      }

      setSubmitSuccess(true);
    } catch (err: unknown) {
      const error = err as Error;
      setSubmitError(error.message || 'An unexpected error occurred during account creation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGitHubSignUp = async () => {
    try {
      await signIn('github', { callbackUrl: '/' });
    } catch (err: unknown) {
      console.error('GitHub sign up error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-teal-500 selection:text-slate-950">
      {/* Background lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-teal-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-violet-600/10 blur-[110px] rounded-full pointer-events-none" />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-lg"
        >
          {/* Top navigation link */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors group"
            >
              <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Form Card */}
          <div className="bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl shadow-slate-950/50">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-teal-100 to-teal-400 bg-clip-text text-transparent">
                Create Your Account
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Join CommitPulse to analyze GitHub productivity, generate custom SVGs, and track
                your streaks
              </p>
            </div>

            {/* GitHub OAuth Button */}
            <button
              type="button"
              onClick={handleGitHubSignUp}
              aria-label="Sign up with GitHub"
              className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700/90 text-slate-100 font-semibold py-3 px-4 rounded-xl border border-slate-700/60 shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <GithubIcon />
              <span>Sign up with GitHub</span>
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900/90 px-3 text-slate-500 font-medium tracking-wider">
                  or register with email
                </span>
              </div>
            </div>

            {/* Alert Banners */}
            <AnimatePresence mode="wait">
              {submitError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-start gap-2.5"
                  role="alert"
                >
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </motion.div>
              )}

              {submitSuccess && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3.5 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400 text-sm flex items-start gap-2.5"
                  role="status"
                >
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Account created successfully!</p>
                    <p className="text-xs text-teal-300/80 mt-0.5">
                      You can now{' '}
                      <Link href="/login" className="underline font-bold">
                        log in
                      </Link>{' '}
                      to your account.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Full Name Input */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User size={18} />
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    value={fields.fullName}
                    onChange={handleChange}
                    placeholder="Alex Johnson"
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                      errors.fullName
                        ? 'border-rose-500/80 focus:ring-rose-500/50'
                        : 'border-slate-800 focus:border-teal-500/60 focus:ring-teal-500/40'
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p id="fullName-error" className="mt-1 text-xs text-rose-400 font-medium">
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail size={18} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={fields.email}
                    onChange={handleChange}
                    placeholder="alex@example.com"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                      errors.email
                        ? 'border-rose-500/80 focus:ring-rose-500/50'
                        : 'border-slate-800 focus:border-teal-500/60 focus:ring-teal-500/40'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="mt-1 text-xs text-rose-400 font-medium">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={18} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={fields.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    className={`w-full pl-10 pr-11 py-2.5 bg-slate-950/80 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                      errors.password
                        ? 'border-rose-500/80 focus:ring-rose-500/50'
                        : 'border-slate-800 focus:border-teal-500/60 focus:ring-teal-500/40'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="mt-1 text-xs text-rose-400 font-medium">
                    {errors.password}
                  </p>
                )}

                {/* Real-time Password Strength Meter */}
                {fields.password.length > 0 && (
                  <div className="mt-2.5 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Password Strength:</span>
                      <span
                        className={`font-semibold ${
                          passwordScore === 4
                            ? 'text-teal-400'
                            : passwordScore >= 2
                              ? 'text-amber-400'
                              : 'text-rose-400'
                        }`}
                      >
                        {passwordScore === 4 ? 'Strong' : passwordScore >= 2 ? 'Moderate' : 'Weak'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex gap-1">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          passwordScore >= 1
                            ? passwordScore >= 3
                              ? 'bg-teal-400 w-1/4'
                              : 'bg-amber-400 w-1/4'
                            : 'bg-transparent w-0'
                        }`}
                      />
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          passwordScore >= 2
                            ? passwordScore >= 3
                              ? 'bg-teal-400 w-1/4'
                              : 'bg-amber-400 w-1/4'
                            : 'bg-transparent w-0'
                        }`}
                      />
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          passwordScore >= 3 ? 'bg-teal-400 w-1/4' : 'bg-transparent w-0'
                        }`}
                      />
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          passwordScore === 4 ? 'bg-teal-400 w-1/4' : 'bg-transparent w-0'
                        }`}
                      />
                    </div>

                    {/* Criteria items */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                      <div
                        className={`flex items-center gap-1 ${
                          passwordChecks.minLength ? 'text-teal-400' : 'text-slate-500'
                        }`}
                      >
                        {passwordChecks.minLength ? <Check size={12} /> : <X size={12} />}
                        <span>At least 8 characters</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          passwordChecks.hasUpper ? 'text-teal-400' : 'text-slate-500'
                        }`}
                      >
                        {passwordChecks.hasUpper ? <Check size={12} /> : <X size={12} />}
                        <span>Uppercase letter</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          passwordChecks.hasLower ? 'text-teal-400' : 'text-slate-500'
                        }`}
                      >
                        {passwordChecks.hasLower ? <Check size={12} /> : <X size={12} />}
                        <span>Lowercase letter</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          passwordChecks.hasNumberOrSpecial ? 'text-teal-400' : 'text-slate-500'
                        }`}
                      >
                        {passwordChecks.hasNumberOrSpecial ? <Check size={12} /> : <X size={12} />}
                        <span>Number / Special symbol</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={18} />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={fields.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                    className={`w-full pl-10 pr-11 py-2.5 bg-slate-950/80 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                      errors.confirmPassword
                        ? 'border-rose-500/80 focus:ring-rose-500/50'
                        : fields.confirmPassword && fields.password === fields.confirmPassword
                          ? 'border-teal-500/60 focus:ring-teal-500/40'
                          : 'border-slate-800 focus:border-teal-500/60 focus:ring-teal-500/40'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={
                      showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                    }
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p id="confirmPassword-error" className="mt-1 text-xs text-rose-400 font-medium">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Agree Terms Checkbox */}
              <div className="pt-1">
                <div className="flex items-start">
                  <input
                    id="agreeTerms"
                    name="agreeTerms"
                    type="checkbox"
                    checked={fields.agreeTerms}
                    onChange={handleChange}
                    className="mt-0.5 h-4 w-4 rounded border-slate-800 bg-slate-950 text-teal-500 focus:ring-teal-500/40"
                  />
                  <label
                    htmlFor="agreeTerms"
                    className="ml-2 block text-xs text-slate-400 select-none"
                  >
                    I agree to the{' '}
                    <Link href="/terms" className="text-teal-400 hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-teal-400 hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                {errors.agreeTerms && (
                  <p className="mt-1 text-xs text-rose-400 font-medium">{errors.agreeTerms}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || submitSuccess}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg shadow-teal-500/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus size={18} />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer link */}
            <p className="mt-6 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-teal-400 hover:text-teal-300 transition-colors"
              >
                Log In
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
