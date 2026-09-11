import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Info,
  HelpCircle,
  FileCheck,
  ChevronRight,
  Eye,
  Layers,
  Award,
} from 'lucide-react';
import { CropListing, FarmerDashboardTab } from '../../types/farmer';
import { LanguageCode } from '../../types';
import {
  analyzeCropPhoto,
  CropHealthAnalysisResult,
  CROP_HEALTH_DISCLAIMER_HI,
  CROP_HEALTH_DISCLAIMER_EN,
} from '../../services/aiCropHealthService';

interface CropHealthAnalysisViewProps {
  crops?: CropListing[];
  onSelectTab?: (tab: FarmerDashboardTab) => void;
  onOpenAddCropModal?: () => void;
  currentLanguage: LanguageCode;
}

export const CropHealthAnalysisView: React.FC<CropHealthAnalysisViewProps> = ({
  crops = [],
  onSelectTab,
  onOpenAddCropModal,
  currentLanguage,
}) => {
  const isHindi = currentLanguage === 'hi';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(
    '/images/crops/kabuli_chana.jpg'
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CropHealthAnalysisResult | null>(null);
  const [selectedCropCategory, setSelectedCropCategory] = useState<string>('wheat');

  const sampleCrops = [
    { id: 'sample-wheat', name: 'Sharbati Wheat', category: 'wheat', img: '/images/indian_farm_landscape.jpg' },
    { id: 'sample-chana', name: 'Kabuli Chana (Pulses)', category: 'chana', img: '/images/crops/kabuli_chana.jpg' },
    { id: 'sample-moong', name: 'Moong Pulses', category: 'chana', img: '/images/crops/moong_pulses.jpg' },
    { id: 'sample-urad', name: 'Urad Pulses', category: 'chana', img: '/images/crops/urad_pulses.jpg' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setSelectedImage(dataUrl);
        runAnalysis(dataUrl, selectedCropCategory);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async (imgUrl: string, hintCategory: string) => {
    setAnalyzing(true);
    try {
      const result = await analyzeCropPhoto(imgUrl, hintCategory);
      setAnalysisResult(result);
    } catch (err) {
      console.error('AI scan error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleChooseSample = (sample: typeof sampleCrops[0]) => {
    setSelectedImage(sample.img);
    setSelectedCropCategory(sample.category);
    runAnalysis(sample.img, sample.category);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl bg-linear-to-br from-[#245C3A] via-[#1E4D31] to-[#143621] text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-[#D6A63A]/20 blur-3xl" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#D6A63A] text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isHindi ? 'एआई फसल स्वास्थ्य एवं गुणवत्ता विश्लेषण' : 'AI Crop Health & Quality Assessment'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black mb-2 text-white">
            {isHindi ? 'फसल की फोटो लें, तुरंत एआई रिपोर्ट पाएं' : 'Instant AI Crop Diagnosis & AGMARK Grade'}
          </h1>
          <p className="text-sm text-[#EEF3E8] leading-relaxed">
            {isHindi
              ? 'फसल की पत्ती, बाली या दाने की स्पष्ट फोटो अपलोड करें। हमारा मल्टीमॉडल एआई विजन मॉडल प्रजाति की पहचान, स्वास्थ्य सूचकांक, संभावित कीट/रोग और गुणवत्ता ग्रेड निर्धारित करता है।'
              : 'Capture or upload grain kernels, crop leaves, or harvested lots. Our computer vision model estimates crop identification, physiological health, stress or pathogen risks, and APMC grade.'}
          </p>
        </div>
      </div>

      {/* Upload / Capture Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Selection & Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-[#EEF3E8] p-5 shadow-xs">
            <h3 className="text-base font-bold text-[#26332B] mb-3 flex items-center justify-between">
              <span>{isHindi ? '१. फोटो अपलोड या कैमरा' : '1. Upload or Capture Photo'}</span>
              <span className="text-xs font-normal text-[#68736B]">{isHindi ? 'उच्च रेजोल्यूशन' : 'High Clarity'}</span>
            </h3>

            {/* Photo Box */}
            <div className="relative rounded-2xl overflow-hidden aspect-4/3 bg-[#F5F2EA] border-2 border-dashed border-[#5F8F45]/30 flex flex-col items-center justify-center p-2 text-center group">
              {selectedImage ? (
                <>
                  <img
                    src={selectedImage}
                    alt="Uploaded Crop"
                    className="w-full h-full object-cover rounded-xl"
                  />
                  {analyzing && (
                    <div className="absolute inset-0 bg-[#1B432B]/80 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                      <RefreshCw className="w-10 h-10 animate-spin text-[#D6A63A] mb-3" />
                      <p className="font-bold text-base font-serif mb-1">
                        {isHindi ? 'एआई स्कैनिंग जारी है...' : 'Scanning Crop Morphology...'}
                      </p>
                      <p className="text-xs text-white/80">
                        {isHindi ? 'दाने की चमक, रोग लक्षण व गुणवत्ता मापी जा रही है' : 'Evaluating grain luster, pathogens & stress signs'}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-6 text-[#68736B]">
                  <Camera className="w-12 h-12 mx-auto text-[#5F8F45] mb-2" />
                  <p className="text-sm font-semibold">{isHindi ? 'यहाँ फोटो खींचें या चुनें' : 'Take photo or upload'}</p>
                  <p className="text-xs text-[#8C988F] mt-1">JPG, PNG up to 10MB</p>
                </div>
              )}
            </div>

            {/* Hidden Input & Action Buttons */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#245C3A] text-white text-xs font-bold hover:bg-[#1B432B] transition-colors shadow-xs"
              >
                <Upload className="w-4 h-4" />
                <span>{isHindi ? 'फोटो अपलोड करें' : 'Upload File'}</span>
              </button>
              <button
                onClick={() => {
                  if (selectedImage) runAnalysis(selectedImage, selectedCropCategory);
                  else fileInputRef.current?.click();
                }}
                disabled={analyzing}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#D6A63A] text-[#26332B] text-xs font-bold hover:bg-[#C29329] transition-colors shadow-xs disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isHindi ? 'पुनः स्कैन करें' : 'Analyze Now'}</span>
              </button>
            </div>

            {/* Sample presets */}
            <div className="mt-5 pt-4 border-t border-[#EEF3E8]">
              <p className="text-xs font-bold text-[#68736B] uppercase tracking-wider mb-2.5">
                {isHindi ? 'या त्वरित डेमो नमूना चुनें:' : 'Or test with sample verified harvests:'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {sampleCrops.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleChooseSample(sample)}
                    className="flex items-center gap-2 p-2 rounded-xl border border-[#EEF3E8] hover:border-[#245C3A]/40 text-left text-xs bg-[#FBFAF4] hover:bg-white transition-all"
                  >
                    <img src={sample.img} alt={sample.name} className="w-8 h-8 rounded-lg object-cover" />
                    <span className="font-semibold text-[#26332B] truncate">{sample.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Comprehensive AI Health & Grade Report */}
        <div className="lg:col-span-7">
          {analysisResult ? (
            <div className="space-y-4">
              {/* Needs Expert Verification Banner if confidence is low */}
              {analysisResult.needsExpertVerification && (
                <div className="rounded-2xl p-4 bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs">
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-amber-900 mb-0.5">
                      {isHindi ? 'विशेषज्ञ सत्यापन की आवश्यकता (Needs Expert Verification)' : 'Needs Expert Verification'}
                    </h4>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      {isHindi
                        ? 'इस फोटो में प्रकाश या फोकस स्पष्ट नहीं होने से एआई विश्वसनीयता स्कोर कम (६२%) है। कृपया नजदीकी मंडी परीक्षक अथवा केवीके (KVK) विशेषज्ञ से मुआयना कराएं।'
                        : analysisResult.expertVerificationReason || 'Confidence is below 75%. Please request on-site verification from the APMC quality assessor.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Main Analysis Card */}
              <div className="bg-white rounded-3xl border border-[#EEF3E8] p-6 shadow-sm space-y-6">
                {/* Result Topline */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EEF3E8]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold font-serif text-[#26332B]">
                        {analysisResult.cropName}
                      </h2>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#5F8F45]/15 text-[#245C3A]">
                        {analysisResult.variety}
                      </span>
                    </div>
                    <p className="text-xs text-[#68736B] mt-1">
                      {isHindi ? 'स्कैन समय:' : 'Scan Timestamp:'} {analysisResult.timestamp}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Quality Grade Badge */}
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-[#68736B] block">
                        {isHindi ? 'गुणवत्ता ग्रेड' : 'Produce Grade'}
                      </span>
                      <span
                        className={`inline-block px-3 py-1 rounded-xl text-xs font-black tracking-wide ${
                          analysisResult.qualityGrade.includes('A+')
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : analysisResult.qualityGrade.includes('A')
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {analysisResult.qualityGrade}
                      </span>
                    </div>

                    {/* Confidence Score Pill */}
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-[#68736B] block">
                        {isHindi ? 'विश्वास स्कोर' : 'Confidence'}
                      </span>
                      <span className="text-base font-black text-[#245C3A]">
                        {analysisResult.confidenceScore}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visible Indicators List */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#68736B] mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#245C3A]" />
                    <span>{isHindi ? 'पहचाने गए दृश्य स्वास्थ्य संकेतक (Visible Health Indicators)' : 'Visible Health Indicators'}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {analysisResult.visibleIndicators.map((ind, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 p-2.5 rounded-xl bg-[#FBFAF4] border border-[#EEF3E8] text-xs text-[#26332B]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#5F8F45] mt-1.5 shrink-0" />
                        <span>{ind}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disease / Stress Detection Section */}
                <div
                  className={`rounded-2xl p-4 border ${
                    analysisResult.stressOrDisease.detected
                      ? 'bg-rose-50 border-rose-200 text-rose-950'
                      : 'bg-[#F2F7EF] border-[#5F8F45]/30 text-[#1B432B]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {analysisResult.stressOrDisease.detected ? (
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                    ) : (
                      <ShieldCheck className="w-5 h-5 text-[#245C3A]" />
                    )}
                    <h4 className="font-bold text-sm">
                      {analysisResult.stressOrDisease.detected
                        ? isHindi
                          ? `रोग/तनाव लक्षण: ${analysisResult.stressOrDisease.name || 'संभावित संक्रमण'}`
                          : `Stress / Pathogen Detected: ${analysisResult.stressOrDisease.name}`
                        : isHindi
                        ? 'फसल स्वास्थ्य: कोई हानिकारक कीट या फफूंद रोग नहीं पाया गया'
                        : 'Crop Status: Healthy foliage with zero active fungal pathogens'}
                    </h4>
                  </div>
                  {analysisResult.stressOrDisease.detected && (
                    <div className="space-y-1.5 text-xs text-rose-900 mt-2">
                      <p>
                        <strong>{isHindi ? 'विवरण:' : 'Details:'}</strong> {analysisResult.stressOrDisease.description}
                      </p>
                      <p className="text-[#245C3A] font-semibold bg-white/70 p-2 rounded-lg border border-rose-200">
                        <strong>{isHindi ? 'सुझाया गया उपचार:' : 'Recommended Treatment:'}</strong>{' '}
                        {analysisResult.stressOrDisease.recommendedTreatment}
                      </p>
                    </div>
                  )}
                </div>

                {/* Key Metrics Grid */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#68736B] mb-2">
                    {isHindi ? 'गुणवत्ता मैट्रिक्स (Laboratory Parameters)' : 'Quality Metrics'}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-2xl bg-[#FBFAF4] border border-[#EEF3E8]">
                      <span className="text-[10px] text-[#68736B] block mb-1">
                        {isHindi ? 'दाना एकरूपता' : 'Uniformity'}
                      </span>
                      <span className="text-base font-bold text-[#245C3A]">
                        {analysisResult.gradingMetrics.grainUniformityPercent}%
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#FBFAF4] border border-[#EEF3E8]">
                      <span className="text-[10px] text-[#68736B] block mb-1">
                        {isHindi ? 'नमी स्तर' : 'Moisture'}
                      </span>
                      <span className="text-base font-bold text-[#26332B]">
                        {analysisResult.gradingMetrics.moisturePercent}%
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#FBFAF4] border border-[#EEF3E8]">
                      <span className="text-[10px] text-[#68736B] block mb-1">
                        {isHindi ? 'अपद्रव्य / कचरा' : 'Foreign Matter'}
                      </span>
                      <span className="text-base font-bold text-[#26332B]">
                        {analysisResult.gradingMetrics.foreignMatterPercent}%
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#FBFAF4] border border-[#EEF3E8]">
                      <span className="text-[10px] text-[#68736B] block mb-1">
                        {isHindi ? 'चमक स्कोर' : 'Color / Luster'}
                      </span>
                      <span className="text-base font-bold text-[#D6A63A]">
                        {analysisResult.gradingMetrics.colorLusterScore}/100
                      </span>
                    </div>
                  </div>
                </div>

                {/* Medical / Agricultural Disclaimers (MANDATORY RULE) */}
                <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#EEF3E8] flex items-start gap-2.5 text-[11px] text-[#68736B] leading-relaxed">
                  <Info className="w-4 h-4 text-[#5F8F45] shrink-0 mt-0.5" />
                  <p>
                    {isHindi ? CROP_HEALTH_DISCLAIMER_HI : CROP_HEALTH_DISCLAIMER_EN}
                  </p>
                </div>

                {/* Primary CTA */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      if (onOpenAddCropModal) onOpenAddCropModal();
                      else if (onSelectTab) onSelectTab('add-crop');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-[#245C3A] text-white text-xs font-bold hover:bg-[#1B432B] transition-all shadow-md"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>{isHindi ? 'इस रिपोर्ट के साथ नया लॉट बनाएं' : 'Create Verified Crop Lot with this Report'}</span>
                  </button>
                  {onSelectTab && (
                    <button
                      onClick={() => onSelectTab('smart-sell')}
                      className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-[#D6A63A]/20 text-[#8C6212] hover:bg-[#D6A63A]/30 text-xs font-bold border border-[#D6A63A]/40 transition-all"
                    >
                      <span>{isHindi ? 'स्मार्ट बिक्री सलाह देखें' : 'View Smart Sell Advice'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#EEF3E8] p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#5F8F45]/15 flex items-center justify-center text-[#245C3A] mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold font-serif text-[#26332B] mb-2">
                {isHindi ? 'फसल विश्लेषण हेतु तैयार' : 'Ready for AI Crop Scanning'}
              </h3>
              <p className="text-xs text-[#68736B] max-w-md mb-6 leading-relaxed">
                {isHindi
                  ? 'बाईं ओर से फसल की फोटो चुनें अथवा दिए गए डेमो नमूनों में से किसी एक पर क्लिक करके तुरंत एआई परीक्षण शुरू करें।'
                  : 'Select an image on the left or tap any of the sample crops to generate a live health & grade report.'}
              </p>
              <button
                onClick={() => handleChooseSample(sampleCrops[0])}
                className="px-5 py-2.5 rounded-xl bg-[#245C3A] text-white text-xs font-bold hover:bg-[#1B432B] transition-colors"
              >
                {isHindi ? 'गेहूं के नमूने से परीक्षण करें' : 'Run Demo Analysis on Wheat'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
