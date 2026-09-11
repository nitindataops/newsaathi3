import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock,
  CheckCircle2,
  DollarSign,
  Phone,
  Send,
  Building,
  UserCheck,
  ChevronRight,
  HelpCircle,
  Truck,
} from 'lucide-react';
import { BuyerMatch, CropListing, FarmerDashboardTab } from '../../types/farmer';
import { LanguageCode } from '../../types';
import { computeSmartMatches, SmartMatchResult } from '../../services/smartMatchingService';

interface SmartMatchesViewProps {
  crops: CropListing[];
  buyers: BuyerMatch[];
  onOpenMakeOffer?: (buyer: BuyerMatch) => void;
  onOpenContactBuyer?: (buyer: BuyerMatch) => void;
  onOpenBuyerDetails?: (buyer: BuyerMatch) => void;
  onSelectTab?: (tab: FarmerDashboardTab) => void;
  currentLanguage: LanguageCode;
}

export const SmartMatchesView: React.FC<SmartMatchesViewProps> = ({
  crops,
  buyers,
  onOpenMakeOffer,
  onOpenContactBuyer,
  onOpenBuyerDetails,
  onSelectTab,
  currentLanguage,
}) => {
  const isHindi = currentLanguage === 'hi';
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('all');
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(100);

  // Compute matches
  const allMatches: SmartMatchResult[] = useMemo(() => {
    return computeSmartMatches(crops, buyers);
  }, [crops, buyers]);

  // Filtered matches
  const filteredMatches = useMemo(() => {
    return allMatches.filter((m) => {
      if (selectedCropFilter !== 'all' && m.crop.id !== selectedCropFilter) return false;
      if (m.distanceKm > maxDistanceKm) return false;
      return true;
    });
  }, [allMatches, selectedCropFilter, maxDistanceKm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="rounded-3xl bg-linear-to-br from-[#245C3A] via-[#1E4D31] to-[#122E1D] text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-[#D6A63A]/20 blur-3xl" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#D6A63A] text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isHindi ? 'इंटेलिजेंट मैचिंग सिस्टम' : 'AI Buyer-Farmer Matchmaker'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black mb-2 text-white">
            {isHindi ? 'स्मार्ट खरीदार मिलान (Smart Matches)' : 'Smart Verified Buyer Matches'}
          </h1>
          <p className="text-sm text-[#EEF3E8] leading-relaxed">
            {isHindi
              ? 'फसल प्रजाति, अपेक्षित दर, नजदीकी दूरी, लॉट मात्रा और खरीदार विश्वसनीयता स्कोर को मिलाकर तैयार किया गया सर्वोत्तम मैच। सर्वाधिक उपयुक्त खरीदार पहले दिखाए जाते हैं।'
              : 'Multi-variable ranking algorithm combining real-time demand, logistics proximity, price tolerance, and historical escrow settlement records.'}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#EEF3E8] p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-[#68736B] uppercase tracking-wider">
            {isHindi ? 'फसल अनुसार छानें:' : 'Filter by Crop:'}
          </label>
          <select
            value={selectedCropFilter}
            onChange={(e) => setSelectedCropFilter(e.target.value)}
            className="p-2 rounded-xl border border-[#EEF3E8] text-xs font-semibold text-[#26332B] bg-[#FBFAF4] focus:outline-hidden"
          >
            <option value="all">{isHindi ? 'सभी फसलें (All Crops)' : 'All Registered Crops'}</option>
            {crops.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.quantityKg} kg)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#68736B] font-semibold">
            {isHindi ? 'अधिकतम दूरी:' : 'Max Distance:'} <strong>{maxDistanceKm} km</strong>
          </span>
          <input
            type="range"
            min="10"
            max="150"
            step="10"
            value={maxDistanceKm}
            onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
            className="accent-[#245C3A] w-32"
          />
        </div>

        <div className="text-xs text-[#68736B]">
          {isHindi ? 'कुल उपलब्ध मैच:' : 'Total Ranked Matches:'}{' '}
          <strong className="text-[#245C3A] font-bold">{filteredMatches.length}</strong>
        </div>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {filteredMatches.length > 0 ? (
          filteredMatches.map((match, idx) => (
            <div
              key={`${match.buyer.id}-${match.crop.id}`}
              className="bg-white rounded-3xl border border-[#EEF3E8] p-6 shadow-xs hover:shadow-md transition-all relative overflow-hidden"
            >
              {/* Recommended Top Ribbon */}
              {match.isRecommended && (
                <div className="absolute top-0 right-0 bg-[#245C3A] text-white text-[10px] uppercase tracking-wider font-extrabold py-1 px-4 rounded-bl-2xl flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-3 h-3 text-[#D6A63A]" />
                  <span>{isHindi ? 'शीर्ष अनुशंसित' : 'Top Recommendation'}</span>
                </div>
              )}

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Left: Score + Buyer Details */}
                <div className="space-y-3 max-w-xl">
                  {/* Match Percentage Pill */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#5F8F45]/15 border border-[#5F8F45]/30">
                    <span className="text-base font-black text-[#245C3A]">
                      {match.matchScorePercent}% Match
                    </span>
                    <span className="text-xs font-semibold text-[#245C3A] border-l border-[#5F8F45]/40 pl-2">
                      {match.matchHeadline.split('–').slice(1).join('–').trim()}
                    </span>
                  </div>

                  {/* Buyer Title & Verification */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold font-serif text-[#26332B]">
                        {match.buyer.name}
                      </h3>
                      {match.buyer.verified && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#245C3A]/10 text-[#245C3A] border border-[#245C3A]/20">
                          <ShieldCheck className="w-3 h-3" />
                          <span>{isHindi ? 'सत्यापित खरीदार' : 'Verified Escrow'}</span>
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#FBFAF4] border border-[#EEF3E8] text-[#68736B] font-medium">
                        {match.buyer.type || (isHindi ? 'सीधा खरीदार' : 'Direct Buyer')}
                      </span>
                    </div>

                    <p className="text-xs text-[#68736B] flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#5F8F45]" />
                      <span>{match.buyer.location}</span>
                      <span>•</span>
                      <strong>{match.distanceKm} km {isHindi ? 'दूरी' : 'away'}</strong>
                    </p>
                  </div>

                  {/* Highlight Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {match.matchHighlights.map((h, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#FBFAF4] border border-[#EEF3E8] text-[#26332B] flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-[#5F8F45]" />
                        <span>{h}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Center / Right: Economics & Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-[#EEF3E8]">
                  <div className="text-left lg:text-right">
                    <span className="text-[10px] uppercase font-bold text-[#68736B] block">
                      {isHindi ? 'प्रस्तावित खरीद दर' : 'Offered Buying Rate'}
                    </span>
                    <div className="flex items-baseline gap-1 lg:justify-end">
                      <span className="text-2xl font-black text-[#245C3A]">
                        ₹{match.offeredPriceKg}
                      </span>
                      <span className="text-xs font-semibold text-[#68736B]">/ kg</span>
                    </div>
                    <span
                      className={`text-[11px] font-bold block mt-0.5 ${
                        match.priceDeltaPercent >= 0 ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {match.priceDeltaPercent >= 0
                        ? `+${match.priceDeltaPercent}% ${isHindi ? 'आपकी मांग से अधिक' : 'above expected'}`
                        : `${match.priceDeltaPercent}% ${isHindi ? 'अपेक्षित से' : 'below expected'}`}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {onOpenMakeOffer && (
                      <button
                        onClick={() => onOpenMakeOffer(match.buyer)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#245C3A] text-white text-xs font-bold hover:bg-[#1B432B] transition-colors shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isHindi ? 'ऑफ़र भेजें' : 'Make Offer'}</span>
                      </button>
                    )}

                    {onOpenContactBuyer && (
                      <button
                        onClick={() => onOpenContactBuyer(match.buyer)}
                        className="px-3 py-2.5 rounded-xl border border-[#EEF3E8] bg-[#FBFAF4] hover:bg-white text-xs font-bold text-[#26332B] transition-colors"
                        title="Call Buyer"
                      >
                        <Phone className="w-4 h-4 text-[#245C3A]" />
                      </button>
                    )}

                    {onOpenBuyerDetails && (
                      <button
                        onClick={() => onOpenBuyerDetails(match.buyer)}
                        className="px-3 py-2.5 rounded-xl border border-[#EEF3E8] bg-[#FBFAF4] hover:bg-white text-xs font-bold text-[#68736B] transition-colors"
                        title="View Profile"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl border border-[#EEF3E8] p-12 text-center">
            <Search className="w-12 h-12 text-[#68736B] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#26332B] mb-1">
              {isHindi ? 'कोई मैच नहीं मिला' : 'No matches found within criteria'}
            </h3>
            <p className="text-xs text-[#68736B] mb-4">
              {isHindi ? 'कृपया दूरी सीमा बढ़ाएं अथवा अन्य फसल चुनें।' : 'Please broaden your search radius or select all crops.'}
            </p>
            <button
              onClick={() => {
                setSelectedCropFilter('all');
                setMaxDistanceKm(100);
              }}
              className="px-4 py-2 rounded-xl bg-[#245C3A] text-white text-xs font-bold"
            >
              {isHindi ? 'फ़िल्टर रीसेट करें' : 'Reset Filters'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
