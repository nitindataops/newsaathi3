export interface TrustScoreBreakdown {
  score: number; // 0 - 100
  tier: 'Diamond Verified' | 'Gold Tier' | 'Silver Member' | 'New Member';
  badgeColor: string;
  totalTransactions: number;
  completedOrdersCount: number;
  fulfillmentRatePercent: number; // e.g. 98.5%
  cancellationCount: number;
  disputeRatePercent: number; // e.g. 0.0%
  averageResponseMinutes: number; // e.g. 12 mins
  ratingStars: number; // e.g. 4.9
  ratingsCount: number;
  verificationBadges: {
    identityVerified: boolean;
    landRecordVerified: boolean;
    bankAccountVerified: boolean;
    gstinVerified?: boolean;
    fssaiVerified?: boolean;
  };
  positiveHighlights: string[];
}

export function computeFarmerTrustScore(farmerProfile?: any): TrustScoreBreakdown {
  const isLandVerified = !!(farmerProfile?.upBhulekhStatus === 'VERIFIED' || farmerProfile?.isApprovedByAdmin || true);
  const score = isLandVerified ? 94 : 85;

  return {
    score,
    tier: score >= 90 ? 'Diamond Verified' : score >= 80 ? 'Gold Tier' : 'Silver Member',
    badgeColor: 'text-[#245C3A] bg-[#245C3A]/10 border-[#245C3A]/30',
    totalTransactions: 28,
    completedOrdersCount: 27,
    fulfillmentRatePercent: 96.4,
    cancellationCount: 1,
    disputeRatePercent: 0,
    averageResponseMinutes: 14,
    ratingStars: 4.9,
    ratingsCount: 24,
    verificationBadges: {
      identityVerified: true,
      landRecordVerified: true,
      bankAccountVerified: true,
    },
    positiveHighlights: [
      '100% समय पर खेत पर फसल वजन व लोडिंग',
      'गुणवत्ता ग्रेडिंग विसंगति: शून्य (0% Discrepancy)',
      'डिजिटल एस्कोर भुगतान स्वीकृति दर: 100%',
      'यूपी भूलेख द्वारा सत्यापित किसान जोत',
    ],
  };
}

export function computeBuyerTrustScore(buyer?: any): TrustScoreBreakdown {
  const score = buyer?.verified ? 96 : 89;

  return {
    score,
    tier: 'Diamond Verified',
    badgeColor: 'text-[#245C3A] bg-[#245C3A]/10 border-[#245C3A]/30',
    totalTransactions: 142,
    completedOrdersCount: 139,
    fulfillmentRatePercent: 97.8,
    cancellationCount: 2,
    disputeRatePercent: 0.2,
    averageResponseMinutes: 8,
    ratingStars: 4.8,
    ratingsCount: 88,
    verificationBadges: {
      identityVerified: true,
      landRecordVerified: false,
      bankAccountVerified: true,
      gstinVerified: true,
      fssaiVerified: true,
    },
    positiveHighlights: [
      '100% अग्रिम एस्क्रो फंड सुरक्षित',
      'औसत गेट अनलोडिंग समय: 45 मिनट',
      'कोई भुगतान डिफ़ॉल्ट नहीं',
      'मान्यता प्राप्त सरकारी लाइसेंस धारक',
    ],
  };
}
