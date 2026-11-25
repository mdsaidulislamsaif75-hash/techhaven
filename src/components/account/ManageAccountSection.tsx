import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  ArrowUpRight,
  Bell,
  Camera,
  Check,
  CheckCircle2,
  CreditCard,
  Edit3,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  MonitorSmartphone,
  Plus,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { AVATAR_PRESETS, COUNTRY_CONFIG } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { UserAvatar } from '../UserAvatar';
import {
  CountryCode,
  CustomerAccountExtras,
  OrderStatus,
  PhoneDialCode,
  SavedAddress,
  SavedPaymentCard,
} from '../../types/store';
import { getUserInitials, processAvatarFile } from '../../utils/avatar';
import { formatFullAddress, formatPrice } from '../../utils/format';

type ManageSubSection = 'all' | 'profile' | 'addresses' | 'payments' | 'security' | 'preferences';

const ORDER_STATUS_META: Record<OrderStatus, { label: string; tone: string }> = {
  placed: { label: 'Placed', tone: 'text-[#F97316]' },
  confirmed: { label: 'Confirmed', tone: 'text-[#F97316]' },
  shipped: { label: 'Shipped', tone: 'text-sky-600 dark:text-sky-400' },
  out_for_delivery: { label: 'Out for Delivery', tone: 'text-sky-600 dark:text-sky-400' },
  delivered: { label: 'Delivered', tone: 'text-emerald-600 dark:text-emerald-400' },
  cancelled: { label: 'Cancelled', tone: 'text-red-500' },
  return_requested: { label: 'Return Requested', tone: 'text-amber-600 dark:text-amber-400' },
};

export const ManageAccountSection: React.FC = () => {
  const { user, isAuthenticated, profile, updateProfileFields, changePassword } = useAuth();
  const {
    accountExtras,
    updateAccountExtras,
    addresses,
    saveAddress,
    deleteAddress,
    setDefaultShippingAddress,
    setDefaultBillingAddress,
    addSavedCard,
    setDefaultSavedCard,
    removeSavedCard,
    toggleLinkedWallet,
    toggleTwoFactor,
    revokeDeviceSession,
    updateCommunicationPrefs,
    orders,
    currency,
    setAccountTab,
    addToast,
    openAuthModal,
  } = useStore();

  const [subTab, setSubTab] = useState<ManageSubSection>('all');

  // Edit Profile Modal State
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profName, setProfName] = useState('');
  const [profPhoneCode, setProfPhoneCode] = useState<PhoneDialCode>('+1');
  const [profPhone, setProfPhone] = useState('');
  const [profDob, setProfDob] = useState('');
  const [profGender, setProfGender] = useState<CustomerAccountExtras['gender']>('Prefer not to say');
  const [profAvatar, setProfAvatar] = useState<string>('');
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [cardAvatarError, setCardAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  // Address Modal State
  const [addrModalOpen, setAddrModalOpen] = useState(false);
  const [editingAddrId, setEditingAddrId] = useState<string | undefined>(undefined);
  const [addrLabel, setAddrLabel] = useState<'Home' | 'Office' | 'Other'>('Home');
  const [addrCountry, setAddrCountry] = useState<CountryCode>('US');
  const [addrName, setAddrName] = useState('');
  const [addrEmail, setAddrEmail] = useState('');
  const [addrPhoneCode, setAddrPhoneCode] = useState<PhoneDialCode>('+1');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrApt, setAddrApt] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrRegion, setAddrRegion] = useState('');
  const [addrPostal, setAddrPostal] = useState('');
  const [addrDefaultShipping, setAddrDefaultShipping] = useState(false);

  // Add Payment Card Modal State
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardBrand, setCardBrand] = useState<SavedPaymentCard['brand']>('Visa');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardMakeDefault, setCardMakeDefault] = useState(true);

  // Password Change Form State
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwFeedback, setPwFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const defaultShippingAddr = useMemo(
    () => addresses.find((a) => a.isDefault) || addresses[0],
    [addresses]
  );

  const defaultBillingAddr = useMemo(
    () =>
      addresses.find((a) => a.id === accountExtras.defaultBillingAddressId) ||
      defaultShippingAddr ||
      addresses[0],
    [addresses, accountExtras.defaultBillingAddressId, defaultShippingAddr]
  );

  const recentOrders = useMemo(() => orders.slice(0, 3), [orders]);

  const activeAvatarUrl = profile ? profile.photoURL || '' : accountExtras.avatarUrl || '';
  const activePreset = AVATAR_PRESETS.find((p) => p.id === activeAvatarUrl);

  const initials = useMemo(
    () => getUserInitials(profile?.displayName),
    [profile?.displayName]
  );

  const modalInitials = useMemo(
    () => getUserInitials(profName || profile?.displayName),
    [profName, profile?.displayName]
  );

  const modalPreset = useMemo(
    () => AVATAR_PRESETS.find((p) => p.id === profAvatar),
    [profAvatar]
  );

  const openEditProfile = () => {
    setProfName(profile?.displayName || '');
    setProfPhoneCode(profile?.phoneCode || '+1');
    setProfPhone(profile?.phone || '');
    setProfDob(accountExtras.dateOfBirth || '1995-06-14');
    setProfGender(accountExtras.gender || 'Prefer not to say');
    setProfAvatar(activeAvatarUrl);
    setAvatarError(null);
    setAvatarUploading(false);
    setProfileModalOpen(true);
  };

  const handleModalAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setAvatarError(null);
    setAvatarUploading(true);
    try {
      const result = await processAvatarFile(file);
      if (!result.ok) {
        setAvatarError(result.error);
        addToast('Invalid photo', result.error, 'error');
        return;
      }
      setProfAvatar(result.dataUrl);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleDirectAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!isAuthenticated) {
      openAuthModal({ tab: 'login', context: 'general' });
      return;
    }

    setCardAvatarError(null);
    setAvatarUploading(true);
    try {
      const result = await processAvatarFile(file);
      if (!result.ok) {
        setCardAvatarError(result.error);
        addToast('Invalid photo', result.error, 'error');
        return;
      }
      await updateProfileFields({ photoURL: result.dataUrl });
      updateAccountExtras({ avatarUrl: result.dataUrl });
      addToast('Profile photo updated', 'Your new profile avatar is now live.', 'success');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleDirectRemoveAvatar = async () => {
    if (!isAuthenticated) {
      openAuthModal({ tab: 'login', context: 'general' });
      return;
    }
    setCardAvatarError(null);
    await updateProfileFields({ photoURL: '' });
    updateAccountExtras({ avatarUrl: undefined });
    addToast('Profile photo removed', 'Your avatar now shows your initials.', 'info');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal({ tab: 'login', context: 'general' });
      return;
    }
    await updateProfileFields({
      displayName: profName.trim() || 'TechHaven Customer',
      phoneCode: profPhoneCode,
      phone: profPhone.trim(),
      photoURL: profAvatar,
    });
    updateAccountExtras({
      dateOfBirth: profDob,
      gender: profGender,
      avatarUrl: profAvatar || undefined,
    });
    setProfileModalOpen(false);
    addToast('Profile updated', 'Your personal details have been saved.', 'success');
  };

  const openAddressModal = (existing?: SavedAddress) => {
    if (existing) {
      setEditingAddrId(existing.id);
      setAddrLabel(existing.label);
      setAddrCountry(existing.country);
      setAddrName(existing.fullName);
      setAddrEmail(existing.email);
      setAddrPhoneCode(existing.phoneCode);
      setAddrPhone(existing.phone);
      setAddrStreet(existing.streetAddress);
      setAddrApt(existing.apartment || '');
      setAddrCity(existing.city);
      setAddrRegion(existing.region);
      setAddrPostal(existing.postalCode);
      setAddrDefaultShipping(existing.isDefault);
    } else {
      setEditingAddrId(undefined);
      setAddrLabel('Home');
      setAddrCountry('US');
      setAddrName(profile?.displayName || '');
      setAddrEmail(profile?.email || '');
      setAddrPhoneCode(profile?.phoneCode || '+1');
      setAddrPhone(profile?.phone || '');
      setAddrStreet('');
      setAddrApt('');
      setAddrCity('');
      setAddrRegion('');
      setAddrPostal('');
      setAddrDefaultShipping(addresses.length === 0);
    }
    setAddrModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveAddress({
      id: editingAddrId,
      label: addrLabel,
      country: addrCountry,
      fullName: addrName,
      email: addrEmail || 'customer@techhaven.store',
      phoneCode: addrPhoneCode,
      phone: addrPhone,
      streetAddress: addrStreet,
      apartment: addrApt || undefined,
      city: addrCity,
      region: addrRegion,
      postalCode: addrPostal,
      isDefault: addrDefaultShipping,
    });
    setAddrModalOpen(false);
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 12) {
      addToast('Invalid card number', 'Please enter at least 12 digits.', 'error');
      return;
    }
    const cleanExpiry = cardExpiry.trim() || '09/29';
    addSavedCard({
      brand: cardBrand,
      last4: digits.slice(-4),
      expiry: cleanExpiry,
      holderName: cardHolder.trim() || profile?.displayName || 'TechHaven Member',
      isDefault: cardMakeDefault,
    });
    setCardModalOpen(false);
    setCardNumber('');
    setCardExpiry('');
    setCardHolder('');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwFeedback(null);
    if (newPw !== confirmPw) {
      setPwFeedback({ ok: false, text: 'New password and confirmation do not match.' });
      return;
    }
    setPwSubmitting(true);
    const res = await changePassword(currentPw, newPw);
    setPwSubmitting(false);
    setPwFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      addToast('Password changed', res.message, 'success');
    }
  };

  const showSection = (key: Exclude<ManageSubSection, 'all'>) =>
    subTab === 'all' || subTab === key;

  return (
    <div className="space-y-6">
      {/* Sub-Section Segmented Controls */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/10 overflow-x-auto no-scrollbar">
        {[
          { id: 'all' as const, label: 'Account Hub' },
          { id: 'profile' as const, label: 'My Profile' },
          { id: 'addresses' as const, label: 'Address Book' },
          { id: 'payments' as const, label: 'Payment Options' },
          { id: 'security' as const, label: 'Security & Login' },
          { id: 'preferences' as const, label: 'Preferences & Snapshot' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSubTab(item.id)}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              subTab === item.id
                ? 'bg-white dark:bg-[#0B0F19] text-[#F97316] shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* SUB-SECTION 1: MY PROFILE (PERSONAL INFORMATION) */}
      {showSection('profile') && (
        <section className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <User className="w-5 h-5 text-[#F97316]" />
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  My Profile
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Personal identity, verified email, and international contact details
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openEditProfile}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Direct Avatar Preview & Upload Controls */}
            <div className="flex flex-col gap-2.5 shrink-0">
              <div className="flex items-center gap-4">
                <input
                  ref={quickFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleDirectAvatarUpload}
                  className="hidden"
                />
                <UserAvatar
                  src={activeAvatarUrl}
                  name={profile?.displayName}
                  sizeClass="w-16 h-16 sm:w-20 sm:h-20"
                  textClass="text-xl"
                  roundedClass="rounded-2xl"
                  showCameraButton
                  onCameraClick={() => quickFileInputRef.current?.click()}
                />
                <div className="space-y-1.5">
                  <div className="md:hidden">
                    <div className="text-base font-bold text-slate-900 dark:text-white">
                      {profile?.displayName || 'TechHaven Member'}
                    </div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 mt-0.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified Account
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={avatarUploading}
                      onClick={() => quickFileInputRef.current?.click()}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:border-[#F97316] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#F97316] inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#F97316]" />
                      {avatarUploading
                        ? 'Processing...'
                        : activeAvatarUrl
                          ? 'Change Avatar'
                          : 'Upload Photo'}
                    </button>
                    {activeAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => void handleDirectRemoveAvatar()}
                        className="min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-red-500 inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {activePreset ? `${activePreset.label} preset` : 'PNG, JPG, WEBP or GIF up to 3MB'}
                  </p>
                </div>
              </div>
              {cardAvatarError && (
                <div
                  role="alert"
                  className="inline-flex items-center gap-1.5 text-xs text-red-500 font-medium"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{cardAvatarError}</span>
                </div>
              )}
            </div>

            {/* Clean Info Grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Full Name</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                  {profile?.displayName || 'Guest Customer'}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Email Address</div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {profile?.email || 'Not signed in'}
                  </span>
                  {isAuthenticated && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">International Phone</div>
                <div className="text-sm font-semibold font-mono-num text-slate-900 dark:text-white mt-0.5">
                  {profile?.phone
                    ? `${profile.phoneCode || '+1'} ${profile.phone}`
                    : defaultShippingAddr
                      ? `${defaultShippingAddr.phoneCode} ${defaultShippingAddr.phone}`
                      : 'Not added'}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Date of Birth</div>
                <div className="text-sm font-semibold font-mono-num text-slate-900 dark:text-white mt-0.5">
                  {accountExtras.dateOfBirth || '—'}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Gender</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                  {accountExtras.gender}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SUB-SECTION 2: ADDRESS BOOK */}
      {showSection('addresses') && (
        <section className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-[#F97316]" />
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Address Book
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage default shipping &amp; billing locations across USA, UAE, UK, and Canada
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openAddressModal()}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add New Address
            </button>
          </div>

          {/* Side-by-Side Default Shipping & Default Billing Summary */}
          {addresses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-5 border-b border-slate-100 dark:border-white/10">
              {defaultShippingAddr && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#F97316]">Default Shipping Address</span>
                    <span className="text-[11px] font-medium text-slate-500">
                      {COUNTRY_CONFIG[defaultShippingAddr.country].name}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {defaultShippingAddr.fullName}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {formatFullAddress(defaultShippingAddr)}
                  </p>
                  <div className="text-xs font-mono-num text-slate-500">
                    {defaultShippingAddr.phoneCode} {defaultShippingAddr.phone}
                  </div>
                </div>
              )}

              {defaultBillingAddr && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Default Billing Address
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      {COUNTRY_CONFIG[defaultBillingAddr.country].name}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {defaultBillingAddr.fullName}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {formatFullAddress(defaultBillingAddr)}
                  </p>
                  <div className="text-xs font-mono-num text-slate-500">
                    {defaultBillingAddr.phoneCode} {defaultBillingAddr.phone}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Saved Address List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => {
              const isBillingDefault = defaultBillingAddr?.id === addr.id;
              return (
                <div
                  key={addr.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {addr.label} · {COUNTRY_CONFIG[addr.country].code}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] font-semibold">
                        {addr.isDefault && (
                          <span className="text-[#F97316]">Default Shipping</span>
                        )}
                        {addr.isDefault && isBillingDefault && (
                          <span className="text-slate-400" aria-hidden="true">·</span>
                        )}
                        {isBillingDefault && (
                          <span className="text-emerald-600 dark:text-emerald-400">Default Billing</span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {addr.fullName}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {formatFullAddress(addr)}
                    </p>
                    <div className="text-xs font-mono-num text-slate-500">
                      {addr.phoneCode} {addr.phone}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-3 border-t border-slate-100 dark:border-white/10">
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={() => void setDefaultShippingAddress(addr.id)}
                        className="text-xs font-semibold text-[#F97316] hover:underline cursor-pointer"
                      >
                        Set Default Shipping
                      </button>
                    )}
                    {!isBillingDefault && (
                      <button
                        type="button"
                        onClick={() => setDefaultBillingAddress(addr.id)}
                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        Set Default Billing
                      </button>
                    )}
                    <div className="flex items-center gap-3 ml-auto">
                      <button
                        type="button"
                        onClick={() => openAddressModal(addr)}
                        className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#F97316] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteAddress(addr.id)}
                        className="text-xs font-semibold text-slate-400 hover:text-red-500 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SUB-SECTION 3: MY PAYMENT OPTIONS */}
      {showSection('payments') && (
        <section className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-5 sm:p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-5 h-5 text-[#F97316]" />
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  My Payment Options
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Saved international cards and express digital wallets
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setCardHolder(profile?.displayName || 'Alexander Reed');
                setCardModalOpen(true);
              }}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add New Card
            </button>
          </div>

          {/* Saved Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Saved Credit &amp; Debit Cards
            </h3>
            {accountExtras.savedCards.length === 0 ? (
              <p className="text-sm text-slate-500 py-3">
                No cards saved yet. Add a card for faster checkout.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {accountExtras.savedCards.map((card) => (
                  <div
                    key={card.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                      card.isDefault
                        ? 'border-[#F97316]/60 bg-[#F97316]/5'
                        : 'border-slate-200 dark:border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {card.brand}
                          </span>
                          <span className="font-mono-num text-sm font-semibold text-slate-700 dark:text-slate-200">
                            •••• {card.last4}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {card.holderName} · Expires <span className="font-mono-num">{card.expiry}</span>
                        </div>
                      </div>
                      {card.isDefault && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#F97316]">
                          <Check className="w-3.5 h-3.5" />
                          Default
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-white/10">
                      {!card.isDefault ? (
                        <button
                          type="button"
                          onClick={() => setDefaultSavedCard(card.id)}
                          className="text-xs font-semibold text-[#F97316] hover:underline cursor-pointer"
                        >
                          Set Default
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Primary checkout card</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeSavedCard(card.id)}
                        className="text-xs font-semibold text-slate-400 hover:text-red-500 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linked Digital Wallets */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/10">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Linked Digital Wallets
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {accountExtras.linkedWallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[#F97316] shrink-0">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {wallet.label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {wallet.connected
                          ? `Connected · ${wallet.accountHint || 'Active'}`
                          : 'Not linked'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleLinkedWallet(wallet.id, profile?.email)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      wallet.connected
                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30'
                        : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-[#F97316] dark:hover:bg-[#F97316] dark:hover:text-white'
                    }`}
                  >
                    {wallet.connected ? 'Connected' : 'Link Wallet'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SUB-SECTION 4: SECURITY & LOGIN SETTINGS */}
      {showSection('security') && (
        <section className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-5 sm:p-6 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-white/10">
            <ShieldCheck className="w-5 h-5 text-[#F97316]" />
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Security &amp; Login Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update your password, manage two-factor authentication, and review active devices
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Change Password Form */}
            <form onSubmit={handlePasswordSubmit} className="lg:col-span-6 space-y-3.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <KeyRound className="w-4 h-4 text-[#F97316]" />
                Change Password
              </div>
              {pwFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium border ${
                    pwFeedback.ok
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-500'
                  }`}
                >
                  {pwFeedback.text}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={pwSubmitting}
                className="min-h-[42px] px-5 py-2 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                {pwSubmitting ? 'Updating...' : 'Update Password'}
              </button>
            </form>

            {/* 2FA & Active Device Sessions */}
            <div className="lg:col-span-6 space-y-4 lg:pl-6 lg:border-l border-slate-100 dark:border-white/10">
              {/* 2FA Toggle */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-4 h-4 text-[#F97316] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      Two-Factor Authentication (2FA)
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {accountExtras.twoFactorEnabled
                        ? 'Enabled via authenticator & SMS verification'
                        : 'Add an extra layer of account protection'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={accountExtras.twoFactorEnabled}
                  onClick={toggleTwoFactor}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
                    accountExtras.twoFactorEnabled ? 'bg-[#F97316]' : 'bg-slate-300 dark:bg-white/15'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      accountExtras.twoFactorEnabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Active Device Sessions */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <MonitorSmartphone className="w-4 h-4 text-[#F97316]" />
                  Active Device Sessions
                </div>
                {accountExtras.deviceSessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {sess.device}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {sess.location} · {sess.lastActive}
                      </div>
                    </div>
                    {sess.current ? (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                        Current
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => revokeDeviceSession(sess.id)}
                        className="text-xs font-semibold text-red-500 hover:underline shrink-0 cursor-pointer"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SUB-SECTION 5: COMMUNICATION PREFERENCES & RECENT ORDERS SNAPSHOT */}
      {showSection('preferences') && (
        <section className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-5 sm:p-6 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-white/10">
            <Bell className="w-5 h-5 text-[#F97316]" />
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Communication Preferences &amp; Recent Orders
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose your alert channels and inspect your latest international orders
              </p>
            </div>
          </div>

          {/* 3 Notification Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {[
              {
                key: 'newsletter' as const,
                icon: Mail,
                title: 'Email Newsletter & Exclusive Deals',
                desc: 'Weekly hardware drops and VIP member codes',
                checked: accountExtras.communicationPrefs.newsletter,
              },
              {
                key: 'smsOrderAlerts' as const,
                icon: Smartphone,
                title: 'Order Status SMS Alerts',
                desc: 'Live DHL, FedEx & Aramex courier milestones',
                checked: accountExtras.communicationPrefs.smsOrderAlerts,
              },
              {
                key: 'backInStock' as const,
                icon: Bell,
                title: 'Back-in-Stock Notifications',
                desc: 'Instant alerts when wishlisted items restock',
                checked: accountExtras.communicationPrefs.backInStock,
              },
            ].map((pref) => (
              <div
                key={pref.key}
                className="p-4 rounded-xl border border-slate-200 dark:border-white/10 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <pref.icon className="w-4 h-4 text-[#F97316] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      {pref.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {pref.desc}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={pref.checked}
                  onClick={() => updateCommunicationPrefs({ [pref.key]: !pref.checked })}
                  className={`relative w-10 h-5 rounded-full transition-colors shrink-0 cursor-pointer ${
                    pref.checked ? 'bg-[#F97316]' : 'bg-slate-300 dark:bg-white/15'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      pref.checked ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          {/* Recent Orders Snapshot Table */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Orders
              </h3>
              <button
                type="button"
                onClick={() => setAccountTab('orders')}
                className="text-xs font-semibold text-[#F97316] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                View All Orders
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-white/10 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#0B0F19] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="py-2.5 px-3.5 font-semibold">Order ID</th>
                    <th className="py-2.5 px-3.5 font-semibold">Date</th>
                    <th className="py-2.5 px-3.5 font-semibold">Items</th>
                    <th className="py-2.5 px-3.5 font-semibold">Total</th>
                    <th className="py-2.5 px-3.5 font-semibold">Status</th>
                    <th className="py-2.5 px-3.5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {recentOrders.map((ord) => {
                    const meta = ORDER_STATUS_META[ord.status];
                    const itemCount = ord.items.reduce((acc, i) => acc + i.quantity, 0);
                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                        <td className="py-3 px-3.5 font-mono-num font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {ord.orderNumber}
                        </td>
                        <td className="py-3 px-3.5 font-mono-num text-slate-500 whitespace-nowrap">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300 whitespace-nowrap tabular-nums">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </td>
                        <td className="py-3 px-3.5 font-mono-num font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {formatPrice(ord.totalUsd, currency)}
                        </td>
                        <td className={`py-3 px-3.5 font-semibold whitespace-nowrap ${meta.tone}`}>
                          {meta.label}
                        </td>
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setAccountTab('orders')}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:border-[#F97316] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#F97316] transition-colors cursor-pointer"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* MODAL: EDIT PROFILE & AVATAR */}
      <AnimatePresence>
        {profileModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProfileModalOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleSaveProfile}
              className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-5 sm:p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  Edit Personal Profile
                </h3>
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  aria-label="Close edit profile"
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Avatar Live Preview, Upload & Preset Selection */}
              <div className="space-y-3 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 p-3.5 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <UserAvatar
                    src={profAvatar}
                    name={profName || profile?.displayName}
                    sizeClass="w-20 h-20"
                    textClass="text-2xl"
                    roundedClass="rounded-2xl"
                    showCameraButton
                    onCameraClick={() => fileInputRef.current?.click()}
                  />

                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <span className="block text-xs font-bold text-slate-900 dark:text-white">
                        Profile Photo Live Preview
                      </span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                        {modalPreset
                          ? `Using ${modalPreset.label} avatar preset`
                          : profAvatar
                            ? 'Custom uploaded photo ready to save'
                            : `Default initials (${initials}) · PNG, JPG, WEBP or GIF up to 3MB`}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleModalAvatarUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={avatarUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 hover:border-[#F97316] text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                      >
                        <Camera className="w-4 h-4 text-[#F97316]" />
                        {avatarUploading
                          ? 'Processing...'
                          : profAvatar && !modalPreset
                            ? 'Change Photo'
                            : 'Upload Photo'}
                      </button>

                      {profAvatar && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfAvatar('');
                            setAvatarError(null);
                          }}
                          className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-red-500/40 text-xs font-semibold text-slate-500 hover:text-red-500 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {avatarError && (
                  <div
                    role="alert"
                    className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500 font-medium flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{avatarError}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200/70 dark:border-white/10 space-y-2">
                  <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Or choose a preset badge
                  </span>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {AVATAR_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setProfAvatar(preset.id);
                          setAvatarError(null);
                        }}
                        title={preset.label}
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${preset.bg} text-white text-xs font-bold flex items-center justify-center cursor-pointer transition-transform ${
                          profAvatar === preset.id
                            ? 'ring-2 ring-[#F97316] ring-offset-2 dark:ring-offset-[#0B0F19] scale-105'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                      >
                        {modalInitials}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Phone Number &amp; Country Code
                </label>
                <div className="flex gap-2">
                  <select
                    value={profPhoneCode}
                    onChange={(e) => setProfPhoneCode(e.target.value as PhoneDialCode)}
                    className="w-28 min-h-[42px] px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm font-mono-num"
                  >
                    <option value="+1">+1 (US/CA)</option>
                    <option value="+971">+971 (UAE)</option>
                    <option value="+44">+44 (UK)</option>
                  </select>
                  <input
                    type="tel"
                    value={profPhone}
                    onChange={(e) => setProfPhone(e.target.value)}
                    placeholder="(212) 555-0194"
                    className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={profDob}
                    onChange={(e) => setProfDob(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Gender
                  </label>
                  <select
                    value={profGender}
                    onChange={(e) => setProfGender(e.target.value as CustomerAccountExtras['gender'])}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ADD / EDIT INTERNATIONAL ADDRESS */}
      <AnimatePresence>
        {addrModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddrModalOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleSaveAddress}
              className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-5 sm:p-6 shadow-2xl space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  {editingAddrId ? 'Edit International Address' : 'Add Shipping Address'}
                </h3>
                <button
                  type="button"
                  onClick={() => setAddrModalOpen(false)}
                  aria-label="Close address modal"
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-2">
                {(['Home', 'Office', 'Other'] as const).map((lbl) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => setAddrLabel(lbl)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                      addrLabel === lbl
                        ? 'border-[#F97316] bg-[#F97316]/10 text-[#F97316]'
                        : 'border-slate-200 dark:border-white/10'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              <select
                value={addrCountry}
                onChange={(e) => {
                  const next = e.target.value as CountryCode;
                  setAddrCountry(next);
                  setAddrPhoneCode(COUNTRY_CONFIG[next].dialCode);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm"
              >
                <option value="US">United States</option>
                <option value="AE">United Arab Emirates</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
              </select>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={addrName}
                  onChange={(e) => setAddrName(e.target.value)}
                  placeholder="Recipient Full Name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm"
                />
                <input
                  type="email"
                  required
                  value={addrEmail}
                  onChange={(e) => setAddrEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={addrPhoneCode}
                  onChange={(e) => setAddrPhoneCode(e.target.value as PhoneDialCode)}
                  className="w-28 px-2.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm font-mono-num"
                >
                  <option value="+1">+1</option>
                  <option value="+971">+971</option>
                  <option value="+44">+44</option>
                </select>
                <input
                  type="tel"
                  required
                  value={addrPhone}
                  onChange={(e) => setAddrPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={addrStreet}
                  onChange={(e) => setAddrStreet(e.target.value)}
                  placeholder="Street Address"
                  className="sm:col-span-2 w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm"
                />
                <input
                  type="text"
                  value={addrApt}
                  onChange={(e) => setAddrApt(e.target.value)}
                  placeholder="Apt / Suite"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  placeholder="City"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm"
                />
                <input
                  type="text"
                  required
                  value={addrRegion}
                  onChange={(e) => setAddrRegion(e.target.value)}
                  placeholder={COUNTRY_CONFIG[addrCountry].regionLabel}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm"
                />
                <input
                  type="text"
                  required
                  value={addrPostal}
                  onChange={(e) => setAddrPostal(e.target.value)}
                  placeholder={COUNTRY_CONFIG[addrCountry].postalLabel}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm font-mono-num"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addrDefaultShipping}
                  onChange={(e) => setAddrDefaultShipping(e.target.checked)}
                  className="accent-[#F97316]"
                />
                Set as default shipping address
              </label>

              <button
                type="submit"
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-sm font-semibold cursor-pointer"
              >
                Save Address
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ADD NEW CARD */}
      <AnimatePresence>
        {cardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCardModalOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleAddCard}
              className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-5 sm:p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  Add Payment Card
                </h3>
                <button
                  type="button"
                  onClick={() => setCardModalOpen(false)}
                  aria-label="Close card modal"
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-2">
                {(['Visa', 'Mastercard', 'Amex'] as const).map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setCardBrand(brand)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                      cardBrand === brand
                        ? 'border-[#F97316] bg-[#F97316]/10 text-[#F97316]'
                        : 'border-slate-200 dark:border-white/10'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Cardholder Name</label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="Alexander Reed"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold mb-1">Card Number</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4532 •••• •••• 1049"
                    maxLength={19}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Expiry</label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="08/29"
                    maxLength={5}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm font-mono-num"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cardMakeDefault}
                  onChange={(e) => setCardMakeDefault(e.target.checked)}
                  className="accent-[#F97316]"
                />
                Set as default payment method
              </label>

              <button
                type="submit"
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-sm font-semibold cursor-pointer"
              >
                Save Card
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
