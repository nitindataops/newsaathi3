import React, { useState } from 'react';
import {
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  Warehouse,
  AlertCircle,
  HelpCircle,
  Scale,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { CropListing, FarmerDashboardTab } from '../../types/farmer';
import { LanguageCode } from '../../types';
import {
  calculateSmartSellRecommendation,
  SmartSellRecommendation,
  SMART_SELL_DISCLAIMER_HI,
  SMART_SELL_DISCLAIMER_EN,
} from '../../services/smartSellService';

interface SmartSellRecommendationViewProps {
  crops: CropListing[];
  onSelectTab?: (tab: FarmerDashboardTab) => void;
  onOpenSellModal?: () => void;
  currentLanguage: LanguageCode;
}

export const SmartSellRecommendationView: React.FC<SmartSellRecommendationViewProps> = ({
  crops,
  onSelectTab,
  onOpenSellModal,
  currentLanguage,
}) => {
  const isHindi = currentLanguage === 'hi';

  const defaultCrop = crops[0] || {
    id: 'crop-default',
    name: 'Wheat (गेहूं)',
    variety: 'HD-3086 Sharbati',
    quantityKg: 6000,
    currentMandiPrice: 28,
    expectedPrice: 31,
  };

  const [selectedCropId, setSelectedCropId] = useState<string>(defaultCrop.id);
  const selectedCrop = crops.find((c) => c.id === selectedCropId) || defaultCrop;

  const [quantityKg, setQuantityKg] = useState<number>(selectedCrop.quantityKg || 5000);
  const [currentRate, setCurrentRate] = useState<number>(selectedCrop.currentMandiPrice || 28);
  const [hasStorage, setHasStorage] = useState<boolean>(true);

  // MSP benchmark reference per crop
  const getMsp = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('wheat') || n.includes('gehu')) return 22.75;
    if (n.includes('chana') || n.includes('gram')) return 54.4;
    if (n.includes('rice') || n.includes('dhan')) return 22.03;
    if (n.includes('mustard') || n.includes('sarson')) return 56.5;
    return 24;
  };

  const recommendation: SmartSellRecommendation = calculateSmartSellRecommendation(
    selectedCrop.name,
    selectedCrop.variety,
    quantityKg,
    currentRate,
    getMsp(selectedCrop.name),
    hasStorage
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="rounded-3xl bg-linear-to-br from-[#1B432B] via-[#245C3A] to-[#122E1D] text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-[#D6A63A]/20 blur-3xl" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#D6A63A] text-xs font-bold mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isHindi ? 'निर्णय समर्थन मॉड्यूल' : 'Decision Support Engine'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black mb-2 text-white">
            {isHindi ? 'स्मार्ट "अभी बेचें या रोकें" अनुशंसा' : 'Smart "Sell Now or Wait" Recommendation'}
          </h1>
          <p className="text-sm text-[#EEF3E8] leading-relaxed">
            {isHindi
              ? 'मंडी के वर्तमान भाव, ऐतिहासिक आवक चक्र, खरीदार मांग और गोदाम खर्च के सटीक गणित पर आधारित निर्णय। जोखिम कम करें, मुनाफा अधिकतम करें।'
              : 'Empowering farmers with objective, data-driven selling strategies based on real-time APMC mandi curves, seasonal arrival indices, and warehouse holding economics.'}
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Select crop & parameters */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-[#EEF3E8] p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#26332B] uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#5F8F45]" />
              <span>{isHindi ? 'फसल व मात्रा चुनें' : 'Select Crop & Parameters'}</span>
            </h3>

            {/* Crop Selector */}
            <div>
              <label className="text-xs font-semibold text-[#68736B] block mb-1.5">
                {isHindi ? 'फसल का चयन करें:' : 'Choose Crop Lot:'}
              </label>
              <select
                value={selectedCropId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedCropId(id);
                  const c = crops.find((item) => item.id === id);
                  if (c) {
                    setQuantityKg(c.quantityKg || 5000);
                    setCurrentRate(c.currentMandiPrice || 28);
                  }
                }}
                className="w-full p-2.5 rounded-xl border border-[#EEF3E8] text-xs font-semibold text-[#26332B] bg-[#FBFAF4] focus:outline-hidden focus:border-[#245C3A]"
              >
                {crops.length > 0 ? (
                  crops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.quantityKg} kg) - ₹{c.currentMandiPrice}/kg
                    </option>
                  ))
                ) : (
                  <option value="crop-default">Wheat (गेहूं) - 6000 kg</option>
                )}
              </select>
            </div>

            {/* Quantity Slider / Input */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-[#68736B]">{isHindi ? 'मात्रा (किग्रा):' : 'Lot Quantity (Kg):'}</span>
                <span className="text-[#245C3A] font-bold">
                  {quantityKg.toLocaleString('en-IN')} kg ({(quantityKg / 100).toFixed(1)} Qtl)
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={quantityKg}
                onChange={(e) => setQuantityKg(Number(e.target.value))}
                className="w-full accent-[#245C3A]"
              />
            </div>

            {/* Mandi Rate Slider / Input */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-[#68736B]">{isHindi ? 'वर्तमान मंडी भाव:' : 'Current Spot Rate:'}</span>
                <span className="text-[#D6A63A] font-bold">₹{currentRate} / kg (₹{currentRate * 100}/Qtl)</span>
              </div>
              <input
                type="range"
                min="15"
                max="90"
                step="0.5"
                value={currentRate}
                onChange={(e) => setCurrentRate(Number(e.target.value))}
                className="w-full accent-[#D6A63A]"
              />
            </div>

            {/* Storage Facility Checkbox */}
            <div className="pt-2 border-t border-[#EEF3E8]">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#26332B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasStorage}
                  onChange={(e) => setHasStorage(e.target.checked)}
                  className="rounded-md text-[#245C3A] accent-[#245C3A] w-4 h-4"
                />
                <span>{isHindi ? 'स्थानीय प्रमाणित गोदाम/वेयरहाउस उपलब्ध है' : 'Safe Warehouse / Storage Available'}</span>
              </label>
            </div>
          </div>

          {/* Market Signals Card */}
          <div className="bg-[#FBFAF4] rounded-2xl border border-[#EEF3E8] p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-[#68736B] uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#245C3A]" />
              <span>{isHindi ? 'बाजार संकेत (Live APMC Signals)' : 'Market Signals'}</span>
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#EEF3E8]">
                <span className="text-[#68736B]">{isHindi ? 'खरीदार मांग स्तर:' : 'Buyer Demand:'}</span>
                <span className="font-bold text-[#245C3A]">{recommendation.marketSignals.buyerDemandLevel}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#EEF3E8]">
                <span className="text-[#68736B]">{isHindi ? '३०-दिवसीय मूल्य रुझान:' : '30-Day Trend:'}</span>
                <span className="font-bold text-[#D6A63A]">{recommendation.marketSignals.priceTrend30Days}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#EEF3E8]">
                <span className="text-[#68736B]">{isHindi ? 'आवक चक्र स्थिति:' : 'Arrival Cycle:'}</span>
                <span className="font-bold text-[#26332B]">{recommendation.marketSignals.arrivalVolumeTrend}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#EEF3E8]">
                <span className="text-[#68736B]">{isHindi ? 'भंडारण उपयुक्तता:' : 'Storage Risk:'}</span>
                <span className="font-bold text-[#5F8F45]">{recommendation.marketSignals.storageSuitability}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: The Dynamic Decision Card */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-[#EEF3E8] p-6 sm:p-8 shadow-sm space-y-6">
            {/* The Badge: SELL NOW / WAIT / PARTIAL SELL */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EEF3E8]">
              <div>
                <span className="text-xs font-bold text-[#68736B] uppercase tracking-wider block mb-1">
                  {isHindi ? 'सिफारिश परिणाम (AI Recommendation)' : 'Algorithm Verdict'}
                </span>
                <h2 className="text-2xl font-serif font-bold text-[#26332B]">
                  {recommendation.title}
                </h2>
              </div>

              {/* Big Decision Badge */}
              <div
                className={`px-5 py-2.5 rounded-2xl text-center font-black text-sm tracking-wider uppercase border shadow-xs ${
                  recommendation.decision === 'SELL NOW'
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : recommendation.decision === 'WAIT'
                    ? 'bg-blue-600 text-white border-blue-700'
                    : 'bg-amber-500 text-white border-amber-600'
                }`}
              >
                {recommendation.decision}
              </div>
            </div>

            {/* Headline Summary */}
            <div className="p-4 rounded-2xl bg-[#FBFAF4] border border-[#EEF3E8]">
              <p className="text-sm font-semibold text-[#26332B] leading-relaxed">
                {recommendation.headlineSummary}
              </p>
            </div>

            {/* Key Justification Points */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#68736B] mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#245C3A]" />
                <span>{isHindi ? 'निर्णय के मुख्य आधार (Economic & Market Reasons)' : 'Key Decision Reasons'}</span>
              </h4>
              <div className="space-y-2.5">
                {recommendation.reasons.map((reason, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-[#F8F9FA] border border-[#EEF3E8] text-xs text-[#26332B]"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#245C3A] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed font-medium">{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Projected Economics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-[#FBFAF4] border border-[#EEF3E8]">
                <span className="text-[10px] uppercase font-bold text-[#68736B] block mb-1">
                  {isHindi ? 'अभी हाजिर बिक्री' : 'Spot Revenue Now'}
                </span>
                <span className="text-lg font-black text-[#26332B]">
                  ₹{recommendation.projectedMetrics.spotRevenue.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-[#68736B] block mt-1">
                  ₹{currentRate}/kg @ {quantityKg} kg
                </span>
              </div>

              {recommendation.projectedMetrics.projectedFutureRevenue && (
                <div className="p-4 rounded-2xl bg-[#E8F3E4] border border-[#5F8F45]/30">
                  <span className="text-[10px] uppercase font-bold text-[#245C3A] block mb-1">
                    {isHindi ? 'अनुमानित भविष्य प्राप्ति' : 'Projected Value Later'}
                  </span>
                  <span className="text-lg font-black text-[#245C3A]">
                    ₹{recommendation.projectedMetrics.projectedFutureRevenue.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-[#245C3A] block mt-1">
                    +{recommendation.projectedMetrics.projectedAppreciationPercent}% {isHindi ? 'शुद्ध वृद्धि' : 'Net Gain'}
                  </span>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-[#FBFAF4] border border-[#EEF3E8]">
                <span className="text-[10px] uppercase font-bold text-[#68736B] block mb-1">
                  {isHindi ? 'गोदाम खर्च (प्रति माह)' : 'Holding Cost/Mo'}
                </span>
                <span className="text-lg font-black text-[#8C6212]">
                  ₹{recommendation.projectedMetrics.estimatedStorageCostPerMonth?.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-[#68736B] block mt-1">
                  ₹35 / Qtl {isHindi ? 'प्रमाणित गोदाम' : 'Certified CWC'}
                </span>
              </div>
            </div>

            {/* Split Breakdown for Partial Sell */}
            {recommendation.projectedMetrics.recommendedSplitRatio && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
                <h5 className="font-bold text-xs flex items-center gap-1.5">
                  <PieChart className="w-4 h-4 text-amber-700" />
                  <span>{isHindi ? 'सुझाया गया आंशिक विभाजन (Partial Sell Strategy)' : 'Recommended Split Strategy'}</span>
                </h5>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-amber-200">
                    <span className="text-amber-800 font-bold block">
                      {isHindi ? '४०% अभी बेचें:' : 'Sell 40% Now:'}
                    </span>
                    <span className="font-extrabold text-[#26332B]">
                      {recommendation.projectedMetrics.recommendedSplitRatio.sellNowQuantityKg} kg (₹
                      {(recommendation.projectedMetrics.recommendedSplitRatio.sellNowQuantityKg * currentRate).toLocaleString('en-IN')})
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-amber-200">
                    <span className="text-emerald-800 font-bold block">
                      {isHindi ? '६०% रोकें:' : 'Hold 60% in Storage:'}
                    </span>
                    <span className="font-extrabold text-[#245C3A]">
                      {recommendation.projectedMetrics.recommendedSplitRatio.holdQuantityKg} kg (₹
                      {(recommendation.projectedMetrics.recommendedSplitRatio.holdQuantityKg * Math.round(currentRate * 1.12)).toLocaleString('en-IN')})
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Disclaimer Requirement (MANDATORY RULE) */}
            <div className="p-3.5 rounded-2xl bg-[#FFF9EA] border border-[#D6A63A]/30 flex items-start gap-2.5 text-[11px] text-[#8C6212] leading-relaxed">
              <Info className="w-4 h-4 text-[#D6A63A] shrink-0 mt-0.5" />
              <p>
                <strong>{isHindi ? 'महत्वपूर्ण अस्वीकरण: ' : 'Official Disclaimer: '}</strong>
                {isHindi ? SMART_SELL_DISCLAIMER_HI : SMART_SELL_DISCLAIMER_EN}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {recommendation.decision === 'SELL NOW' || recommendation.decision === 'PARTIAL SELL' ? (
                <button
                  onClick={() => {
                    if (onSelectTab) onSelectTab('smart-matches');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-[#245C3A] text-white text-xs font-bold hover:bg-[#1B432B] transition-all shadow-md"
                >
                  <span>{isHindi ? 'सर्वोत्तम खरीदार मैच देखें (Smart Matches)' : 'View Matched Buyers for this Lot'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (onSelectTab) onSelectTab('storage-processing');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-[#245C3A] text-white text-xs font-bold hover:bg-[#1B432B] transition-all shadow-md"
                >
                  <Warehouse className="w-4 h-4" />
                  <span>{isHindi ? 'नजदीकी वेयरहाउस में स्लॉट बुक करें' : 'Book Warehouse Storage Slot'}</span>
                </button>
              )}

              {onSelectTab && (
                <button
                  onClick={() => onSelectTab('market-prices')}
                  className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-[#FBFAF4] border border-[#EEF3E8] text-[#26332B] hover:bg-white text-xs font-bold transition-all"
                >
                  <BarChart3 className="w-4 h-4 text-[#68736B]" />
                  <span>{isHindi ? 'लाइव मंडी चार्ट देखें' : 'View Live Mandi Curves'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
