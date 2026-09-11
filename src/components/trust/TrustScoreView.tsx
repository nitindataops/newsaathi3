import React from 'react';
import {
  ShieldCheck,
  Star,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Award,
  Lock,
  ThumbsUp,
  UserCheck,
} from 'lucide-react';
import { LanguageCode } from '../../types';
import {
  computeFarmerTrustScore,
  TrustScoreBreakdown,
} from '../../services/trustScoreService';
import { FarmerProfile } from '../../types/farmer';

interface TrustScoreViewProps {
  farmerProfile?: FarmerProfile;
  currentLanguage: LanguageCode;
}

export const TrustScoreView: React.FC<TrustScoreViewProps> = ({
  farmerProfile,
  currentLanguage,
}) => {
  const isHindi = currentLanguage === 'hi';
  const trust: TrustScoreBreakdown = computeFarmerTrustScore(farmerProfile);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Hero */}
      <div className="rounded-3xl bg-linear-to-br from-[#245C3A] via-[#1E4D31] to-[#122E1D] text-white p-6 sm:p-8 shadow-xl relative overflow-hidden text-center sm:text-left">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-[#D6A63A]/20 blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#D6A63A] text-xs font-bold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isHindi ? 'पारदर्शी किसान विश्वसनीयता सूचकांक' : 'Verified Trust Score Index'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black mb-2 text-white">
              {isHindi ? 'आपका किसान ट्रस्ट स्कोर' : 'Your Kisan Trust Score'}
            </h1>
            <p className="text-sm text-[#EEF3E8] leading-relaxed">
              {isHindi
                ? 'समय पर डिलीवरी, पारदर्शी वजन, शून्य-विवाद और डिजिटल सत्यापन पर आधारित प्रामाणिक स्कोर। उच्च स्कोर से खरीदार आपको प्राथमिकता और बेहतर मूल्य देते हैं।'
                : 'Objective rating driven by dispute-free escrow deliveries, accurate harvest grading, and land record authentication. High scores unlock priority buyer bidding.'}
            </p>
          </div>

          {/* Big Score Circle */}
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-center shrink-0 min-w-44 shadow-lg">
            <span className="text-[10px] uppercase font-bold text-[#D6A63A] block mb-1">
              {isHindi ? 'वर्तमान स्कोर' : 'Current Score'}
            </span>
            <div className="text-4xl sm:text-5xl font-black font-serif text-white mb-1">
              {trust.score}<span className="text-xl text-white/70">/100</span>
            </div>
            <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#D6A63A] text-[#26332B]">
              {trust.tier}
            </span>
          </div>
        </div>
      </div>

      {/* Trust Score Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#EEF3E8] shadow-xs text-center">
          <span className="text-[10px] uppercase font-bold text-[#68736B] block mb-1">
            {isHindi ? 'पूर्ण सौदे' : 'Completed Deals'}
          </span>
          <span className="text-xl font-black text-[#245C3A]">{trust.completedOrdersCount}</span>
          <span className="text-[10px] text-[#68736B] block mt-0.5">{trust.totalTransactions} कुल सौदों में</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#EEF3E8] shadow-xs text-center">
          <span className="text-[10px] uppercase font-bold text-[#68736B] block mb-1">
            {isHindi ? 'पूर्ति दर' : 'Fulfillment Rate'}
          </span>
          <span className="text-xl font-black text-[#245C3A]">{trust.fulfillmentRatePercent}%</span>
          <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">उत्कृष्ट (Excellent)</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#EEF3E8] shadow-xs text-center">
          <span className="text-[10px] uppercase font-bold text-[#68736B] block mb-1">
            {isHindi ? 'विवाद दर' : 'Dispute Rate'}
          </span>
          <span className="text-xl font-black text-[#26332B]">{trust.disputeRatePercent}%</span>
          <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">शून्य विवाद (0 Disputes)</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#EEF3E8] shadow-xs text-center">
          <span className="text-[10px] uppercase font-bold text-[#68736B] block mb-1">
            {isHindi ? 'औसत रेटिंग' : 'Buyer Rating'}
          </span>
          <div className="flex items-center justify-center gap-1 text-xl font-black text-[#D6A63A]">
            <span>{trust.ratingStars}</span>
            <Star className="w-4 h-4 fill-[#D6A63A] text-[#D6A63A]" />
          </div>
          <span className="text-[10px] text-[#68736B] block mt-0.5">{trust.ratingsCount} समीक्षाएं</span>
        </div>
      </div>

      {/* Highlights & Verification Badges */}
      <div className="bg-white rounded-3xl border border-[#EEF3E8] p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#68736B] mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#245C3A]" />
            <span>{isHindi ? 'स्कोर के सकारात्मक घटक (Trust Signals)' : 'Verified Trust Highlights'}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {trust.positiveHighlights.map((h, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#FBFAF4] border border-[#EEF3E8] text-xs font-semibold text-[#26332B]"
              >
                <div className="w-6 h-6 rounded-full bg-[#5F8F45]/20 text-[#245C3A] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Assurance */}
        <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#EEF3E8] flex items-start gap-3 text-xs text-[#68736B]">
          <Lock className="w-5 h-5 text-[#245C3A] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-[#26332B] mb-0.5">
              {isHindi ? 'गोपनीयता सुरक्षा गारंटी' : 'Privacy & Data Protection'}
            </h4>
            <p className="leading-relaxed text-[11px]">
              {isHindi
                ? 'ट्रस्ट स्कोर केवल आपके लेन-देन व्यवहार और विश्वसनीयता को प्रदर्शित करता है। आपका बैंक खाता नंबर, आधार संख्या या अन्य निजी वित्तीय विवरण कभी किसी के साथ साझा नहीं किए जाते।'
                : 'Trust scores reflect operational reliability and dispute-free trade. Personal bank identifiers, unmasked Aadhaar credentials, and sensitive private records are strictly encrypted.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
