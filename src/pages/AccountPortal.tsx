import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  Heart,
  LogIn,
  LogOut,
  MessageSquare,
  Package,
  RotateCcw,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { AccountTab } from '../types/store';
import { UserAvatar } from '../components/UserAvatar';
import { ManageAccountSection } from '../components/account/ManageAccountSection';
import { OrdersSection } from '../components/account/OrdersSection';
import { WishlistStoresSection } from '../components/account/WishlistStoresSection';
import { ReviewsSection } from '../components/account/ReviewsSection';
import { ReturnsCancellationsSection } from '../components/account/ReturnsCancellationsSection';

const NAV_ITEMS: {
  id: AccountTab | 'logout';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'manage', label: 'Manage My Account', icon: User },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'wishlist', label: 'My Wishlist & Followed Stores', icon: Heart },
  { id: 'reviews', label: 'My Reviews', icon: MessageSquare },
  { id: 'returns', label: 'My Returns & Cancellations', icon: RotateCcw },
  { id: 'logout', label: 'Logout', icon: LogOut },
];

export const AccountPortal: React.FC = () => {
  const {
    accountTab,
    setAccountTab,
    accountExtras,
    orders,
    wishlistIds,
    navigate,
    openAuthModal,
    addToast,
  } = useStore();
  const { user, isAuthenticated, profile, signOut } = useAuth();

  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const activeAvatarUrl = isAuthenticated ? profile?.photoURL || '' : '';

  const handleNavClick = (id: AccountTab | 'logout') => {
    if (id === 'logout') {
      if (!isAuthenticated) {
        openAuthModal({ tab: 'login', context: 'general' });
        return;
      }
      setLogoutModalOpen(true);
      return;
    }
    setAccountTab(id);
  };

  const confirmLogout = async () => {
    setLogoutModalOpen(false);
    await signOut();
    addToast('Signed out', 'You can continue browsing as a guest.', 'info');
    navigate('home');
  };

  const getItemBadgeCount = (id: AccountTab | 'logout'): number | null => {
    if (id === 'orders') return orders.length;
    if (id === 'wishlist') return wishlistIds.length;
    if (id === 'returns') {
      return (
        accountExtras.returnRequests.length +
        orders.filter((o) => o.status === 'cancelled').length
      );
    }
    return null;
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 lg:pb-16 space-y-6">
      {/* Top Customer Summary Banner */}
      <div className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          <UserAvatar
            src={activeAvatarUrl}
            name={isAuthenticated ? profile?.displayName || user?.displayName : 'Guest'}
            sizeClass="w-12 h-12 sm:w-14 sm:h-14"
            textClass="text-base sm:text-lg"
            roundedClass="rounded-2xl"
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                {isAuthenticated
                  ? profile?.displayName || user?.displayName || 'TechHaven Customer'
                  : 'Customer Account Hub'}
              </h1>
              {isAuthenticated && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {isAuthenticated
                ? `${profile?.email || user?.email} · ${user ? 'Cloud Synced Account' : 'Active Customer Session'}`
                : 'Sign in or create an account to save addresses, cards, reviews, and checkout globally.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {!isAuthenticated && (
            <button
              type="button"
              onClick={() => openAuthModal({ tab: 'login', context: 'general' })}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Sign In / Sign Up
            </button>
          )}
        </div>
      </div>

      {/* Mobile & Tablet Horizontal Scrollable Navigation */}
      <nav
        aria-label="Account sections"
        className="lg:hidden flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/10 overflow-x-auto no-scrollbar"
      >
        {NAV_ITEMS.map((item) => {
          const isLogout = item.id === 'logout';
          if (isLogout && !isAuthenticated) return null;
          const active = accountTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isLogout
                  ? 'text-red-500 hover:bg-red-500/10'
                  : active
                    ? 'bg-white dark:bg-[#0B0F19] text-[#F97316] shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Desktop 2-Column Layout: Left 6-Item Sidebar + Right Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="hidden lg:block lg:col-span-3 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-3 sticky top-24">
          <nav aria-label="Customer account menu" className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isLogout = item.id === 'logout';
              const active = accountTab === item.id;
              const count = getItemBadgeCount(item.id);

              return (
                <React.Fragment key={item.id}>
                  {isLogout && (
                    <div className="my-2 border-t border-slate-100 dark:border-white/10" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2.5 transition-colors text-left cursor-pointer ${
                      isLogout
                        ? 'text-red-500 hover:bg-red-500/10'
                        : active
                          ? 'bg-[#F97316]/10 text-[#F97316]'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {count !== null && (
                      <span className="text-[11px] font-mono-num text-slate-400 shrink-0">
                        {count}
                      </span>
                    )}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        </aside>

        {/* Active Dashboard Panel */}
        <main className="lg:col-span-9 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={accountTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
            >
              {accountTab === 'manage' && <ManageAccountSection />}
              {accountTab === 'orders' && <OrdersSection />}
              {accountTab === 'wishlist' && <WishlistStoresSection />}
              {accountTab === 'reviews' && <ReviewsSection />}
              {accountTab === 'returns' && <ReturnsCancellationsSection />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* LOGOUT CONFIRMATION MODAL */}
      <AnimatePresence>
        {logoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLogoutModalOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  Sign out of TechHaven?
                </h3>
                <button
                  type="button"
                  onClick={() => setLogoutModalOpen(false)}
                  aria-label="Close logout confirmation"
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Your shopping bag and wishlist stay saved locally so you can continue browsing as a guest anytime.
              </p>
              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setLogoutModalOpen(false)}
                  className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold cursor-pointer"
                >
                  Stay Signed In
                </button>
                <button
                  type="button"
                  onClick={() => void confirmLogout()}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
