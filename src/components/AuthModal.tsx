import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { PhoneDialCode } from '../types/store';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    authModalTab,
    setAuthModalTab,
    authModalContext,
    closeAuthModal,
    addToast,
  } = useStore();
  const {
    signUpWithEmail,
    loginWithEmail,
    loginWithDemoAccount,
    signInWithApple,
    signInWithGoogle,
    signingIn,
    authError,
    clearAuthError,
    rememberedEmail,
  } = useAuth();

  // Sign Up Form State
  const [fullName, setFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [phoneCode, setPhoneCode] = useState<PhoneDialCode>('+1');
  const [phone, setPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignUpPwd, setShowSignUpPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState(rememberedEmail || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(Boolean(rememberedEmail));
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (authModalOpen) {
      setFormError(null);
      clearAuthError();
      if (rememberedEmail && !loginEmail) {
        setLoginEmail(rememberedEmail);
        setRememberMe(true);
      }
    }
  }, [authModalOpen, authModalTab]);

  const handleTabSwitch = (nextTab: 'signup' | 'login') => {
    setFormError(null);
    clearAuthError();
    setAuthModalTab(nextTab);
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearAuthError();

    if (fullName.trim().length < 2) {
      setFormError('Please enter your full name (at least 2 characters).');
      return;
    }
    const emailTrimmed = signUpEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (phone.trim().length < 6) {
      setFormError('Please enter a valid phone number.');
      return;
    }
    if (signUpPassword.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }
    if (signUpPassword !== confirmPassword) {
      setFormError('Passwords do not match. Please re-enter your confirmation password.');
      return;
    }

    const ok = await signUpWithEmail({
      fullName: fullName.trim(),
      email: emailTrimmed,
      phoneCode,
      phone: phone.trim(),
      password: signUpPassword,
    });

    if (ok) {
      addToast(
        `Welcome, ${fullName.trim().split(' ')[0]}!`,
        authModalContext === 'checkout'
          ? 'Account created. Continuing straight to checkout.'
          : 'Your TechHaven account is now active.',
        'success'
      );
      if (authModalContext !== 'checkout') {
        closeAuthModal();
      }
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearAuthError();

    const emailTrimmed = loginEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (loginPassword.length < 4) {
      setFormError('Please enter your account password.');
      return;
    }

    const ok = await loginWithEmail({
      email: emailTrimmed,
      password: loginPassword,
      rememberMe,
    });

    if (ok) {
      addToast(
        'Signed in successfully',
        authModalContext === 'checkout'
          ? 'Continuing to checkout with your saved bag.'
          : 'Welcome back to TechHaven.',
        'success'
      );
      if (authModalContext !== 'checkout') {
        closeAuthModal();
      }
    }
  };

  const handleDemoLogin = async () => {
    setFormError(null);
    clearAuthError();
    const ok = await loginWithDemoAccount();
    if (ok) {
      addToast(
        'Signed in with Demo Account',
        authModalContext === 'checkout'
          ? 'Logged in as Alexander Reed. Redirecting to checkout...'
          : 'Logged in as Alexander Reed (alex@techhaven.store).',
        'success'
      );
      if (authModalContext !== 'checkout') {
        closeAuthModal();
      }
    }
  };

  const handleGoogleLogin = async () => {
    setFormError(null);
    clearAuthError();
    const ok = await signInWithGoogle();
    if (ok) {
      addToast(
        'Signed in with Google',
        authModalContext === 'checkout'
          ? 'Your cart items are synced. Redirecting to checkout...'
          : 'Your orders, wishlist & addresses are synced.',
        'success'
      );
      if (authModalContext !== 'checkout') {
        closeAuthModal();
      }
    }
  };

  const handleAppleLogin = async () => {
    setFormError(null);
    clearAuthError();
    const ok = await signInWithApple();
    if (ok) {
      addToast(
        'Signed in with Apple',
        authModalContext === 'checkout'
          ? 'Continuing to checkout with your saved bag.'
          : 'Welcome to TechHaven, Jordan.',
        'success'
      );
      if (authModalContext !== 'checkout') {
        closeAuthModal();
      }
    }
  };

  const displayedError = formError || authError;

  return (
    <AnimatePresence>
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 no-print">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuthModal}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={authModalTab === 'signup' ? 'Create TechHaven Account' : 'Sign In to TechHaven'}
            className="relative w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl p-5 sm:p-7"
          >
            <button
              type="button"
              onClick={closeAuthModal}
              aria-label="Close authentication modal"
              className="absolute top-3.5 right-3.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Checkout Gate Notice Banner */}
            {authModalContext === 'checkout' ? (
              <div className="mb-5 pr-8 p-3.5 rounded-xl bg-[#F97316]/10 border border-[#F97316]/30 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F97316] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#F97316] mb-0.5">
                    Account Required for Checkout
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                    Please create an account or sign in to complete your checkout. Your cart items are safely saved!
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-5 pr-8">
                <div className="w-10 h-10 rounded-xl bg-[#F97316]/15 text-[#F97316] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white leading-tight">
                    TECHHAVEN Account
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Manage orders, fast global checkout &amp; saved addresses.
                  </p>
                </div>
              </div>
            )}

            {/* Sign Up / Login Tab Switcher */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 mb-5">
              <button
                type="button"
                onClick={() => handleTabSwitch('signup')}
                className={`min-h-[42px] rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  authModalTab === 'signup'
                    ? 'bg-white dark:bg-[#111827] text-[#F97316] shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => handleTabSwitch('login')}
                className={`min-h-[42px] rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  authModalTab === 'login'
                    ? 'bg-white dark:bg-[#111827] text-[#F97316] shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Login
              </button>
            </div>

            {displayedError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{displayedError}</span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {authModalTab === 'signup' ? (
                <motion.form
                  key="signup-form"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.16 }}
                  onSubmit={handleSignUpSubmit}
                  className="space-y-3.5"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Sarah Jenkins"
                        className="w-full min-h-[44px] pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#F97316]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        placeholder="sarah@example.com"
                        className="w-full min-h-[44px] pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#F97316]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={phoneCode}
                        onChange={(e) => setPhoneCode(e.target.value as PhoneDialCode)}
                        aria-label="Country dial code"
                        className="w-24 sm:w-28 min-h-[44px] px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-mono-num text-slate-900 dark:text-white focus:outline-none focus:border-[#F97316] shrink-0"
                      >
                        <option value="+1">+1 (US/CA)</option>
                        <option value="+971">+971 (UAE)</option>
                        <option value="+44">+44 (UK)</option>
                      </select>
                      <div className="relative flex-1 min-w-0">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder={
                            phoneCode === '+971'
                              ? '50 555 0148'
                              : phoneCode === '+44'
                                ? '7700 900123'
                                : '(212) 555-0194'
                          }
                          className="w-full min-h-[44px] pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#F97316]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showSignUpPwd ? 'text' : 'password'}
                          required
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          className="w-full min-h-[44px] pl-9 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#F97316]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignUpPwd((v) => !v)}
                          aria-label={showSignUpPwd ? 'Hide password' : 'Show password'}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                        >
                          {showSignUpPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showConfirmPwd ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat password"
                          className="w-full min-h-[44px] pl-9 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#F97316]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPwd((v) => !v)}
                          aria-label={showConfirmPwd ? 'Hide confirm password' : 'Show confirm password'}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                        >
                          {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={signingIn}
                    className="w-full min-h-[46px] py-3 px-4 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {signingIn ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>
                          {authModalContext === 'checkout'
                            ? 'Create Account & Continue to Checkout'
                            : 'Create TechHaven Account'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="login-form"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.16 }}
                  onSubmit={handleLoginSubmit}
                  className="space-y-3.5"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="alex@techhaven.store"
                        className="w-full min-h-[44px] pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#F97316]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showLoginPwd ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full min-h-[44px] pl-9 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#F97316]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPwd((v) => !v)}
                        aria-label={showLoginPwd ? 'Hide password' : 'Show password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      >
                        {showLoginPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#F97316] cursor-pointer"
                      />
                      <span>Remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleTabSwitch('signup')}
                      className="text-xs font-semibold text-[#F97316] hover:underline cursor-pointer"
                    >
                      Need an account? Sign Up
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={signingIn}
                    className="w-full min-h-[46px] py-3 px-4 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {signingIn ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>
                          {authModalContext === 'checkout'
                            ? 'Sign In & Continue to Checkout'
                            : 'Sign In to TechHaven'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Quick One-Click Demo Account Helper */}
                  <button
                    type="button"
                    disabled={signingIn}
                    onClick={handleDemoLogin}
                    className="w-full min-h-[42px] py-2.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Demo Account Login (Alexander Reed)</span>
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Social / Quick Express Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-white/10" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className="px-3 bg-white dark:bg-[#111827] text-slate-400">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={signingIn}
                onClick={handleGoogleLogin}
                className="min-h-[44px] py-2.5 px-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-60 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3.02h3.88c2.27-2.09 3.54-5.17 3.54-8.84z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.88-3.02c-.98.66-2.23 1.06-3.4 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                disabled={signingIn}
                onClick={handleAppleLogin}
                className="min-h-[44px] py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 hover:border-[#F97316] text-slate-900 dark:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
              >
                <span className="text-base leading-none" aria-hidden="true"></span>
                <span>Continue with Apple</span>
              </button>
            </div>

            {authModalContext !== 'checkout' && (
              <button
                type="button"
                onClick={closeAuthModal}
                className="w-full min-h-[42px] mt-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-500 dark:text-slate-400 hover:border-[#F97316] hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                Continue browsing as Guest
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
