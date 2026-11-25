import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MessageCircle, Send, X } from 'lucide-react';
import { DEFAULT_FILTERS, useStore } from '../context/StoreContext';
import { BrandLogo } from './BrandLogo';

const POLICY_CONTENT: Record<string, { title: string; body: string[] }> = {
  privacy: {
    title: 'Privacy Policy',
    body: [
      'TECHHAVEN collects only the contact and international shipping information required to fulfill your hardware orders, verify global warranty coverage, and send courier tracking alerts.',
      'Your saved addresses, order history, and account preferences are strictly protected in private user-isolated storage and are never sold or shared with third-party advertisers.',
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    body: [
      'All prices support real-time conversion across USD ($), AED (د.إ), GBP (£), and CAD (C$). Official international manufacturer warranties apply to all factory-sealed hardware.',
      'Promo codes such as SAVE10 and FREESHIP apply per eligible checkout session and cannot be combined retroactively after courier dispatch.',
    ],
  },
  returns: {
    title: '7-Day Easy Global Returns & Warranty',
    body: [
      'Every TECHHAVEN purchase includes a 7-day replacement guarantee for manufacturing defects or transit damage across the USA, UAE, UK, and Canada.',
      'Initiate a return directly from your My Orders portal in one click—our global courier partner issues a prepaid return airway bill at zero pickup charge.',
    ],
  },
  shipping: {
    title: 'International Shipping & Courier Tiers',
    body: [
      'Standard International Shipping (5–8 Business Days) is $9.99 flat rate, and completely FREE on all orders over $100 (or equivalent currency).',
      'Express Courier Delivery (2–4 Business Days via DHL Express, FedEx International Priority, UPS, or Aramex) is available worldwide for $19.99.',
    ],
  },
};

const PAYMENT_BADGES = [
  {
    id: 'visa',
    label: 'VISA',
    svg: (
      <svg className="h-3.5 w-auto" viewBox="0 0 40 14" fill="none" aria-hidden="true">
        <text x="0" y="11" fill="#2563EB" fontSize="11" fontWeight="800" fontFamily="sans-serif" letterSpacing="0.5">
          VISA
        </text>
      </svg>
    ),
  },
  {
    id: 'mastercard',
    label: 'Mastercard',
    svg: (
      <svg className="h-3.5 w-auto" viewBox="0 0 24 14" fill="none" aria-hidden="true">
        <circle cx="8" cy="7" r="6" fill="#EB001B" />
        <circle cx="15" cy="7" r="6" fill="#F79E1B" fillOpacity="0.88" />
      </svg>
    ),
  },
  {
    id: 'amex',
    label: 'Amex',
    svg: (
      <svg className="h-3.5 w-auto" viewBox="0 0 38 14" fill="none" aria-hidden="true">
        <rect x="0" y="1" width="38" height="12" rx="2" fill="#006FCF" />
        <text x="5" y="10" fill="#FFFFFF" fontSize="7.5" fontWeight="800" fontFamily="sans-serif">
          AMEX
        </text>
      </svg>
    ),
  },
  {
    id: 'paypal',
    label: 'PayPal',
    svg: (
      <svg className="h-3.5 w-auto" viewBox="0 0 46 14" fill="none" aria-hidden="true">
        <text x="0" y="11" fill="#0070BA" fontSize="10" fontWeight="800" fontFamily="sans-serif">
          PayPal
        </text>
      </svg>
    ),
  },
  {
    id: 'gpay',
    label: 'Google Pay',
    svg: (
      <span className="text-[11px] font-bold tracking-tight text-slate-800 dark:text-slate-100">
        G Pay
      </span>
    ),
  },
  {
    id: 'applepay',
    label: 'Apple Pay',
    svg: (
      <span className="text-[11px] font-bold tracking-tight text-slate-900 dark:text-white">
         Pay
      </span>
    ),
  },
  {
    id: 'payoneer',
    label: 'Payoneer',
    svg: (
      <span className="text-[11px] font-bold text-[#F97316]">
        Payoneer
      </span>
    ),
  },
  {
    id: 'cod',
    label: 'Cash on Delivery',
    svg: (
      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
        COD
      </span>
    ),
  },
];

export const FooterAndSupport: React.FC = () => {
  const { navigate, setShopFilters, policyModal, setPolicyModal } = useStore();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    {
      from: 'agent',
      text: 'Hi there! Need help choosing hardware, checking DHL/FedEx shipping to USA, UAE, UK, or Canada, or applying SAVE10?',
    },
  ]);

  const sendSupportMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const txt = chatInput.trim();
    if (!txt) return;
    const lower = txt.toLowerCase();
    let reply =
      'Thanks for reaching out! Our 24/7 global support desk (+1 800-555-0199 · support@techhaven.store) is ready to help. You can also track shipments live under Track Order.';
    if (lower.includes('promo') || lower.includes('discount') || lower.includes('code')) {
      reply = 'Use SAVE10 at checkout for 10% off your order, or FREESHIP for complimentary international shipping!';
    } else if (lower.includes('delivery') || lower.includes('shipping') || lower.includes('courier')) {
      reply =
        'Standard International Shipping (5–8 days) is $9.99 and FREE over $100. Express Courier (2–4 days via DHL, FedEx & Aramex) is $19.99 across USA, UAE, UK & Canada.';
    } else if (lower.includes('warranty') || lower.includes('return')) {
      reply =
        'All products carry 1–2 years official international warranty plus a 7-day easy replacement guarantee.';
    } else if (lower.includes('cod') || lower.includes('cash') || lower.includes('pay')) {
      reply =
        'We accept Visa, Mastercard, Amex, PayPal, Apple Pay, Google Pay, Payoneer, and Cash on Delivery (COD) with zero extra fee!';
    }
    setMessages((prev) => [...prev, { from: 'user', text: txt }, { from: 'agent', text: reply }]);
    setChatInput('');
  };

  const activePolicy = policyModal ? POLICY_CONTENT[policyModal] : null;

  return (
    <>
      <footer className="bg-white dark:bg-[#080B12] border-t border-slate-200 dark:border-white/10 pt-12 sm:pt-14 pb-28 lg:pb-12 no-print">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pb-10 border-b border-slate-200 dark:border-white/10">
            <div>
              <button
                type="button"
                onClick={() => {
                  navigate('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                aria-label="TechHaven Home"
                className="inline-flex items-center mb-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] rounded-xl"
              >
                <BrandLogo variant="footer" />
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Your global destination for studio audio, flagship smartphones, creator laptops, and smart wearables across the USA, UAE, UK, and Canada.
              </p>
              <div className="text-xs text-slate-500">
                24/7 Global Support: +1 (800) 555-0199 · support@techhaven.store
              </div>
            </div>

            <div>
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white mb-3">
                Shop Collections
              </h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                {[
                  { label: 'All Hardware', action: () => { setShopFilters(DEFAULT_FILTERS); navigate('shop'); } },
                  { label: 'Headphones & ANC', action: () => navigate('shop', { categoryId: 'headphones' }) },
                  { label: 'Smartwatches', action: () => navigate('shop', { categoryId: 'smartwatches' }) },
                  { label: 'Creator Laptops', action: () => navigate('shop', { categoryId: 'laptops' }) },
                  { label: 'Flash Sale Deals', action: () => { setShopFilters({ ...DEFAULT_FILTERS, onSaleOnly: true }); navigate('shop'); } },
                ].map((link) => (
                  <li key={link.label}>
                    <button
                      type="button"
                      onClick={link.action}
                      className="hover:text-[#F97316] transition-colors cursor-pointer"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white mb-3">
                Customer Care
              </h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('account', { accountTab: 'orders' })}
                    className="hover:text-[#F97316] cursor-pointer"
                  >
                    Live Order Tracker
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('account', { accountTab: 'manage' })}
                    className="hover:text-[#F97316] cursor-pointer"
                  >
                    Saved Addresses
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setPolicyModal('shipping')}
                    className="hover:text-[#F97316] cursor-pointer"
                  >
                    International Shipping &amp; Couriers
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setPolicyModal('returns')}
                    className="hover:text-[#F97316] cursor-pointer"
                  >
                    7-Day Easy Returns
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white mb-3">
                Policies &amp; Secure Payments
              </h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 mb-4">
                <li>
                  <button
                    type="button"
                    onClick={() => setPolicyModal('privacy')}
                    className="hover:text-[#F97316] cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setPolicyModal('terms')}
                    className="hover:text-[#F97316] cursor-pointer"
                  >
                    Terms &amp; Conditions
                  </button>
                </li>
              </ul>

              <div className="flex flex-wrap gap-1.5">
                {PAYMENT_BADGES.map((badge) => (
                  <span
                    key={badge.id}
                    aria-label={badge.label}
                    className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10"
                  >
                    {badge.svg}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <span>© 2026 TECHHAVEN. All rights reserved.</span>
            <span>Official Global Hardware · New York · Dubai · London · Toronto</span>
          </div>
        </div>
      </footer>

      {/* Policy Modal */}
      <AnimatePresence>
        {activePolicy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPolicyModal(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-5 sm:p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  {activePolicy.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setPolicyModal(null)}
                  aria-label="Close policy modal"
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {activePolicy.body.map((para) => (
                  <p key={para}>{para}</p>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Global Live Support Chat Widget */}
      <div className="fixed bottom-20 lg:bottom-6 left-4 z-40 no-print">
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              className="mb-3 w-[calc(100vw-2rem)] sm:w-80 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="px-4 py-3 bg-[#F97316] text-white flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold">TECHHAVEN Global Desk</div>
                  <div className="text-[11px] opacity-90">24/7 International Order Help</div>
                </div>
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  aria-label="Close support chat"
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-black/15 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 space-y-2.5 max-h-[45dvh] sm:max-h-60 overflow-y-auto text-xs">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl max-w-[85%] ${
                      m.from === 'user'
                        ? 'ml-auto bg-[#F97316] text-white'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
              </div>

              <form
                onSubmit={sendSupportMessage}
                className="p-2.5 border-t border-slate-200 dark:border-white/10 flex gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about DHL shipping, warranty..."
                  className="flex-1 min-w-0 min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-xs focus:outline-none focus:border-[#F97316]"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-[#F97316] text-white cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setChatOpen((v) => !v)}
          aria-label="Open Live Support"
          className="h-12 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="hidden sm:inline">Live Support</span>
        </button>
      </div>
    </>
  );
};
