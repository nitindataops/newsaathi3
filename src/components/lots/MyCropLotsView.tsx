import React, { useState } from 'react';
import {
  QrCode,
  ShieldCheck,
  Search,
  PlusCircle,
  ExternalLink,
  Calendar,
  Layers,
  Sparkles,
  Award,
  Eye,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { CropListing, FarmerProfile, FarmerDashboardTab } from '../../types/farmer';
import { LanguageCode } from '../../types';
import { createLotPassport, CropLotPassport } from '../../services/cropLotPassportService';
import { LotPassportModal } from './LotPassportModal';

interface MyCropLotsViewProps {
  crops: CropListing[];
  farmerProfile?: FarmerProfile;
  onSelectTab?: (tab: FarmerDashboardTab) => void;
  onOpenAddCropModal?: () => void;
  currentLanguage: LanguageCode;
}

export const MyCropLotsView: React.FC<MyCropLotsViewProps> = ({
  crops,
  farmerProfile,
  onSelectTab,
  onOpenAddCropModal,
  currentLanguage,
}) => {
  const isHindi = currentLanguage === 'hi';
  const [selectedPassport, setSelectedPassport] = useState<CropLotPassport | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const passports: CropLotPassport[] = crops.map((crop, idx) =>
    createLotPassport(crop, farmerProfile, idx + 1)
  );

  const filtered = passports.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.lotId.toLowerCase().includes(q) ||
      p.cropDetails.name.toLowerCase().includes(q) ||
      p.cropDetails.variety.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="rounded-3xl bg-linear-to-br from-[#245C3A] via-[#1E4D31] to-[#122E1D] text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-[#D6A63A]/20 blur-3xl" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#D6A63A] text-xs font-bold mb-3">
            <QrCode className="w-3.5 h-3.5" />
            <span>{isHindi ? 'डिजिटल ट्रेसिबिलिटी पासपोर्ट' : 'Digital Lot Passport Engine'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black mb-2 text-white">
            {isHindi ? 'मेरे डिजिटल फसल लॉट पासपोर्ट' : 'My Digital Crop Lot Passports'}
          </h1>
          <p className="text-sm text-[#EEF3E8] leading-relaxed">
            {isHindi
              ? 'प्रत्येक फसल लॉट हेतु विशिष्ट आईडी (उदा. KS-WHT-2026-001) एवं क्यूआर कोड। खरीदार सीधे स्कैन करके प्रमाणित किसान पहचान, खेत स्थान, गुणवत्ता व एआई ग्रेड सत्यापित कर सकते हैं।'
              : 'Every harvest batch receives a unique cryptographic Lot ID and verifiable QR Passport detailing farmer credentials, geo-tagged origin, moisture indices, and certified AGMARK grades.'}
          </p>
        </div>
      </div>

      {/* Action & Search Bar */}
      <div className="bg-white rounded-2xl border border-[#EEF3E8] p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#68736B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isHindi ? 'लॉट आईडी या फसल खोजें...' : 'Search by Lot ID (e.g. KS-WHT)...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#EEF3E8] text-xs font-medium text-[#26332B] bg-[#FBFAF4] focus:outline-hidden focus:border-[#245C3A]"
          />
        </div>

        {onOpenAddCropModal && (
          <button
            onClick={onOpenAddCropModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#245C3A] text-white text-xs font-bold hover:bg-[#1B432B] transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isHindi ? 'नया लॉट बनाएं' : 'Register New Lot'}</span>
          </button>
        )}
      </div>

      {/* Grid of Lot Passports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((passport) => (
          <div
            key={passport.lotId}
            className="bg-white rounded-3xl border border-[#EEF3E8] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              {/* Card Header: Lot ID + Grade */}
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#EEF3E8]">
                <div>
                  <span className="font-mono text-xs font-extrabold text-[#245C3A] px-2.5 py-1 rounded-lg bg-[#245C3A]/10 border border-[#245C3A]/20">
                    {passport.lotId}
                  </span>
                  <h3 className="text-base font-bold font-serif text-[#26332B] mt-2">
                    {passport.cropDetails.name}
                  </h3>
                  <p className="text-xs text-[#68736B]">{passport.cropDetails.variety}</p>
                </div>

                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {passport.qualityCertificate.grade}
                </span>
              </div>

              {/* QR Preview & Quick Specs */}
              <div className="flex items-center gap-4 py-3">
                <div className="p-1.5 rounded-xl border border-[#EEF3E8] bg-[#FBFAF4] shrink-0">
                  <img
                    src={passport.qrCodeSvgDataUri}
                    alt="QR"
                    className="w-20 h-20 rounded-lg"
                  />
                </div>

                <div className="text-xs space-y-1 text-[#68736B] flex-1">
                  <p className="font-black text-sm text-[#245C3A]">
                    {passport.cropDetails.quantityKg.toLocaleString('en-IN')} kg
                  </p>
                  <p>
                    {isHindi ? 'भाव:' : 'Price:'} <strong>₹{passport.pricingAndListing.askingPriceKg}/kg</strong>
                  </p>
                  <p className="truncate">
                    {isHindi ? 'गोदाम:' : 'Godown:'} {passport.cropDetails.storageFacility}
                  </p>
                </div>
              </div>

              {/* Verified Badges */}
              <div className="flex flex-wrap gap-1 pt-1">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FBFAF4] border border-[#EEF3E8] text-[#26332B] flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3 h-3 text-[#5F8F45]" />
                  <span>{passport.farmer.verificationBadge}</span>
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-[#EEF3E8] flex items-center gap-2">
              <button
                onClick={() => setSelectedPassport(passport)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#245C3A] text-white text-xs font-bold hover:bg-[#1B432B] transition-colors shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isHindi ? 'पासपोर्ट देखें' : 'View Passport'}</span>
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(passport.shareableUrl);
                  alert(isHindi ? 'लॉट लिंक कॉपी हो गया!' : 'Lot link copied to clipboard!');
                }}
                className="p-2.5 rounded-xl border border-[#EEF3E8] bg-[#FBFAF4] hover:bg-white text-xs text-[#26332B] transition-colors"
                title="Copy Link"
              >
                <Share2 className="w-3.5 h-3.5 text-[#68736B]" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal View */}
      <LotPassportModal
        passport={selectedPassport}
        onClose={() => setSelectedPassport(null)}
        currentLanguage={currentLanguage}
      />
    </div>
  );
};
