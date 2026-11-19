import React from 'react';
import {
  Wrench,
  ShieldCheck,
  Truck,
  Store,
  ArrowRight,
  HardHat,
  Search,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface HeroProps {
  onShopClick: () => void;
  onJobOrderClick: () => void;
  onSearchFocus: () => void;
  selectedLocality: string;
}

export const Hero: React.FC<HeroProps> = ({
  onShopClick,
  onJobOrderClick,
  onSearchFocus,
  selectedLocality,
}) => {
  return (
    <section className="relative bg-slate-900 text-white overflow-hidden border-b border-slate-800">
      {/* Background Subtle Gradient & Glow */}
      <div className="absolute inset-0 bg-radial from-slate-800/40 via-slate-900 to-slate-950 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-14 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-7 space-y-6">
            {/* Target Audience Tagline */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
              <HardHat className="w-3.5 h-3.5" />
              <span>Built for Carpenters, Electricians, Plumbers & Sites</span>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight text-balance">
                Hardware When You Need It.
              </h1>
              <p className="text-base sm:text-lg text-slate-300 max-w-xl font-normal leading-relaxed">
                Find everyday hardware essentials without visiting multiple shops. Order screws, adhesives, tools, and pipe fittings from verified local retailers in Greater Noida.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onShopClick}
                className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-600/25 flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <span>Shop Hardware</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onJobOrderClick}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <Wrench className="w-4 h-4 text-orange-400" />
                <span>Order for My Job</span>
              </button>
            </div>

            {/* Delivery Transparency Disclaimer Notice */}
            <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 p-3.5 text-xs text-slate-300 flex items-start gap-3">
              <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Hyperlocal Delivery Logic: </span>
                Product availability, pricing, and fulfillment schedules depend on the participating local retailer nearest to your site ({selectedLocality.split(',')[0]}). Real stock counts are updated directly by partner stores.
              </div>
            </div>

            {/* Key Value Propositions */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
              <div className="flex items-start gap-2">
                <Store className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">Local Retailers</div>
                  <div className="text-[11px] text-slate-400">Jagat Farm, Alpha 1, Pari Chowk</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">Site Delivery</div>
                  <div className="text-[11px] text-slate-400">Direct to job site or home</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">Genuine Brands</div>
                  <div className="text-[11px] text-slate-400">Taparia, Fevicol, Godrej, Astral</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-800 group">
              <img
                src="/src/assets/images/hero_contractor_hardware_1791888247410.jpg"
                alt="Contractors and tradespeople inspecting hardware fittings"
                className="w-full h-72 sm:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  // Fallback styling if local image path fails
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />

              {/* Scrim Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

              {/* In-Image Floating Trust Badge */}
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                    QW
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Local Hardware Network</div>
                    <div className="text-[11px] text-slate-400">4 Active Partner Stores in Greater Noida</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Live Stock
                  </span>
                  <div className="text-[10px] text-slate-400">Verified inventory</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
