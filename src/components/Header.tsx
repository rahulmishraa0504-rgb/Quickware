import React, { useState } from 'react';
import {
  Wrench,
  ShoppingCart,
  MapPin,
  Search,
  FileQuestion,
  Clock,
  ShieldAlert,
  Menu,
  X,
  User as UserIcon,
  LogOut,
} from 'lucide-react';
import { GREATER_NOIDA_LOCALITIES } from '../data/seedData';
import { useAuth } from '../context/AuthContext';
import { GoogleSignInButton } from './GoogleSignInButton';

interface HeaderProps {
  selectedLocality: string;
  onSelectLocality: (locality: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  activeView: 'home' | 'catalogue' | 'tracking' | 'account' | 'admin';
  onChangeView: (view: 'home' | 'catalogue' | 'tracking' | 'account' | 'admin') => void;
  onOpenEnquiry: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedLocality,
  onSelectLocality,
  cartCount,
  onOpenCart,
  activeView,
  onChangeView,
  onOpenEnquiry,
  searchQuery,
  onSearchChange,
}) => {
  const { user, profile, isAdmin, authLoading, loginWithGoogle, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
      {/* Top Notification / Pilot Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-300 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 truncate">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="font-medium">Greater Noida Hyperlocal Pilot:</span>
            <span className="text-amber-200/90 truncate">
              Delivering screws, tools, adhesives & fittings direct from verified local retailers.
            </span>
          </span>
          <button
            onClick={onOpenEnquiry}
            className="text-amber-300 hover:text-white underline font-medium text-xs whitespace-nowrap shrink-0 transition-colors"
          >
            Can't find an item? Request here
          </button>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onChangeView('home')}
              className="flex items-center gap-2 group text-left focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md group-hover:bg-orange-500 transition-colors">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1">
                  QUICKWARE
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                  Everyday Hardware
                </span>
              </div>
            </button>

            {/* Locality Selector Pill */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowLocationPicker(!showLocationPicker)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-xs text-slate-200 border border-slate-700 transition-colors text-left max-w-[180px]"
                title="Change delivery locality"
              >
                <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span className="truncate font-medium">{selectedLocality.split(',')[0]}</span>
              </button>

              {showLocationPicker && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                    Select Greater Noida Locality
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {GREATER_NOIDA_LOCALITIES.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => {
                          onSelectLocality(loc);
                          setShowLocationPicker(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-700 transition-colors ${
                          selectedLocality === loc ? 'text-orange-400 font-semibold bg-slate-700/50' : 'text-slate-200'
                        }`}
                      >
                        <span className="truncate">{loc}</span>
                        {selectedLocality === loc && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-sm relative">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search screws, adhesives, tools..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-lg bg-slate-800 text-sm text-slate-100 placeholder-slate-400 border border-slate-700 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => onChangeView('home')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                activeView === 'home'
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => onChangeView('catalogue')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                activeView === 'catalogue'
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Catalogue
            </button>

            <button
              onClick={() => onChangeView('tracking')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors ${
                activeView === 'tracking'
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Orders</span>
            </button>

            <button
              onClick={() => onChangeView('admin')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors flex items-center gap-1.5 ${
                activeView === 'admin'
                  ? 'bg-slate-800 text-orange-400 border-orange-500'
                  : 'text-slate-400 hover:text-slate-200 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
              <span>Admin</span>
            </button>
          </nav>

          {/* Auth + Cart CTA & Mobile Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <button
                onClick={() => onChangeView('account')}
                className={`hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors max-w-[170px] ${
                  activeView === 'account'
                    ? 'bg-slate-800 border-orange-500 text-white'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
                }`}
                title={`Signed in as ${user.email}`}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-orange-400 shrink-0" />
                )}
                <span className="truncate">
                  {profile?.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                </span>
              </button>
            ) : (
              <div className="hidden sm:block">
                <GoogleSignInButton
                  onClick={loginWithGoogle}
                  disabled={authLoading}
                  label="Sign in"
                  compact
                />
              </div>
            )}

            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-slate-900 whitespace-nowrap shrink-0"
              aria-label="View shopping cart"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="bg-white text-orange-600 rounded-full font-bold px-1.5 py-0.2 text-[11px] min-w-[18px] text-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="mt-2.5 lg:hidden">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search screws, adhesives, tools, locks..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-slate-800 text-sm text-slate-100 placeholder-slate-400 border border-slate-700 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Mobile Expanded Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-slate-800 space-y-2">
            {/* Mobile Google Auth Banner */}
            {user ? (
              <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    onChangeView('account');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 min-w-0 text-left"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full shrink-0"
                    />
                  ) : (
                    <UserIcon className="w-5 h-5 text-orange-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {profile?.displayName || user.displayName}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                  </div>
                </button>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg bg-slate-700 text-slate-200 hover:text-white text-xs flex items-center gap-1 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Out</span>
                </button>
              </div>
            ) : (
              <div className="pb-1">
                <GoogleSignInButton
                  onClick={() => {
                    loginWithGoogle();
                    setMobileMenuOpen(false);
                  }}
                  disabled={authLoading}
                  label="Sign in with Google Email"
                  className="w-full"
                />
              </div>
            )}

            <div className="px-2 py-2 bg-slate-800/80 rounded-lg border border-slate-700">
              <div className="text-[11px] text-slate-400 uppercase font-semibold mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-orange-400" /> Locality:
              </div>
              <select
                value={selectedLocality}
                onChange={(e) => onSelectLocality(e.target.value)}
                className="w-full bg-slate-900 text-slate-200 text-xs py-1.5 px-2 rounded border border-slate-700 focus:outline-none"
              >
                {GREATER_NOIDA_LOCALITIES.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                onChangeView('home');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                activeView === 'home' ? 'bg-orange-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => {
                onChangeView('catalogue');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                activeView === 'catalogue' ? 'bg-orange-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Hardware Catalogue
            </button>
            <button
              onClick={() => {
                onChangeView('tracking');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                activeView === 'tracking' ? 'bg-orange-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Track Active Orders
            </button>
            <button
              onClick={() => {
                onChangeView('account');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                activeView === 'account' ? 'bg-orange-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              My Account & Addresses
            </button>
            <button
              onClick={() => {
                onOpenEnquiry();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-amber-300 hover:bg-slate-800 flex items-center justify-between"
            >
              <span>Can't Find Your Hardware?</span>
              <span className="text-xs text-amber-400">Request</span>
            </button>
            <button
              onClick={() => {
                onChangeView('admin');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between ${
                activeView === 'admin' ? 'bg-slate-800 text-orange-400' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>Business Admin Dashboard</span>
              <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                {isAdmin ? 'Admin' : 'Protected'}
              </span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
