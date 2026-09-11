import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Share2,
  Printer,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Award,
  ArrowLeft,
  Store,
  ExternalLink,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { CropLotPassport } from '../../services/cropLotPassportService';

export const CropLotVerificationPage: React.FC = () => {
  const { lotId } = useParams<{ lotId: string }>();
  const navigate = useNavigate();
  const [passport, setPassport] = useState<CropLotPassport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!lotId) {
      setError('No Lot ID provided in URL');
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchLot = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/crop-lots/${encodeURIComponent(lotId)}`);
        if (!res.ok) {
          throw new Error(`Lot ${lotId} not found or verification record expired`);
        }
        const data = await res.json();
        if (isMounted) {
          setPassport(data.passport);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to verify lot');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLot();
    return () => {
      isMounted = false;
    };
  }, [lotId]);

  const handleShare = () => {
    if (navigator.share && passport) {
      navigator
        .share({
          title: `Crop Lot Passport - ${passport.lotId}`,
          text: `Verified Agricultural Lot: ${passport.cropDetails.name} (${passport.cropDetails.quantityKg} kg) by ${passport.farmer.name}. Verified by Kisan Saathi.`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F7F9F6] text-[#26332B] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#245C3A] hover:text-[#1E4D31] bg-white px-3 py-1.5 rounded-xl border border-[#EEF3E8] shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kisan Saathi Home</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#EEF3E8] shadow-2xs text-xs font-semibold text-[#404D44] hover:bg-[#F2F6F0] transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Passport</span>
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#245C3A] text-white shadow-xs text-xs font-semibold hover:bg-[#1E4D31] transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? 'Link Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#EEF3E8] shadow-sm space-y-4">
            <Loader2 className="w-10 h-10 text-[#245C3A] animate-spin mx-auto" />
            <p className="text-sm font-medium text-[#68736B]">Verifying digital lot credentials and AGMARKNET provenance...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-3xl p-8 text-center border border-red-200 shadow-sm space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[#26332B]">Lot Verification Not Found</h2>
            <p className="text-sm text-[#68736B] max-w-md mx-auto">
              {error}. Please check the Lot ID or scan the QR code again directly from the bag label.
            </p>
            <button
              onClick={() => navigate('/crops')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#245C3A] text-white text-sm font-semibold hover:bg-[#1E4D31] transition-colors"
            >
              <Store className="w-4 h-4" />
              <span>Explore Active Marketplace Lots</span>
            </button>
          </div>
        )}

        {!loading && passport && (
          <div className="bg-white rounded-3xl shadow-xl border border-[#EEF3E8] overflow-hidden">
            {/* Header Ribbon */}
            <div className="bg-linear-to-r from-[#245C3A] via-[#1E4D31] to-[#122E1D] text-white p-6 sm:p-8 relative">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-[#D6A63A] text-[#26332B] font-black text-xs uppercase tracking-wider shadow-xs">
                  Official Digital Crop Lot Passport
                </span>
                <span className="text-xs text-[#EEF3E8] flex items-center gap-1 bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D6A63A]" />
                  <span>Verified Agricultural Lot</span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-white">
                {passport.lotId}
              </h1>
              <p className="text-sm text-[#EEF3E8]/90 mt-1">
                {passport.cropDetails.name} • {passport.cropDetails.variety} • {passport.cropDetails.category}
              </p>
            </div>

            {/* Main Passport Content */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* QR Code & Fast Verification Card */}
              <div className="p-5 rounded-2xl bg-[#FBFAF4] border border-[#EEF3E8] flex flex-col sm:flex-row items-center gap-6">
                <div className="p-3 bg-white rounded-2xl border border-[#EEF3E8] shadow-2xs shrink-0 text-center">
                  <img
                    src={passport.qrCodeSvgDataUri}
                    alt="Lot QR Code"
                    className="w-40 h-40 mx-auto rounded-lg"
                  />
                  <span className="text-[11px] font-bold text-[#68736B] mt-1.5 block">
                    Scan with any Mobile Phone
                  </span>
                </div>

                <div className="space-y-3 text-center sm:text-left flex-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{passport.farmer.verificationBadge}</span>
                  </div>

                  <h3 className="text-xl font-black text-[#26332B]">
                    {passport.farmer.name}
                  </h3>

                  <p className="text-xs text-[#68736B] flex items-center justify-center sm:justify-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#245C3A]" />
                    <span>
                      {passport.farmer.village}, Tehsil {passport.farmer.tehsil}, {passport.farmer.district},{' '}
                      {passport.farmer.state}
                    </span>
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-[#EEF3E8] font-mono text-[#404D44]">
                      ID: {passport.farmer.farmerId}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#F2F6F0] text-[#245C3A] font-bold">
                      Trust Score: {passport.farmer.trustScore}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* Crop & Storage Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#F7F9F6] border border-[#EEF3E8]">
                  <span className="text-[11px] font-medium text-[#68736B] flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-[#245C3A]" />
                    <span>Total Quantity</span>
                  </span>
                  <div className="text-lg font-black text-[#26332B] mt-1">
                    {passport.cropDetails.quantityQuintals}{' '}
                    <span className="text-xs font-semibold text-[#68736B]">Quintals</span>
                  </div>
                  <span className="text-[10px] text-[#68736B]">
                    ({passport.cropDetails.quantityKg.toLocaleString()} kg)
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F7F9F6] border border-[#EEF3E8]">
                  <span className="text-[11px] font-medium text-[#68736B] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#245C3A]" />
                    <span>Harvest Date</span>
                  </span>
                  <div className="text-sm font-bold text-[#26332B] mt-1.5">
                    {passport.cropDetails.harvestDate}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold">Fresh Season Harvest</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F7F9F6] border border-[#EEF3E8]">
                  <span className="text-[11px] font-medium text-[#68736B] flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-[#D6A63A]" />
                    <span>Quality Grade</span>
                  </span>
                  <div className="text-sm font-black text-[#245C3A] mt-1.5">
                    {passport.qualityCertificate.grade}
                  </div>
                  <span className="text-[10px] text-[#68736B]">
                    Score: {passport.qualityCertificate.score}/100
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F7F9F6] border border-[#EEF3E8]">
                  <span className="text-[11px] font-medium text-[#68736B] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#245C3A]" />
                    <span>Moisture Content</span>
                  </span>
                  <div className="text-sm font-black text-[#26332B] mt-1.5">
                    {passport.qualityCertificate.moisturePercent}%
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold">Safe Storage Standard</span>
                </div>
              </div>

              {/* Quality & Audit Certificate */}
              <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>AI Quality Audit & Lab Verification</span>
                  </span>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                    {passport.qualityCertificate.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs text-[#404D44]">
                  <div>
                    <span className="text-[#68736B] block text-[10px]">Grain Uniformity:</span>
                    <span className="font-semibold">{passport.qualityCertificate.grainUniformity}</span>
                  </div>
                  <div>
                    <span className="text-[#68736B] block text-[10px]">Foreign Matter:</span>
                    <span className="font-semibold">{passport.qualityCertificate.foreignMatterPercent}% (Negligible)</span>
                  </div>
                  <div>
                    <span className="text-[#68736B] block text-[10px]">Inspection Method:</span>
                    <span className="font-semibold">{passport.qualityCertificate.aiAuditTimestamp}</span>
                  </div>
                </div>
              </div>

              {/* Price & Mandi Benchmark */}
              <div className="p-5 rounded-2xl bg-linear-to-br from-[#FBFAF4] to-[#F2F6F0] border border-[#D6A63A]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-[#68736B] uppercase tracking-wider block">
                    Direct Farmer Asking Rate
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-[#245C3A] mt-0.5">
                    ₹{passport.pricingAndListing.askingPriceKg}
                    <span className="text-sm font-normal text-[#68736B]"> / kg</span>
                    <span className="text-sm font-bold text-[#404D44] ml-2">
                      (₹{passport.pricingAndListing.askingPriceKg * 100} / क्विंटल)
                    </span>
                  </div>
                  <p className="text-xs text-[#68736B] mt-1">
                    Official APMC Mandi Benchmark: ₹{passport.pricingAndListing.mandiReferenceRateKg} / kg (₹
                    {Math.round(passport.pricingAndListing.mandiReferenceRateKg * 100)} / क्विंटल)
                  </p>
                </div>

                <div className="text-right sm:border-l sm:border-[#EEF3E8] sm:pl-6 w-full sm:w-auto">
                  <span className="text-xs text-[#68736B] block">Total Lot Value</span>
                  <div className="text-xl font-black text-[#26332B]">
                    ₹{passport.pricingAndListing.totalLotValue.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-1">
                    Escrow Protected Deal ✓
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate('/crops')}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#245C3A] text-white font-bold text-sm shadow-md hover:bg-[#1E4D31] transition-all flex items-center justify-center gap-2"
                >
                  <Store className="w-4 h-4" />
                  <span>Send Purchase Enquiry to Farmer</span>
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="py-3 px-4 rounded-xl bg-white border border-[#EEF3E8] text-[#26332B] font-bold text-sm hover:bg-[#F2F6F0] transition-all flex items-center justify-center gap-2"
                >
                  <span>Explore Marketplace</span>
                </button>
              </div>

              {/* Security Provenance Footer */}
              <div className="pt-4 border-t border-[#EEF3E8] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#68736B] gap-2">
                <span>Lot Passport issued on {passport.issuedAt}</span>
                <span className="font-mono">Kisan Saathi Digital Trust Infrastructure • Government Provenance Verified</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
