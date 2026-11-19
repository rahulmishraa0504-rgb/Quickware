import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FirestoreService } from '../services/firestoreService';
import { Order, SavedAddress } from '../types';
import { GREATER_NOIDA_LOCALITIES } from '../data/seedData';
import { GoogleSignInButton } from './GoogleSignInButton';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Plus,
  Trash2,
  LogOut,
  Package,
  Clock,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  MessageCircle,
  Save,
  AlertCircle,
} from 'lucide-react';

interface CustomerAccountViewProps {
  orders: Order[];
  onTrackOrder: (orderId: string) => void;
  onReorder: (order: Order) => void;
  onContinueShopping: () => void;
  onOpenEnquiry: () => void;
  onOpenAdmin: () => void;
}

export const CustomerAccountView: React.FC<CustomerAccountViewProps> = ({
  orders,
  onTrackOrder,
  onReorder,
  onContinueShopping,
  onOpenEnquiry,
  onOpenAdmin,
}) => {
  const { user, profile, isAdmin, authLoading, authError, loginWithGoogle, logout, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [defaultLocality, setDefaultLocality] = useState(GREATER_NOIDA_LOCALITIES[0]);
  const [profileSaved, setProfileSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addrLabel, setAddrLabel] = useState('');
  const [addrContact, setAddrContact] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrLine, setAddrLine] = useState('');
  const [addrLocality, setAddrLocality] = useState(GREATER_NOIDA_LOCALITIES[0]);
  const [addrInstructions, setAddrInstructions] = useState('');
  const [addrError, setAddrError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setPhone(profile.phone || '');
      setDefaultLocality(profile.defaultLocality || GREATER_NOIDA_LOCALITIES[0]);
      setAddrLocality(profile.defaultLocality || GREATER_NOIDA_LOCALITIES[0]);
      setAddrContact(profile.displayName || '');
      setAddrPhone(profile.phone || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!user) {
      setSavedAddresses([]);
      return;
    }
    const unsub = FirestoreService.subscribeSavedAddresses(user.uid, (list) => {
      setSavedAddresses(list);
    });
    return () => unsub();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setSavingProfile(true);
    try {
      await FirestoreService.updateUserProfile(user.uid, profile, {
        displayName: displayName.trim() || profile.displayName,
        phone: phone.trim(),
        defaultLocality,
      });
      await refreshProfile();
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setAddrError(null);
    if (!addrLabel.trim() || !addrContact.trim() || addrPhone.trim().length < 10 || addrLine.trim().length < 5) {
      setAddrError('Please enter label, contact name, valid 10-digit phone, and full address.');
      return;
    }
    await FirestoreService.addSavedAddress(user.uid, {
      label: addrLabel,
      contactName: addrContact,
      phone: addrPhone,
      address: addrLine,
      locality: addrLocality,
      instructions: addrInstructions,
    });
    setAddrLabel('');
    setAddrLine('');
    setAddrInstructions('');
    setShowAddAddress(false);
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-orange-400 flex items-center justify-center mx-auto">
            <UserIcon className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Sign in with your Google Account
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Access your Quickware profile, saved Greater Noida job-site addresses, instant reorder history, and live delivery tracking.
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <div className="pt-1 flex flex-col items-center gap-3">
            <GoogleSignInButton
              onClick={loginWithGoogle}
              disabled={authLoading}
              label="Continue with Google Email"
            />
            <button
              onClick={onContinueShopping}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
            >
              Return to Hardware Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Account Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-full border-2 border-orange-500 object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-slate-900 text-white font-extrabold text-lg flex items-center justify-center">
              {(user.displayName || user.email || 'Q')[0].toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                {profile?.displayName || user.displayName || 'Quickware Customer'}
              </h1>
              {isAdmin && (
                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold uppercase tracking-wide">
                  Verified Admin
                </span>
              )}
            </div>
            <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{user.email}</span>
              {user.emailVerified && (
                <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                  · <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              <span>Open Admin Console</span>
            </button>
          )}
          <button
            onClick={logout}
            disabled={authLoading}
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Profile Settings & Saved Addresses */}
        <div className="lg:col-span-5 space-y-6">
          {/* Profile Settings */}
          <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Profile Settings
            </h2>

            {profileSaved && (
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Profile updated successfully.</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Google Email</label>
                <input
                  type="text"
                  disabled
                  value={user.email || ''}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Name / Trade Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Number (+91)</label>
                <input
                  type="tel"
                  maxLength={15}
                  placeholder="e.g. 9812345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-orange-500 tabular-nums"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Greater Noida Sector</label>
                <select
                  value={defaultLocality}
                  onChange={(e) => setDefaultLocality(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-orange-500"
                >
                  {GREATER_NOIDA_LOCALITIES.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingProfile ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </form>

          {/* Saved Delivery Addresses */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Saved Site & Home Addresses ({savedAddresses.length})
              </h2>
              <button
                onClick={() => setShowAddAddress(!showAddAddress)}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {showAddAddress && (
              <form onSubmit={handleAddAddress} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                {addrError && <div className="text-red-600 font-medium">{addrError}</div>}
                <input
                  type="text"
                  required
                  placeholder="Label (e.g. Eldeco Site, Home)"
                  value={addrLabel}
                  onChange={(e) => setAddrLabel(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Receiver Name"
                    value={addrContact}
                    onChange={(e) => setAddrContact(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="10-digit Mobile"
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <select
                  value={addrLocality}
                  onChange={(e) => setAddrLocality(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  {GREATER_NOIDA_LOCALITIES.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                <textarea
                  rows={2}
                  required
                  placeholder="Flat, Tower, Street / Site Address"
                  value={addrLine}
                  onChange={(e) => setAddrLine(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(false)}
                    className="px-3 py-1 rounded-lg border text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-orange-600 text-white font-bold"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            )}

            {savedAddresses.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">
                No saved addresses yet. Add your frequent Greater Noida work site or home address for 1-click checkout.
              </p>
            ) : (
              <div className="space-y-2.5">
                {savedAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900">{addr.label}</div>
                      <div className="text-slate-700">{addr.address}</div>
                      <div className="text-slate-500">
                        {addr.locality} · {addr.contactName} ({addr.phone})
                      </div>
                    </div>
                    <button
                      onClick={() => FirestoreService.deleteSavedAddress(user.uid, addr.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                      title="Delete address"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order History & Support */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Your Hardware Orders ({orders.length})
              </h2>
              <button
                onClick={onContinueShopping}
                className="text-xs font-bold text-orange-600 hover:underline"
              >
                + New Order
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-sm font-bold text-slate-800">No orders placed yet</div>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Orders placed with {user.email} will appear here for real-time tracking and quick reordering.
                </p>
                <button
                  onClick={onContinueShopping}
                  className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs"
                >
                  Browse Hardware Catalogue
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <div key={order.id} className="py-3.5 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm">{order.orderNumber}</span>
                        <span className="text-slate-400 mx-1.5">·</span>
                        <span className="text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          order.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'Cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="text-slate-600">
                      {order.items.map((it) => `${it.quantity}× ${it.name}`).join(', ')}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="font-extrabold text-slate-900 tabular-nums">
                        Total: ₹{order.total} · {order.locality.split(',')[0]}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onReorder(order)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
                        >
                          Reorder
                        </button>
                        <button
                          onClick={() => onTrackOrder(order.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold"
                        >
                          Track Order
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Support & Help */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold flex items-center gap-1.5 text-orange-400">
                <HelpCircle className="w-4 h-4" />
                <span>Need Urgent Site Support?</span>
              </div>
              <p className="text-xs text-slate-300">
                Can't find an item or need help with an active delivery in Greater Noida?
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenEnquiry}
                className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs"
              >
                Request Unlisted Item
              </button>
              <a
                href="https://wa.me/919811234567"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Help</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
