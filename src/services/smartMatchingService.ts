import { BuyerMatch, CropListing } from '../types/farmer';

export interface SmartMatchResult {
  buyer: BuyerMatch;
  crop: CropListing;
  matchScorePercent: number; // 0 - 100
  matchHeadline: string; // e.g. "94% Match – High demand – Nearby buyer – Suitable quantity"
  matchHighlights: string[];
  distanceKm: number;
  offeredPriceKg: number;
  farmerPriceKg: number;
  priceDeltaPercent: number;
  reliabilityScore: number; // e.g. 96/100
  isRecommended: boolean;
}

export function computeSmartMatches(
  crops: CropListing[],
  buyers: BuyerMatch[]
): SmartMatchResult[] {
  const results: SmartMatchResult[] = [];

  for (const crop of crops) {
    for (const buyer of buyers) {
      // 1. Crop type match
      const cropNorm = crop.name.toLowerCase();
      const buyerCropNorm = (buyer.requiredCrop || buyer.requiredVariety || '').toLowerCase();
      const isCropMatch =
        cropNorm.includes('wheat') && buyerCropNorm.includes('wheat') ||
        cropNorm.includes('chana') && buyerCropNorm.includes('chana') ||
        cropNorm.includes('rice') && buyerCropNorm.includes('rice') ||
        cropNorm.includes('mustard') && buyerCropNorm.includes('mustard') ||
        cropNorm.includes('maize') && buyerCropNorm.includes('maize') ||
        buyerCropNorm.includes(cropNorm) ||
        cropNorm.includes(buyerCropNorm);

      if (!isCropMatch && buyerCropNorm) {
        continue; // Skip completely mismatched crops
      }

      // 2. Quantity compatibility score (0 - 25 pts)
      const buyerQty = buyer.requiredQuantityKg || 5000;
      const farmerQty = crop.quantityKg || 2000;
      const qtyRatio = Math.min(farmerQty, buyerQty) / Math.max(farmerQty, buyerQty);
      const qtyScore = Math.round(qtyRatio * 25);

      // 3. Price alignment score (0 - 25 pts)
      const buyerPrice = buyer.offeredPrice || crop.expectedPrice * 0.98;
      const farmerPrice = crop.expectedPrice || 30;
      const priceDelta = ((buyerPrice - farmerPrice) / farmerPrice) * 100;
      let priceScore = 20;
      if (buyerPrice >= farmerPrice) priceScore = 25;
      else if (buyerPrice >= farmerPrice * 0.95) priceScore = 21;
      else if (buyerPrice >= farmerPrice * 0.90) priceScore = 16;
      else priceScore = 10;

      // 4. Distance score (0 - 20 pts)
      const dist = buyer.distanceKm || 15;
      let distScore = 20;
      if (dist <= 15) distScore = 20;
      else if (dist <= 30) distScore = 17;
      else if (dist <= 60) distScore = 13;
      else distScore = 8;

      // 5. Reliability / Trust factor (0 - 15 pts)
      const reliability = buyer.verified ? 15 : 10;

      // 6. Quality tier match (0 - 15 pts)
      const qualityScore = crop.grade === 'PREMIUM' ? 15 : 12;

      const totalScore = Math.min(99, Math.max(65, qtyScore + priceScore + distScore + reliability + qualityScore));

      // Compose highlights
      const highlights: string[] = [];
      if (dist <= 25) highlights.push(`नजदीकी खरीदार (${dist} किमी दूर)`);
      if (buyerPrice >= farmerPrice) highlights.push(`अपेक्षित भाव से अधिक (₹${buyerPrice}/kg)`);
      if (qtyRatio >= 0.7) highlights.push('समान लॉट मात्रा मांग');
      if (buyer.verified) highlights.push('सत्यापित व त्वरित एस्क्रो भुगतान');

      const headline = `${totalScore}% Match – ${
        buyerPrice >= farmerPrice ? 'High price' : 'High demand'
      } – ${dist <= 20 ? 'Nearby buyer' : 'Verified mill'} – Suitable lot`;

      results.push({
        buyer,
        crop,
        matchScorePercent: totalScore,
        matchHeadline: headline,
        matchHighlights: highlights,
        distanceKm: dist,
        offeredPriceKg: buyerPrice,
        farmerPriceKg: farmerPrice,
        priceDeltaPercent: Math.round(priceDelta * 10) / 10,
        reliabilityScore: buyer.verified ? 96 : 88,
        isRecommended: totalScore >= 88,
      });
    }
  }

  // Sort by highest matching score first
  return results.sort((a, b) => b.matchScorePercent - a.matchScorePercent);
}
