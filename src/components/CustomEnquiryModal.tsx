import React, { useState, useEffect } from 'react';
import { FirestoreService } from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';
import { GREATER_NOIDA_LOCALITIES } from '../data/seedData';
import { GoogleSignInButton } from './GoogleSignInButton';
import {
  X,
  FileQuestion,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
  Send,
  Mail,
} from 'lucide-react';

interface CustomEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLocality: string;
}

export const CustomEnquiryModal: React.FC<CustomEnquiryModalProps> = ({
  isOpen,
  onClose,
  defaultLocality,
}) => {
  const { user, profile, authLoading, authError, loginWithGoogle } = useAuth();
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [locality, setLocality] = useState(defaultLocality || GREATER_NOIDA_LOCALITIES[0]);
  const [category, setCategory] = useState('Screws & Fasteners');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'Job Stalled (Urgent)' | 'Within 2 Hours' | 'Today'>('Job Stalled (Urgent)');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user || profile) {
      setCustomerName((prev) => prev || profile?.displayName || user?.displayName || '');
      setPhone((prev) => prev || profile?.phone || '');
    }
  }, [user, profile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!user) {
      setErrorMsg('Please sign in with Google so our sourcing desk can update you.');
      return;
    }

    if (!customerName.trim() || phone.replace(/\D/g, '').length < 10 || description.trim().length < 5) {
      setErrorMsg('Please enter your name, a valid 10-digit mobile number, and at least 5 characters describing the item.');
      return;
    }

    setSubmitting(true);
    try {
      const formattedPhone = `+91 ${phone.replace(/^\+91\s*/, '').replace(/\D/g, '').slice(-10)}`;
      await FirestoreService.createEnquiry(user, {
        customerName: customerName.trim(),
        customerPhone: formattedPhone,
        locality,
        category,
        itemDescription: description.trim(),
        urgency,
      });
      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit enquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!user ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Sign in to Request Unlisted Hardware</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1">
                Sign in with your Google email so our Greater Noida retail sourcing team can tie the request to your account.
              </p>
            </div>
            {authError && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs">{authError}</div>
            )}
            <div className="flex justify-center">
              <GoogleSignInButton
                onClick={loginWithGoogle}
                disabled={authLoading}
                label="Continue with Google Email"
              />
            </div>
          </div>
        ) : submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Request Sent to Retailer Network!</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1">
                Our Greater Noida retail sourcing team is pinging partner shops to locate your item. We will contact you at {phone} or {user.email}.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center">
                <FileQuestion className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Can't Find Your Hardware?</h3>
                <p className="text-xs text-slate-500">
                  Signed in as {user.email}. Tell us what's needed and we'll source it locally.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Name / Trade *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Salim (Fabricator)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    maxLength={14}
                    placeholder="e.g. 9812345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s]/g, ''))}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-orange-500 outline-none tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sector in Greater Noida
                </label>
                <select
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-orange-500 outline-none"
                >
                  {GREATER_NOIDA_LOCALITIES.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hardware Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-orange-500 outline-none"
                >
                  <option value="Screws & Fasteners">Screws & Fasteners</option>
                  <option value="Nails & Fixings">Nails & Fixings</option>
                  <option value="Adhesives">Adhesives</option>
                  <option value="Hand Tools">Hand Tools</option>
                  <option value="Electrical Fittings">Electrical Fittings</option>
                  <option value="Plumbing Fittings">Plumbing Fittings</option>
                  <option value="Locks & Security">Locks & Security</option>
                  <option value="Repair Essentials">Repair Essentials</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Describe the Item & Specific Dimensions *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Need 4 sets of 12mm glass sliding door rollers with nylon bearings for Jindal section door."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                How Urgent Is This?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Job Stalled (Urgent)', 'Within 2 Hours', 'Today'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setUrgency(level)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                      urgency === level
                        ? 'bg-orange-50 border-orange-600 text-orange-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:bg-slate-300 text-white font-bold text-xs shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Submit Hardware Sourcing Request'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
