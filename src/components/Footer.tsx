import React from 'react';
import { Wrench, Database } from 'lucide-react';

interface FooterProps {
  onOpenEnquiry: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenEnquiry, onOpenAdmin }) => {
  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
          {/* Col 1: Brand & Tagline */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="text-lg font-extrabold tracking-tight">QUICKWARE</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Everyday Hardware. Delivered Quickly. Hyperlocal on-demand hardware delivery platform connecting skilled tradespeople, contractors, and households in Greater Noida with verified local retailers.
            </p>
            <div className="text-[11px] text-amber-400 font-semibold bg-amber-400/10 px-2.5 py-1 rounded-md inline-block border border-amber-400/20">
              Greater Noida Beta Market
            </div>
          </div>

          {/* Col 2: Categories & Trades */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">
              Primary Hardware Trades
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>Carpentry & Woodwork (Screws, Hinges, Fevicol)</li>
              <li>Electrical Works (Switches, PVC Tapes, Plugs)</li>
              <li>Plumbing & Sanitary (CPVC Fittings, Teflon, Valves)</li>
              <li>Masonry & Ceiling (Concrete Nails, Wall Plugs)</li>
              <li>Site Hand Tools (Taparia, Stanley, Pye)</li>
            </ul>
          </div>

          {/* Col 3: Greater Noida Network */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">
              Local Retailer Hubs
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>Shree Ganesh Hardware (Sector Alpha 1)</li>
              <li>Verma Sanitary & Hardware (Pari Chowk)</li>
              <li>Gupta Ply & Hardware Mart (Jagat Farm)</li>
              <li>National Tools & Fasteners (Surajpur Site 4)</li>
            </ul>
          </div>

          {/* Col 4: Operations & Cloud Sync */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">
              Operations & Cloud Sync
            </h4>
            <div className="space-y-2 text-slate-400">
              <p>Built as an Entrepreneurship and Innovation Capstone Prototype.</p>
              <div className="pt-1 flex flex-col gap-2">
                <button
                  onClick={onOpenEnquiry}
                  className="text-left text-orange-400 hover:text-orange-300 font-semibold"
                >
                  → Can't Find Your Hardware? Request
                </button>
                <button
                  onClick={onOpenAdmin}
                  className="text-left text-slate-300 hover:text-white font-semibold"
                >
                  → Operations & Admin Console
                </button>
                <div className="text-left text-emerald-400 font-semibold flex items-center gap-1.5 pt-1">
                  <Database className="w-3.5 h-3.5" />
                  <span>Firestore Cloud Database Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} Quickware Platforms India. Prototype Demonstration.
          </div>
          <div className="flex items-center gap-4">
            <span>Greater Noida, Uttar Pradesh</span>
            <span>·</span>
            <span>Local Retail Partnerships Model</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
