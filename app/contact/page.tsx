'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';
import { FaGithub, FaDiscord, FaLinkedin } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { Footer } from '../components/Footer';

// SEO: page-level metadata is declared in the root layout.tsx since this is
// a 'use client' component. Add a /contact entry to layout metadata if needed.

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormFields {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

type SubmitStatus = 'idle' | 'submitting' | 'success';

// ── Constants ─────────────────────────────────────────────────────────────────

const INITIAL_FIELDS: FormFields = {
  fullName: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SOCIAL_LINKS: Array<{
  label: string;
  href: string;
  ariaLabel: string;
  renderIcon: () => React.ReactElement;
  colorClass: string;
}> = [
  {
    label: 'GitHub',
    href: 'https://github.com/JhaSourav07/commitpulse',
    ariaLabel: 'CommitPulse on GitHub',
    renderIcon: () => <FaGithub size={18} />,
    colorClass: 'hover:text-white hover:bg-zinc-800 dark:hover:bg-zinc-700',
  },
  {
    label: 'Discord',
    href: 'https://discord.gg/f84SDraEBH',
    ariaLabel: 'Join CommitPulse on Discord',
    renderIcon: () => <FaDiscord size={18} />,
    colorClass: 'hover:text-white hover:bg-indigo-600',
  },
  {
    label: 'X (Twitter)',
    href: 'https://x.com/JhaSourav07',
    ariaLabel: 'Creator on X (Twitter)',
    renderIcon: () => <FaXTwitter size={18} />,
    colorClass: 'hover:text-white hover:bg-black dark:hover:bg-zinc-700',
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/souravjhahind',
    ariaLabel: 'Creator on LinkedIn',
    renderIcon: () => <FaLinkedin size={18} />,
    colorClass: 'hover:text-white hover:bg-blue-700',
  },
];

// ── Validation ────────────────────────────────────────────────────────────────

function validate(fields: FormFields): FormErrors {
  const errors: FormErrors = {};

  if (!fields.fullName.trim()) {
    errors.fullName = 'Full name is required.';
  } else if (fields.fullName.trim().length < 2) {
    errors.fullName = 'Name must be at least 2 characters.';
  } else if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(fields.fullName.trim())) {
    errors.fullName = 'Please enter a valid name.';
  }

  if (!fields.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!EMAIL_RE.test(fields.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (fields.phone.trim() && !/^\+?[0-9\s()-]{7,15}$/.test(fields.phone.trim())) {
    errors.phone = 'Please enter a valid phone number.';
  }

  if (!fields.subject.trim()) {
    errors.subject = 'Subject is required.';
  }

  if (!fields.message.trim()) {
    errors.message = 'Message is required.';
  } else if (fields.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters.';
  }

  return errors;
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ id, label, error, required, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
        {required && (
          <span className="ml-1 text-emerald-600 dark:text-emerald-400" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {/* aria-live="polite" lets screen readers announce errors without interrupting */}
      <div aria-live="polite" aria-atomic="true">
        <AnimatePresence>
          {error && (
            <motion.p
              id={`${id}-error`}
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400"
            >
              <AlertCircle size={12} aria-hidden="true" />
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const inputBase =
  'w-full rounded-2xl border bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all duration-200 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-600';
const inputIdle =
  'border-zinc-200 dark:border-zinc-800 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:focus:border-teal-400 dark:focus:ring-teal-400/20';
const inputError =
  'border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20';

// ── Page component ────────────────────────────────────────────────────────────

export default function ContactPage() {
  const [fields, setFields] = useState<FormFields>(INITIAL_FIELDS);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [, setTouched] = useState<Partial<Record<keyof FormFields, boolean>>>({});

  // handleChange: reads the new value from the event synchronously, then
  // uses functional updaters so we never close over stale state.
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFields((prev) => {
        const next = { ...prev, [name]: value };
        // Live-clear error only if the field has been touched
        setTouched((t) => {
          if (t[name as keyof FormFields]) {
            const fresh = validate(next);
            setErrors((err) => ({ ...err, [name]: fresh[name as keyof FormErrors] }));
          }
          return t; // touched map itself doesn't change here
        });
        return next;
      });
    },
    []
  );

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFields((currentFields) => {
      const fresh = validate(currentFields);
      setErrors((prev) => ({ ...prev, [name]: fresh[name as keyof FormErrors] }));
      return currentFields; // no change to fields, just read them
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched({ fullName: true, email: true, subject: true, message: true });

    // Read current fields synchronously via a functional update to avoid stale closure
    let hasErrors = false;
    setFields((currentFields) => {
      const fresh = validate(currentFields);
      setErrors(fresh);
      hasErrors = Object.keys(fresh).length > 0;
      return currentFields;
    });

    // Yield one microtask so the setState calls above flush before we check
    await Promise.resolve();
    if (hasErrors) return;

    setStatus('submitting');

    // ── Placeholder: replace with fetch('/api/contact', ...) once the route exists ──
    await new Promise<void>((resolve) => setTimeout(resolve, 1200));

    setStatus('success');
    setFields(INITIAL_FIELDS);
    setTouched({});
    setErrors({});
  }, []);

  const handleReset = useCallback(() => {
    setStatus('idle');
    setFields(INITIAL_FIELDS);
    setTouched({});
    setErrors({});
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] overflow-hidden">
      <div className="mx-auto max-w-7xl pt-8 pb-20 px-6">
        <div className="text-center">
          <div className="inline-flex items-center text-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/25 font-medium rounded-full text-sm mb-6">
            <MessageCircle
              className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            <span className="text-emerald-600 dark:text-emerald-400 uppercase">Contact Us</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* ═══ LEFT COLUMN — Hero + Info ══════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="lg:sticky lg:self-start space-y-10 text-center lg:text-left"
          >
            {/* Hero text */}
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-black dark:text-white leading-tight">
                Let&apos;s start a
                <br />
                <span className="bg-linear-to-r from-teal-500 to-violet-500 bg-clip-text text-transparent">
                  conversation.
                </span>
              </h1>

              <p className="mt-6 mx-auto lg:mx-0 text-xl text-zinc-600 dark:text-zinc-400 max-w-md">
                Have a question, feature idea, or found a bug? Reach out — we respond to every
                message.
              </p>
            </div>

            {/* Contact info card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 space-y-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <Mail
                    className="text-emerald-600 dark:text-emerald-400"
                    size={20}
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Email</p>
                  <a
                    href="mailto:support@commitpulse.dev"
                    className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    support@commitpulse.dev
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                  <FaDiscord
                    className="text-violet-500 dark:text-violet-400"
                    size={20}
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Discord Community
                  </p>
                  <a
                    href="https://discord.gg/f84SDraEBH"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                  >
                    discord.gg/f84SDraEBH
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-2xl bg-zinc-500/10 flex items-center justify-center">
                  <FaGithub
                    className="text-zinc-500 dark:text-zinc-400"
                    size={20}
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Open Source
                  </p>
                  <a
                    href="https://github.com/JhaSourav07/commitpulse"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    github.com/JhaSourav07/commitpulse
                  </a>
                </div>
              </div>
            </div>

            {/* Social links */}
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-4 text-left">
                Find us online
              </p>
              <div className="flex flex-wrap gap-3">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.ariaLabel}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${social.colorClass}`}
                  >
                    <span aria-hidden="true">{social.renderIcon()}</span>
                    {social.label}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ═══ RIGHT COLUMN — Form ════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  /* ── Success state ─────────────────────────────── */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center text-center py-12 gap-6"
                  >
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2
                        className="text-emerald-600 dark:text-emerald-400"
                        size={40}
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
                        Message sent!
                      </h2>
                      <p className="text-zinc-500 dark:text-zinc-400 max-w-sm">
                        Thanks for reaching out. We&apos;ll get back to you as soon as possible.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-6 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  /* ── Form ──────────────────────────────────────── */
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    noValidate
                    aria-label="Contact form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-black dark:text-white mb-1">
                        Send us a message
                      </h2>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Fields marked with{' '}
                        <span className="text-emerald-600 dark:text-emerald-400">*</span> are
                        required.
                      </p>
                    </div>

                    {/* Full Name */}
                    <Field id="contact-fullName" label="Full Name" error={errors.fullName} required>
                      <div className="relative">
                        <User
                          size={16}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                          aria-hidden="true"
                        />
                        <input
                          id="contact-fullName"
                          name="fullName"
                          type="text"
                          autoComplete="name"
                          placeholder="Sourav Jha"
                          value={fields.fullName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          aria-required="true"
                          aria-invalid={!!errors.fullName}
                          aria-describedby={errors.fullName ? 'contact-fullName-error' : undefined}
                          className={`${inputBase} pl-11 ${errors.fullName ? inputError : inputIdle}`}
                        />
                      </div>
                    </Field>

                    {/* Email */}
                    <Field id="contact-email" label="Email Address" error={errors.email} required>
                      <div className="relative">
                        <Mail
                          size={16}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                          aria-hidden="true"
                        />
                        <input
                          id="contact-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={fields.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          aria-required="true"
                          aria-invalid={!!errors.email}
                          aria-describedby={errors.email ? 'contact-email-error' : undefined}
                          className={`${inputBase} pl-11 ${errors.email ? inputError : inputIdle}`}
                        />
                      </div>
                    </Field>

                    {/* Phone — optional */}
                    <Field id="contact-phone" label="Phone Number" error={errors.phone}>
                      <div className="relative">
                        <Phone
                          size={16}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                          aria-hidden="true"
                        />
                        <input
                          id="contact-phone"
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="+1 (555) 000-0000 (optional)"
                          value={fields.phone}
                          onChange={handleChange}
                          className={`${inputBase} pl-11 ${inputIdle}`}
                        />
                      </div>
                    </Field>

                    {/* Subject */}
                    <Field id="contact-subject" label="Subject" error={errors.subject} required>
                      <div className="relative">
                        <MessageSquare
                          size={16}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                          aria-hidden="true"
                        />
                        <input
                          id="contact-subject"
                          name="subject"
                          type="text"
                          placeholder="Bug report, feature request, general question..."
                          value={fields.subject}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          aria-required="true"
                          aria-invalid={!!errors.subject}
                          aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
                          className={`${inputBase} pl-11 ${errors.subject ? inputError : inputIdle}`}
                        />
                      </div>
                    </Field>

                    {/* Message */}
                    <Field id="contact-message" label="Message" error={errors.message} required>
                      <textarea
                        id="contact-message"
                        name="message"
                        rows={5}
                        placeholder="Tell us more about your question or idea..."
                        value={fields.message}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        aria-required="true"
                        aria-invalid={!!errors.message}
                        aria-describedby={errors.message ? 'contact-message-error' : undefined}
                        className={`${inputBase} resize-none ${errors.message ? inputError : inputIdle}`}
                      />
                    </Field>

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      disabled={status === 'submitting'}
                      whileTap={{ scale: 0.98 }}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-6 py-4 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-zinc-800 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                    >
                      {status === 'submitting' ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Send size={16} aria-hidden="true" />
                          Send Message
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-8">
        <Footer />
      </div>
    </div>
  );
}
