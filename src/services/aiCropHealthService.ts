export interface CropHealthAnalysisResult {
  id: string;
  cropName: string;
  variety: string;
  cropCategory: string;
  confidenceScore: number; // 0 - 100
  needsExpertVerification: boolean; // True when confidence < 75 or anomaly detected
  qualityGrade: 'A+ Premium' | 'A Standard' | 'Commercial' | 'Needs Review';
  healthStatus: 'Excellent' | 'Good' | 'Fair' | 'Disease Suspected';
  visibleIndicators: string[];
  stressOrDisease: {
    detected: boolean;
    name?: string;
    severity?: 'None' | 'Low' | 'Moderate' | 'High';
    description?: string;
    recommendedTreatment?: string;
  };
  gradingMetrics: {
    grainUniformityPercent: number;
    moisturePercent: number;
    foreignMatterPercent: number;
    colorLusterScore: number;
  };
  suggestedMandiPremiumPercent: number;
  expertVerificationReason?: string;
  disclaimer: string;
  timestamp: string;
  imageUrl?: string;
}

export const CROP_HEALTH_DISCLAIMER_HI =
  'महत्वपूर्ण सूचना: यह एआई-आधारित प्रारंभिक विश्लेषण है। इसे आधिकारिक कृषि विज्ञानी निदान या प्रयोगशाला प्रमाणीकरण नहीं माना जाना चाहिए। गंभीर फसल रोग की स्थिति में नजदीकी कृषि विज्ञान केंद्र (KVK) से संपर्क करें।';

export const CROP_HEALTH_DISCLAIMER_EN =
  'Important Notice: This AI output is an automated morphological screening and must not be presented or relied upon as a guaranteed medical, pathological, or agricultural diagnosis. For critical concerns, consult your local Krishi Vigyan Kendra (KVK).';

// Database of standard crops and healthy vs stress parameters
const CROP_PROFILES: Record<string, {
  name: string;
  variety: string;
  category: string;
  standardIndicators: string[];
  possibleDiseases: Array<{
    name: string;
    description: string;
    treatment: string;
    severity: 'Low' | 'Moderate' | 'High';
  }>;
}> = {
  wheat: {
    name: 'Wheat (गेहूं)',
    variety: 'HD-3086 (Pusa Gautami) / Sharbati',
    category: 'Cereals',
    standardIndicators: [
      'Bold amber grain luster with uniform kernel size',
      'Intact husk with zero kernel crack observed',
      'Optimal dry harvest density (~80 kg/hl test weight)',
    ],
    possibleDiseases: [
      {
        name: 'Yellow Rust (पीला रतुआ / Puccinia striiformis)',
        description: 'Linear yellow-orange fungal pustules visible on leaf surface',
        treatment: 'Spray Propiconazole 25% EC @ 1ml/L water immediately at early onset.',
        severity: 'Moderate',
      },
      {
        name: 'Karnal Bunt (करनाल बंट)',
        description: 'Partial grain blackening with fishy trimethylamine odor',
        treatment: 'Seed treatment with Thiram/Carboxin; avoid excessive nitrogen irrigation.',
        severity: 'High',
      },
    ],
  },
  rice: {
    name: 'Basmati Rice (बासमती धान)',
    variety: 'PB-1121 / Pusa Basmati',
    category: 'Cereals',
    standardIndicators: [
      'Slender, extra-long grain profile (>8.2 mm average)',
      'Natural pearly translucence with minimal chalky belly',
      'Consistent golden husk maturation index',
    ],
    possibleDiseases: [
      {
        name: 'Bacterial Leaf Blight (BLB / जीवाणु झुलसा)',
        description: 'Water-soaked wavy lesions starting from leaf tips drying grayish-white',
        treatment: 'Apply Streptocycline (15g) + Copper Oxychloride (500g) in 200L water per acre.',
        severity: 'Moderate',
      },
    ],
  },
  chana: {
    name: 'Chana / Chickpea (चना)',
    variety: 'Kabuli Dollar 1 / Desi Bold',
    category: 'Pulses',
    standardIndicators: [
      'Clean globular seed coat without wrinkle or insect punctures',
      'Well-developed cotyledon color and dry seed density',
      'Foreign matter well below APMC tolerance benchmark (<0.8%)',
    ],
    possibleDiseases: [
      {
        name: 'Ascochyta Blight / Dry Root Rot (उकठा रोग)',
        description: 'Circular sunken lesions with dark margins on pods and foliage',
        treatment: 'Seed treatment with Trichoderma viride @ 4g/kg seed; ensure soil drainage.',
        severity: 'High',
      },
    ],
  },
  mustard: {
    name: 'Mustard (सरसों)',
    variety: 'Pusa Bold / Yellow Gold',
    category: 'Oilseeds',
    standardIndicators: [
      'Deep uniform bold seed diameter with high test weight',
      'Estimated oil recovery potential >41.5%',
      'Clean harvest free from weed seeds (Argemone mexicana)',
    ],
    possibleDiseases: [
      {
        name: 'White Rust (सफेद रतुआ / Albugo candida)',
        description: 'White to cream blister-like pustules on the lower leaf surface',
        treatment: 'Spray Mancozeb 75 WP @ 2g/L or Metalaxyl 8% + Mancozeb 64% WP.',
        severity: 'Moderate',
      },
    ],
  },
};

export async function analyzeCropPhoto(
  imageDataUrl: string,
  hintCrop?: string,
  forceDiseaseCheck: boolean = false
): Promise<CropHealthAnalysisResult> {
  // Simulate intelligent scan delay
  await new Promise((resolve) => setTimeout(resolve, 1400));

  const lowerHint = (hintCrop || 'wheat').toLowerCase();
  let selectedKey = 'wheat';
  if (lowerHint.includes('rice') || lowerHint.includes('dhan') || lowerHint.includes('paddy')) selectedKey = 'rice';
  else if (lowerHint.includes('chana') || lowerHint.includes('pulse') || lowerHint.includes('gram')) selectedKey = 'chana';
  else if (lowerHint.includes('mustard') || lowerHint.includes('sarson')) selectedKey = 'mustard';

  const profile = CROP_PROFILES[selectedKey] || CROP_PROFILES.wheat;

  // Decide if confidence is high or low (e.g. if photo is blurry or test requested)
  const isClearPhoto = imageDataUrl.length > 3000;
  const confidenceScore = isClearPhoto ? Math.floor(86 + Math.random() * 11) : 62;
  const needsVerification = confidenceScore < 75;

  const hasDisease = forceDiseaseCheck || (confidenceScore > 90 && Math.random() < 0.15);
  const diseaseInfo = hasDisease
    ? profile.possibleDiseases[0]
    : {
        name: undefined,
        description: undefined,
        treatment: undefined,
        severity: 'None' as const,
      };

  const qualityGrade: CropHealthAnalysisResult['qualityGrade'] = needsVerification
    ? 'Needs Review'
    : hasDisease
    ? 'Commercial'
    : confidenceScore >= 92
    ? 'A+ Premium'
    : 'A Standard';

  return {
    id: `scan-${Date.now()}`,
    cropName: profile.name,
    variety: profile.variety,
    cropCategory: profile.category,
    confidenceScore,
    needsExpertVerification: needsVerification,
    expertVerificationReason: needsVerification
      ? 'Low lighting or indistinct foliage focus. Recommended to have local Mandi grader or KVK expert verify.'
      : undefined,
    qualityGrade,
    healthStatus: hasDisease ? 'Disease Suspected' : confidenceScore >= 90 ? 'Excellent' : 'Good',
    visibleIndicators: [
      ...profile.standardIndicators,
      `Estimated moisture equilibrium: ${hasDisease ? '13.2%' : '10.4%'} (Safe boundary: <12%)`,
    ],
    stressOrDisease: {
      detected: hasDisease,
      name: diseaseInfo.name,
      severity: diseaseInfo.severity,
      description: diseaseInfo.description,
      recommendedTreatment: diseaseInfo.treatment,
    },
    gradingMetrics: {
      grainUniformityPercent: hasDisease ? 78 : Math.floor(91 + Math.random() * 7),
      moisturePercent: hasDisease ? 13.4 : 10.2,
      foreignMatterPercent: hasDisease ? 1.8 : 0.4,
      colorLusterScore: hasDisease ? 72 : 94,
    },
    suggestedMandiPremiumPercent: qualityGrade === 'A+ Premium' ? 6.5 : qualityGrade === 'A Standard' ? 2.0 : 0,
    disclaimer: CROP_HEALTH_DISCLAIMER_HI,
    timestamp: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    imageUrl: imageDataUrl,
  };
}
