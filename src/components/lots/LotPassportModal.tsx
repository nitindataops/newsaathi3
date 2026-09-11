import React from 'react';
import {
  X,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Printer,
  Download,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Award,
  ExternalLink,
} from 'lucide-react';
import { CropLotPassport } from '../../services/cropLotPassportService';
import { LanguageCode } from '../../types';

interface LotPassportModalProps {
  passport: CropLotPassport | null;
  onClose: () => void;
  currentLanguage: LanguageCode;
}

export const LotPassportModal: React.FC<LotPassportModalProps> = ({
  passport,
  onClose,
  currentLanguage,
}) => {
  if (!passport) return null;
  const isHindi = currentLanguage === 'hi';

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Crop Lot Passport - ${passport.lotId}`,
          text: `Verified Agricultural Lot: ${passport.cropDetails.name} (${passport.cropDetails.quantityKg} kg) by ${passport.farmer.name}. Verified by Kisan Saathi.`,
          url: passport.shareableUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(passport.shareableUrl);
      alert(isHindi ? 'पासपोर्ट लिंक कॉपी हो गया!' : 'Lot Passport link copied to clipboard!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#EEF3E8] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div className="bg-linear-to-r from-[#245C3A] via-[#1E4D31] to-[#122E1D] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#D6A63A] text-[#26332B] font-black text-[10px] uppercase tracking-wider">
              {isHindi ? 'डिजिटल लॉट पासपोर्ट' : 'Digital Crop Lot Passport'}
            </span>
            <span className="text-xs text-[#EEF3E8] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D6A63A]" />
              <span>{isHindi ? 'सत्यापित अभिलेख' : 'Cryptographically Verified'}</span>
            </span>
          </div>

          <h2 className="text-2xl font-serif font-black tracking-tight text-white">
            {passport.lotId}
          </h2>
          <p className="text-xs text-[#EEF3E8]/80 mt-1">
            {passport.cropDetails.name} • {passport.cropDetails.variety}
          </p>
        </div>

        {/* Passport Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* QR Code & Fast Verification Card */}
          <div className="p-4 rounded-3xl bg-[#FBFAF4] border border-[#EEF3E8] flex flex-col sm:flex-row items-center gap-6">
            <div className="p-2 bg-white rounded-2xl border border-[#EEF3E8] shadow-xs shrink-0 text-center">
              <img
                src={passport.qrCodeSvgDataUri}
                alt="Lot Verification QR Code"
                className="w-36 h-36 mx-auto rounded-xl"
              />
              <span className="text-[10px] font-bold text-[#68736B] mt-1 block">
                {isHindi ? 'स्कैन करें' : 'Scan to Verify'}
              </span>
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{passport.qualityCertificate.status}</span>
              </div>
              <h3 className="text-lg font-bold font-serif text-[#26332B]">
                {passport.qualityCertificate.grade}
              </h3>
              <p className="text-xs text-[#68736B] leading-relaxed">
                {isHindi
                  ? 'यह क्यूआर कोड किसी भी स्मार्टफोन कैमरे से स्कैन करने पर किसान पहचान, भूमि सत्यापन और एआई गुणवत्ता प्रमाणपत्र प्रदर्शित करता है।'
                  : 'Tamper-proof digital credential verifying farmer ownership, land records, APMC test parameters, and instant escrow settlement.'}
              </p>
              <p className="text-[11px] font-mono text-[#245C3A] font-bold">
                {passport.shareableUrl}
              </p>
            </div>
          </div>

          {/* Key Lot Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Farmer Identity Box */}
            <div className="p-4 rounded-2xl bg-white border border-[#EEF3E8] space-y-2">
              <span className="text-[10px] uppercase font-bold text-[#68736B] block">
                {isHindi ? 'किसान विवरण' : 'Producer & Origin'}
              </span>
              <p className="text-sm font-bold text-[#26332B]">{passport.farmer.name}</p>
              <p className="text-xs text-[#68736B]">
                ID: {passport.farmer.farmerId}
              </p>
              <p className="text-xs text-[#68736B] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#5F8F45]" />
                <span>
                  {passport.farmer.village}, {passport.farmer.tehsil}, {passport.farmer.district}
                </span>
              </p>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#5F8F45]/15 text-[#245C3A] font-bold">
                {passport.farmer.verificationBadge}
              </span>
            </div>

            {/* Harvest & Storage Box */}
            <div className="p-4 rounded-2xl bg-white border border-[#EEF3E8] space-y-2">
              <span className="text-[10px] uppercase font-bold text-[#68736B] block">
                {isHindi ? 'लॉट परिमाण व गोदाम' : 'Lot Specs & Godown'}
              </span>
              <p className="text-sm font-black text-[#245C3A]">
                {passport.cropDetails.quantityKg.toLocaleString('en-IN')} kg ({passport.cropDetails.quantityQuintals} Quintals)
              </p>
              <p className="text-xs text-[#68736B] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#5F8F45]" />
                <span>
                  {isHindi ? 'कटाई तिथि:' : 'Harvest Date:'} {passport.cropDetails.harvestDate}
                </span>
              </p>
              <p className="text-xs text-[#68736B]">
                {isHindi ? 'गोदाम:' : 'Facility:'} {passport.cropDetails.storageFacility}
              </p>
              <p className="text-xs font-bold text-[#26332B]">
                {isHindi ? 'अपेक्षित भाव:' : 'Ask Rate:'} ₹{passport.pricingAndListing.askingPriceKg}/kg (₹
                {passport.pricingAndListing.totalLotValue.toLocaleString('en-IN')})
              </p>
            </div>
          </div>

          {/* Quality Audit Metrics */}
          <div className="p-4 rounded-2xl bg-[#FBFAF4] border border-[#EEF3E8] space-y-3">
            <span className="text-[10px] uppercase font-bold text-[#68736B] block">
              {isHindi ? 'प्रयोगशाला व विजन परीक्षण परिणाम' : 'Certified Laboratory Metrics'}
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-[#EEF3E8]">
                <span className="text-[10px] text-[#68736B] block mb-0.5">{isHindi ? 'नमी' : 'Moisture'}</span>
                <span className="font-bold text-[#26332B]">{passport.qualityCertificate.moisturePercent}%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#EEF3E8]">
                <span className="text-[10px] text-[#68736B] block mb-0.5">{isHindi ? 'दाना एकरूपता' : 'Uniformity'}</span>
                <span className="font-bold text-[#245C3A]">{passport.qualityCertificate.grainUniformity}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#EEF3E8]">
                <span className="text-[10px] text-[#68736B] block mb-0.5">{isHindi ? 'ट्रस्ट स्कोर' : 'Trust Score'}</span>
                <span className="font-bold text-[#D6A63A]">{passport.farmer.trustScore}/100</span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#245C3A] text-white text-xs font-bold hover:bg-[#1B432B] transition-colors shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              <span>{isHindi ? 'खरीदार को शेयर करें' : 'Share QR with Buyer'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-3 rounded-2xl border border-[#EEF3E8] bg-[#FBFAF4] hover:bg-white text-xs font-bold text-[#26332B] transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-[#68736B]" />
              <span>{isHindi ? 'प्रिंट करें' : 'Print'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
