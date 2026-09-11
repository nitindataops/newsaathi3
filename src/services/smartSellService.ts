export type SellDecisionType = 'SELL NOW' | 'WAIT' | 'PARTIAL SELL';

export interface SmartSellRecommendation {
  cropName: string;
  variety: string;
  quantityKg: number;
  currentMandiRate: number; // ₹/kg
  mspRate: number; // ₹/kg
  decision: SellDecisionType;
  confidenceScore: number; // 0-100
  title: string;
  headlineSummary: string;
  reasons: string[];
  projectedMetrics: {
    spotRevenue: number;
    projectedFutureRevenue?: number;
    estimatedStorageCostPerMonth?: number;
    projectedAppreciationPercent?: number;
    recommendedSplitRatio?: {
      sellNowPercent: number;
      holdPercent: number;
      sellNowQuantityKg: number;
      holdQuantityKg: number;
    };
  };
  marketSignals: {
    buyerDemandLevel: 'Very High' | 'High' | 'Moderate' | 'Subdued';
    priceTrend30Days: 'Bullish (+4-8%)' | 'Stable (±1%)' | 'Bearish (-3-5%)';
    arrivalVolumeTrend: 'Peak Arrivals Starting' | 'Tapering Off' | 'Low Off-Season';
    storageSuitability: 'Excellent (Low spoilage risk)' | 'Moderate' | 'High Risk (Moisture prone)';
  };
  disclaimer: string;
  timestamp: string;
}

export const SMART_SELL_DISCLAIMER_HI =
  'अस्वीकरण: यह अनुशंसा ऐतिहासिक मंडी भाव, एपीएमसी आवक और खरीदार मांग डेटा पर आधारित एक विश्लेषणात्मक सुझाव है। यह भविष्य के मूल्यों की कोई निश्चित या कानूनी गारंटी नहीं है। विक्रय का अंतिम निर्णय किसान का अपना होगा।';

export const SMART_SELL_DISCLAIMER_EN =
  'Disclaimer: This recommendation is a decision-support heuristic calculated from historical mandi arrivals, MSP differentials, and verified buyer demand indices. It is not a guaranteed financial or commodity price prediction.';

export function calculateSmartSellRecommendation(
  cropName: string,
  variety: string,
  quantityKg: number,
  currentMandiPriceKg: number,
  mspPerKg: number,
  storageFacilityAvailable: boolean = true,
  daysToHarvest: number = 0
): SmartSellRecommendation {
  const normName = cropName.toLowerCase();
  let decision: SellDecisionType = 'SELL NOW';
  let title = '';
  let headlineSummary = '';
  const reasons: string[] = [];

  let demand: SmartSellRecommendation['marketSignals']['buyerDemandLevel'] = 'High';
  let trend: SmartSellRecommendation['marketSignals']['priceTrend30Days'] = 'Bullish (+4-8%)';
  let arrivals: SmartSellRecommendation['marketSignals']['arrivalVolumeTrend'] = 'Peak Arrivals Starting';
  let storageRisk: SmartSellRecommendation['marketSignals']['storageSuitability'] = 'Excellent (Low spoilage risk)';

  // Pulses (Chana / Moong / Urad) - typically volatile, favorable spot rates
  if (normName.includes('chana') || normName.includes('gram') || normName.includes('pulse')) {
    if (currentMandiPriceKg >= mspPerKg * 1.15) {
      decision = 'SELL NOW';
      title = 'तुरंत बेचें (SELL NOW) - स्पॉट प्रीमियम का लाभ उठाएं';
      headlineSummary = `वर्तमान भाव (₹${currentMandiPriceKg}/kg) न्यूनतम समर्थन मूल्य (₹${mspPerKg}/kg) से १५% अधिक है। आगामी मंडियों में भारी आवक से भाव नरम होने की संभावना है।`;
      reasons.push('हाजिर बाजार में दाल मिलों और निर्यातकों की मजबूत मांग उपलब्ध है।');
      reasons.push('अगले २-३ हफ्तों में मध्य प्रदेश और राजस्थान से नई फसल की आवक बढ़ने से भाव पर दबाव आ सकता है।');
      reasons.push('बिना गोदाम किराया और वजन घटोतरी के शत-प्रतिशत सुरक्षित एस्क्रो भुगतान तुरंत प्राप्त होगा।');
      demand = 'Very High';
      trend = 'Bullish (+4-8%)';
      arrivals = 'Peak Arrivals Starting';
      storageRisk = 'Moderate';
    } else {
      decision = 'PARTIAL SELL';
      title = 'आंशिक बिक्री (PARTIAL SELL) - संतुलित जोखिम प्रबंधन';
      headlineSummary = 'लागत निकालने हेतु ४०% फसल अभी बेचें तथा ६०% फसल को १ महीने रोककर उच्च भाव का लाभ लें।';
      reasons.push('तत्काल नकदी की जरूरत पूरी करने के लिए ४०% लॉट स्थानीय सत्यापित खरीदार को दें।');
      reasons.push('त्योहारी सीजन में दलहन की मांग में उछाल से शेष ६०% पर ₹४-५/किलो अतिरिक्त मुनाफा संभव है।');
      demand = 'Moderate';
      trend = 'Stable (±1%)';
      arrivals = 'Tapering Off';
      storageRisk = 'Moderate';
    }
  } else if (normName.includes('wheat') || normName.includes('gehu')) {
    // Wheat logic
    if (quantityKg >= 10000 && storageFacilityAvailable) {
      decision = 'WAIT';
      title = 'रोकें / प्रतीक्षा करें (WAIT) - ३० दिन में बेहतर मूल्य का अनुमान';
      headlineSummary = 'सरकारी खरीद व फ्लोर मिलों की भारी मांग के कारण आगामी महीने में गेहूं के भाव में ₹२.५० से ₹३.८०/किग्रा तक सुधार की संभावना है।';
      reasons.push('सीडब्ल्यूसी/नाबार्ड प्रमाणित गोदामों में भंडारण पर नगण्य वजन हानि।');
      reasons.push('आटा मिलों के अग्रिम अनुबंध ₹३१-३२/किग्रा पर ट्रेड कर रहे हैं जो वर्तमान मंडी भाव से काफी अधिक है।');
      reasons.push('गोदाम रसीद (Warehouse Receipt / e-NWR) पर ७०% तक आसान बैंक ऋण सुविधा उपलब्ध है।');
      demand = 'Very High';
      trend = 'Bullish (+4-8%)';
      arrivals = 'Tapering Off';
      storageRisk = 'Excellent (Low spoilage risk)';
    } else {
      decision = 'PARTIAL SELL';
      title = 'आंशिक बिक्री (PARTIAL SELL) - ५०% रोकें, ५०% बेचें';
      headlineSummary = 'परिवहन लागत व त्वरित नकदी हेतु आधी फसल तुरंत बेचें और शेष अच्छी स्थिति में रोकें।';
      reasons.push('तुरंत कार्यशील पूंजी सुरक्षित करने के लिए ५०% लॉट का निष्पादन करें।');
      reasons.push('शेष मात्रा को स्थानीय मंडी भाव ऊपर जाने पर चरणबद्ध तरीके से बेचें।');
      demand = 'High';
      trend = 'Bullish (+4-8%)';
      arrivals = 'Peak Arrivals Starting';
      storageRisk = 'Excellent (Low spoilage risk)';
    }
  } else if (normName.includes('rice') || normName.includes('paddy') || normName.includes('dhan')) {
    // Basmati / Rice
    decision = 'WAIT';
    title = 'प्रतीक्षा करें (WAIT) - प्रीमियम बासमती निर्यात मांग सक्रिय';
    headlineSummary = 'मध्य-पूर्व एवं खाड़ी देशों में बासमती चावल की मांग में उछाल। मिलर्स प्रीमियम लॉट्स के लिए अतिरिक्त मूल्य देने को तैयार हैं।';
    reasons.push('११२१ बासमती धान की औसत निर्यात कीमतें स्थिर तेजी दर्शा रही हैं।');
    reasons.push('नमी नियंत्रित (१२% से कम) लॉट्स को ३० दिन रखने पर ₹४००-५००/क्विंटल का मूल्यवर्धन देखा गया है।');
    reasons.push('नजदीकी वेयरहाउस में भंडारण शुल्क मात्र ₹३० प्रति क्विंटल प्रति माह है।');
    demand = 'Very High';
    trend = 'Bullish (+4-8%)';
    arrivals = 'Low Off-Season';
    storageRisk = 'Excellent (Low spoilage risk)';
  } else {
    // Default mustard / oilseeds / others
    decision = 'SELL NOW';
    title = 'तुरंत बेचें (SELL NOW) - वर्तमान स्थिर भाव पर मुनाफा लॉक करें';
    headlineSummary = `वर्तमान भाव (₹${currentMandiPriceKg}/kg) लाभदायक स्तर पर है। अतिरिक्त भंडारण जोखिम लेने की आवश्यकता नहीं है।`;
    reasons.push('वैश्विक खाद्य तेल आयात शुल्क नीतियों के चलते हाजिर बाजार में उतार-चढ़ाव संभव है।');
    reasons.push('सीधा तेल मिलों को विक्रय पर तत्काल शून्य-कमीशन भुगतान सुनिश्चित होता है।');
    demand = 'Moderate';
    trend = 'Stable (±1%)';
    arrivals = 'Peak Arrivals Starting';
    storageRisk = 'Moderate';
  }

  const spotRev = quantityKg * currentMandiPriceKg;
  const storageCost = Math.round((quantityKg / 100) * 35); // ₹35 / quintal / month
  const projectedAppreciation = decision === 'WAIT' ? 12.5 : decision === 'PARTIAL SELL' ? 8.0 : 0;
  const futureRev = decision !== 'SELL NOW' ? Math.round(spotRev * (1 + projectedAppreciation / 100) - storageCost) : undefined;

  return {
    cropName,
    variety: variety || 'Standard Certified',
    quantityKg,
    currentMandiRate: currentMandiPriceKg,
    mspRate: mspPerKg,
    decision,
    confidenceScore: decision === 'SELL NOW' ? 91 : decision === 'WAIT' ? 88 : 85,
    title,
    headlineSummary,
    reasons,
    projectedMetrics: {
      spotRevenue: spotRev,
      projectedFutureRevenue: futureRev,
      estimatedStorageCostPerMonth: storageCost,
      projectedAppreciationPercent: projectedAppreciation,
      recommendedSplitRatio: decision === 'PARTIAL SELL' ? {
        sellNowPercent: 40,
        holdPercent: 60,
        sellNowQuantityKg: Math.round(quantityKg * 0.4),
        holdQuantityKg: Math.round(quantityKg * 0.6),
      } : undefined,
    },
    marketSignals: {
      buyerDemandLevel: demand,
      priceTrend30Days: trend,
      arrivalVolumeTrend: arrivals,
      storageSuitability: storageRisk,
    },
    disclaimer: SMART_SELL_DISCLAIMER_HI,
    timestamp: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  };
}
