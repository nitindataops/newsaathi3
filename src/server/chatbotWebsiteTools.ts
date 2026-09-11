import {
  INITIAL_MARKETPLACE_PRODUCTS,
  INITIAL_FEATURED_FARMERS,
} from '../data/buyerData';
import {
  INITIAL_CROPS,
  INITIAL_FARMER_PROFILE,
  INITIAL_BUYER_ENQUIRIES,
} from '../data/farmerData';
import {
  CROP_VARIETIES_DATABASE,
  CROP_CATEGORIES,
} from '../data/cropVarieties';
import {
  searchOfficialMandiPrices,
  getMandiMetadata,
} from './providers/agmarknetProvider';
import {
  getAuthenticatedUser,
  getFarmerProfileByUserId,
  getBuyerProfileByUserId,
  getBuyerOrders,
  getBuyerRequirements,
  getBuyerMessageThreads,
  getAllMarketplaceListings,
  getMarketplaceFarmers,
  getFarmerCrops,
  buyerOrders,
} from './authService';
import { getPropertiesByFarmer } from './landVerificationService';
import { MarketplaceProduct, BuyerOrder, BuyerRequirement } from '../types/buyer';
import { CropListing, FarmerProfile } from '../types/farmer';
import { SupportAction } from '../types/support';

// ============================================================================
// COMMODITY & DISTRICT ALIAS MAPPINGS (HINDI / HINGLISH -> CANONICAL)
// ============================================================================

const CROP_ALIASES: Record<string, string> = {
  // 1. Wheat
  गेहूं: 'Wheat',
  गेहू: 'Wheat',
  gehu: 'Wheat',
  gehun: 'Wheat',
  gehoon: 'Wheat',
  wheat: 'Wheat',

  // 2. Rice / Paddy
  चावल: 'Rice',
  धान: 'Rice',
  chawal: 'Rice',
  dhan: 'Rice',
  rice: 'Rice',
  paddy: 'Rice',
  basmati: 'Rice',
  बासमती: 'Rice',

  // 3. Maize
  मक्का: 'Maize',
  makka: 'Maize',
  maize: 'Maize',
  corn: 'Maize',
  मकई: 'Maize',

  // 4. Pulses / Chana
  चना: 'Pulses',
  chana: 'Pulses',
  channa: 'Pulses',
  gram: 'Pulses',
  'bengal gram': 'Pulses',
  दलहन: 'Pulses',
  दाल: 'Pulses',
  pulses: 'Pulses',
  pulse: 'Pulses',
  moong: 'Pulses',
  मूंग: 'Pulses',
  urad: 'Pulses',
  उड़द: 'Pulses',
  arhar: 'Pulses',
  अरहर: 'Pulses',
  tur: 'Pulses',
  तुअर: 'Pulses',
  masoor: 'Pulses',
  मसूर: 'Pulses',
};

const DISTRICT_ALIASES: Record<string, string> = {
  बरेली: 'Bareilly',
  bareilly: 'Bareilly',
  bareli: 'Bareilly',
  पीलीभीत: 'Pilibhit',
  pilibhit: 'Pilibhit',
  बदायूं: 'Budaun',
  budaun: 'Budaun',
  मेरठ: 'Meerut',
  meerut: 'Meerut',
  आगरा: 'Agra',
  agra: 'Agra',
  वाराणसी: 'Varanasi',
  varanasi: 'Varanasi',
  banaras: 'Varanasi',
  लखनऊ: 'Lucknow',
  lucknow: 'Lucknow',
  गोरखपुर: 'Gorakhpur',
  gorakhpur: 'Gorakhpur',
  नासिक: 'Nashik',
  nashik: 'Nashik',
  लुधियाना: 'Ludhiana',
  ludhiana: 'Ludhiana',
  करनाल: 'Karnal',
  karnal: 'Karnal',
  इंदौर: 'Indore',
  indore: 'Indore',
  शिमला: 'Shimla',
  shimla: 'Shimla',
};

// ============================================================================
// 1. PUBLIC MARKETPLACE SEARCH TOOL
// ============================================================================

export interface MarketplaceSearchParams {
  crop?: string;
  variety?: string;
  grade?: string;
  maxPrice?: number;
  minPrice?: number;
  minQuantity?: number;
  location?: string;
  farmerName?: string;
  sortBy?: 'cheapest' | 'price_low' | 'price_high' | 'recommended';
  limit?: number;
}

export interface SanitizedMarketplaceItem {
  id: string;
  crop: string;
  variety: string;
  category: string;
  grade: string;
  pricePerKg: number;
  availableQuantityKg: number;
  minOrderQtyKg: number;
  location: string;
  district: string;
  state: string;
  farmerName: string; // Public business display name
  farmerRating: number;
  farmerVerified: boolean;
  nearestMandi: string;
  harvestDate?: string;
  storageType?: string;
  moistureContent?: string;
  smartBuyRecommendation?: string;
  purchaseOpportunityScore?: number;
}

export interface MarketplaceSearchResult {
  success: boolean;
  found: boolean;
  count: number;
  queryFilters: Partial<MarketplaceSearchParams>;
  items: SanitizedMarketplaceItem[];
  cheapestItem?: SanitizedMarketplaceItem;
  priceRange?: { min: number; max: number; average: number };
  dataSource: string;
  message?: string;
}

export function searchMarketplace(params: MarketplaceSearchParams): MarketplaceSearchResult {
  try {
    const centralListings = getAllMarketplaceListings();
    let list: MarketplaceProduct[] = centralListings.length > 0 ? centralListings : [...INITIAL_MARKETPLACE_PRODUCTS];

    // Crop match (handles aliases like "गेहूं", "tamatar", etc.)
    let canonicalCrop = params.crop?.trim();
    if (canonicalCrop) {
      const lowerCrop = canonicalCrop.toLowerCase();
      if (CROP_ALIASES[lowerCrop]) {
        canonicalCrop = CROP_ALIASES[lowerCrop];
      }
      list = list.filter((p) => {
        const pCrop = p.crop.toLowerCase();
        const pVariety = p.variety.toLowerCase();
        const target = canonicalCrop!.toLowerCase();
        return pCrop.includes(target) || pVariety.includes(target);
      });
    }

    // Variety match
    if (params.variety && params.variety.trim()) {
      const varTerm = params.variety.trim().toLowerCase();
      list = list.filter((p) => p.variety.toLowerCase().includes(varTerm));
    }

    // Grade match
    if (params.grade && params.grade.trim()) {
      const gradeTerm = params.grade.trim().toUpperCase();
      list = list.filter((p) => p.grade.toUpperCase() === gradeTerm);
    }

    // Price filters
    if (params.maxPrice !== undefined && params.maxPrice > 0) {
      list = list.filter((p) => p.pricePerKg <= params.maxPrice!);
    }
    if (params.minPrice !== undefined && params.minPrice > 0) {
      list = list.filter((p) => p.pricePerKg >= params.minPrice!);
    }

    // Quantity filter
    if (params.minQuantity !== undefined && params.minQuantity > 0) {
      list = list.filter((p) => p.availableQuantityKg >= params.minQuantity!);
    }

    // Location / District match
    if (params.location && params.location.trim()) {
      let locTerm = params.location.trim().toLowerCase();
      if (DISTRICT_ALIASES[locTerm]) {
        locTerm = DISTRICT_ALIASES[locTerm].toLowerCase();
      }
      list = list.filter(
        (p) =>
          p.location.toLowerCase().includes(locTerm) ||
          p.district?.toLowerCase().includes(locTerm) ||
          p.state?.toLowerCase().includes(locTerm)
      );
    }

    // Farmer Name match (if user asked about a specific public seller)
    if (params.farmerName && params.farmerName.trim()) {
      const farmerTerm = params.farmerName.trim().toLowerCase();
      list = list.filter((p) => p.farmerName.toLowerCase().includes(farmerTerm));
    }

    // Sorting
    const sort = params.sortBy || 'recommended';
    if (sort === 'cheapest' || sort === 'price_low') {
      list.sort((a, b) => a.pricePerKg - b.pricePerKg);
    } else if (sort === 'price_high') {
      list.sort((a, b) => b.pricePerKg - a.pricePerKg);
    } else {
      list.sort((a, b) => (b.purchaseOpportunityScore || 0) - (a.purchaseOpportunityScore || 0));
    }

    const count = list.length;
    const limit = params.limit || 8;
    const sliced = list.slice(0, limit);

    // Sanitize to public marketplace attributes strictly
    const sanitizedItems: SanitizedMarketplaceItem[] = sliced.map((p) => ({
      id: p.id,
      crop: p.crop,
      variety: p.variety,
      category: p.category,
      grade: p.grade,
      pricePerKg: p.pricePerKg,
      availableQuantityKg: p.availableQuantityKg,
      minOrderQtyKg: p.minOrderQtyKg,
      location: p.location,
      district: p.district,
      state: p.state,
      farmerName: p.farmerName,
      farmerRating: p.farmerRating,
      farmerVerified: p.farmerVerified,
      nearestMandi: p.nearestMandi,
      harvestDate: p.harvestDate,
      storageType: p.storageType,
      moistureContent: p.moistureContent,
      smartBuyRecommendation: p.smartBuyRecommendation,
      purchaseOpportunityScore: p.purchaseOpportunityScore,
    }));

    if (count === 0) {
      return {
        success: true,
        found: false,
        count: 0,
        queryFilters: params,
        items: [],
        dataSource: 'Live KisanSetu marketplace data',
        message: 'किसानसेतु वेबसाइट पर अभी इस फ़िल्टर के लिए कोई सक्रिय लिस्टिंग उपलब्ध नहीं है।',
      };
    }

    const prices = list.map((i) => i.pricePerKg);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 10) / 10;

    // Find the cheapest listing in the whole filtered result
    const cheapest = [...list].sort((a, b) => a.pricePerKg - b.pricePerKg)[0];

    return {
      success: true,
      found: true,
      count,
      queryFilters: params,
      items: sanitizedItems,
      cheapestItem: cheapest
        ? {
            id: cheapest.id,
            crop: cheapest.crop,
            variety: cheapest.variety,
            category: cheapest.category,
            grade: cheapest.grade,
            pricePerKg: cheapest.pricePerKg,
            availableQuantityKg: cheapest.availableQuantityKg,
            minOrderQtyKg: cheapest.minOrderQtyKg,
            location: cheapest.location,
            district: cheapest.district,
            state: cheapest.state,
            farmerName: cheapest.farmerName,
            farmerRating: cheapest.farmerRating,
            farmerVerified: cheapest.farmerVerified,
            nearestMandi: cheapest.nearestMandi,
            harvestDate: cheapest.harvestDate,
            storageType: cheapest.storageType,
            moistureContent: cheapest.moistureContent,
            smartBuyRecommendation: cheapest.smartBuyRecommendation,
            purchaseOpportunityScore: cheapest.purchaseOpportunityScore,
          }
        : undefined,
      priceRange: {
        min: minPrice,
        max: maxPrice,
        average: avgPrice,
      },
      dataSource: 'Live KisanSetu marketplace data',
    };
  } catch (error: any) {
    console.error('Error in searchMarketplace:', error);
    return {
      success: false,
      found: false,
      count: 0,
      queryFilters: params,
      items: [],
      dataSource: 'Live KisanSetu marketplace data',
      message: 'अभी यह जानकारी वेबसाइट से प्राप्त नहीं हो पा रही है। कृपया थोड़ी देर बाद फिर प्रयास करें।',
    };
  }
}

// ============================================================================
// 2. OFFICIAL MANDI RATES TOOL (AGMARKNET)
// ============================================================================

export interface MandiPriceQueryParams {
  commodity: string;
  district?: string;
  state?: string;
  market?: string;
  variety?: string;
}

export interface MandiRateResult {
  success: boolean;
  found: boolean;
  commodity: string;
  district?: string;
  state?: string;
  records: Array<{
    state: string;
    district: string;
    market: string;
    commodity: string;
    variety: string;
    minPrice: number;
    maxPrice: number;
    modalPrice: number;
    arrivalDate: string;
  }>;
  summary?: {
    minPrice: number;
    maxPrice: number;
    modalPrice: number;
    market: string;
    district: string;
    arrivalDate: string;
  };
  dataSource: string;
  message?: string;
}

export async function getMandiPrice(
  paramsOrCommodity: MandiPriceQueryParams | string,
  maybeDistrict?: string
): Promise<MandiRateResult> {
  const params: MandiPriceQueryParams =
    typeof paramsOrCommodity === 'string'
      ? { commodity: paramsOrCommodity, district: maybeDistrict }
      : paramsOrCommodity || { commodity: 'Wheat' };

  try {
    let commodityTerm = (params.commodity || 'Wheat').trim();
    const lowerComm = commodityTerm.toLowerCase();
    if (CROP_ALIASES[lowerComm]) {
      commodityTerm = CROP_ALIASES[lowerComm];
    }

    let districtTerm = params.district?.trim();
    if (districtTerm) {
      const lowerDist = districtTerm.toLowerCase();
      if (DISTRICT_ALIASES[lowerDist]) {
        districtTerm = DISTRICT_ALIASES[lowerDist];
      }
    }

    const stateTerm = params.state?.trim() || 'Uttar Pradesh';

    const searchRes = await searchOfficialMandiPrices({
      commodity: commodityTerm,
      district: districtTerm,
      state: stateTerm,
      market: params.market,
      variety: params.variety,
      limit: 5,
    });

    if (!searchRes || !searchRes.records || searchRes.records.length === 0) {
      // Try relaxed search without district if district yielded no records
      if (districtTerm) {
        const relaxedRes = await searchOfficialMandiPrices({
          commodity: commodityTerm,
          state: stateTerm,
          limit: 5,
        });
        if (relaxedRes && relaxedRes.records && relaxedRes.records.length > 0) {
          const rec = relaxedRes.records[0];
          return {
            success: true,
            found: true,
            commodity: commodityTerm,
            district: rec.district,
            state: rec.state,
            records: relaxedRes.records.map((r) => ({
              state: r.state,
              district: r.district,
              market: r.market,
              commodity: r.commodity,
              variety: r.variety,
              minPrice: r.minPriceQuintal,
              maxPrice: r.maxPriceQuintal,
              modalPrice: r.modalPriceQuintal,
              arrivalDate: r.arrivalDate,
            })),
            summary: {
              minPrice: rec.minPriceQuintal,
              maxPrice: rec.maxPriceQuintal,
              modalPrice: rec.modalPriceQuintal,
              market: rec.market,
              district: rec.district,
              arrivalDate: rec.arrivalDate,
            },
            dataSource: 'Source: Government mandi data / AGMARKNET',
          };
        }
      }

      return {
        success: true,
        found: false,
        commodity: commodityTerm,
        district: districtTerm,
        state: stateTerm,
        records: [],
        dataSource: 'Source: Government mandi data / AGMARKNET',
        message: 'इस समय इस फ़िल्टर के लिए सरकारी मंडी डेटा उपलब्ध नहीं है।',
      };
    }

    const primary = searchRes.records[0];
    return {
      success: true,
      found: true,
      commodity: commodityTerm,
      district: primary.district,
      state: primary.state,
      records: searchRes.records.map((r) => ({
        state: r.state,
        district: r.district,
        market: r.market,
        commodity: r.commodity,
        variety: r.variety,
        minPrice: r.minPriceQuintal,
        maxPrice: r.maxPriceQuintal,
        modalPrice: r.modalPriceQuintal,
        arrivalDate: r.arrivalDate,
      })),
      summary: {
        minPrice: primary.minPriceQuintal,
        maxPrice: primary.maxPriceQuintal,
        modalPrice: primary.modalPriceQuintal,
        market: primary.market,
        district: primary.district,
        arrivalDate: primary.arrivalDate,
      },
      dataSource: 'Source: Government mandi data / AGMARKNET',
    };
  } catch (error: any) {
    console.error('Error in getMandiPrice:', error);
    return {
      success: false,
      found: false,
      commodity: params.commodity,
      records: [],
      dataSource: 'Source: Government mandi data / AGMARKNET',
      message: 'इस समय इस फ़िल्टर के लिए सरकारी मंडी डेटा उपलब्ध नहीं है।',
    };
  }
}

// ============================================================================
// 3. AUTHENTICATED USER DATA TOOL (STRICTLY ISOLATED & AUTHORIZED)
// ============================================================================

export interface AuthenticatedUserDataParams {
  authToken?: string;
  contextUserId?: string;
  contextUserRole?: string;
  dataType?: 'profile' | 'crops' | 'orders' | 'requirements' | 'properties' | 'enquiries' | 'all';
}

export interface AuthenticatedUserDataResult {
  authenticated: boolean;
  role?: 'farmer' | 'buyer';
  userId?: string;
  userName?: string;
  profile?: any;
  crops?: CropListing[];
  orders?: BuyerOrder[];
  requirements?: BuyerRequirement[];
  properties?: any[];
  enquiries?: any[];
  dataSource: string;
  message?: string;
}

export function getAuthenticatedUserData(params: AuthenticatedUserDataParams): AuthenticatedUserDataResult {
  try {
    // 1. Resolve session via token if provided
    let sessionUser: any = null;
    if (params.authToken) {
      sessionUser = getAuthenticatedUser(params.authToken);
    }

    const effectiveRole = sessionUser?.role || params.contextUserRole;
    const effectiveUserId = sessionUser?.userId || params.contextUserId;

    if (!effectiveUserId || effectiveUserId === 'guest' || effectiveUserId === 'guest_user' || !effectiveRole) {
      return {
        authenticated: false,
        dataSource: 'KisanSetu Authenticated User Store',
        message: 'आप अभी लॉगिन नहीं हैं। अपनी निजी जानकारी, ऑर्डर्स या फसलें देखने के लिए कृपया पहले किसान या खरीदार के रूप में लॉगिन करें।',
      };
    }

    // FARMER DATA
    if (effectiveRole === 'farmer') {
      const farmerProfile = getFarmerProfileByUserId(effectiveUserId) || {
        ...INITIAL_FARMER_PROFILE,
        farmerId: effectiveUserId,
      };

      const farmerId = farmerProfile.farmerId || effectiveUserId;
      const properties = getPropertiesByFarmer(farmerId);

      // Farmer crops: Retrieve real listings
      let farmerCrops = getFarmerCrops(farmerId);
      if (!farmerCrops || farmerCrops.length === 0) {
        farmerCrops = INITIAL_CROPS.filter(
          (c) => c.location.toLowerCase().includes('bareilly') || !c.status.includes('Archive')
        );
      }

      // Farmer orders: Retrieve from buyerOrders
      const allOrders: BuyerOrder[] = [];
      for (const orderList of buyerOrders.values()) {
        allOrders.push(...orderList);
      }
      const farmerOrders = allOrders.filter(
        (o) =>
          o.farmerId === farmerId ||
          o.farmerId === effectiveUserId ||
          o.farmerName === farmerProfile.name ||
          (o as any).items?.some((it: any) => it.farmerId === farmerId || it.farmerId === effectiveUserId)
      );

      return {
        authenticated: true,
        role: 'farmer',
        userId: effectiveUserId,
        userName: farmerProfile.name,
        profile: {
          name: farmerProfile.name,
          farmerId: farmerProfile.farmerId,
          mobile: farmerProfile.mobile,
          location: `${farmerProfile.village}, ${farmerProfile.tehsil}, ${farmerProfile.district}`,
          district: farmerProfile.district,
          state: 'Uttar Pradesh',
          landAreaAcres: farmerProfile.landAreaAcres,
          primaryCrops: farmerProfile.primaryCrops,
          eKycStatus: farmerProfile.eKycStatus,
          kccStatus: farmerProfile.kccStatus,
          soilHealthStatus: farmerProfile.soilHealthStatus,
          memberSince: farmerProfile.memberSince,
        },
        crops: farmerCrops,
        orders: farmerOrders,
        properties: properties.map((p) => ({
          id: p.id,
          district: p.district,
          tehsil: p.tehsil,
          village: p.village,
          gataNumber: p.gataNumber,
          khatauniNumber: p.khatauniNumber,
          landArea: p.landArea,
          landAreaUnit: p.landAreaUnit,
          status: p.status,
          statusNotes: p.statusNotes,
        })),
        enquiries: INITIAL_BUYER_ENQUIRIES,
        dataSource: 'Live authenticated farmer profile & inventory',
      };
    }

    // BUYER DATA
    if (effectiveRole === 'buyer') {
      const buyerProfile = getBuyerProfileByUserId(effectiveUserId);
      const buyerId = buyerProfile?.id || effectiveUserId;
      const orders = getBuyerOrders(buyerId);
      const requirements = getBuyerRequirements(buyerId);

      return {
        authenticated: true,
        role: 'buyer',
        userId: effectiveUserId,
        userName: buyerProfile?.name || 'Authorized Buyer',
        profile: buyerProfile
          ? {
              id: buyerProfile.id,
              name: buyerProfile.name,
              businessName: buyerProfile.businessName,
              businessType: buyerProfile.businessType,
              location: buyerProfile.location,
              district: buyerProfile.district,
              verified: buyerProfile.verified,
              memberSince: buyerProfile.memberSince,
              preferredCrops: buyerProfile.preferredCrops,
            }
          : undefined,
        orders: orders || [],
        requirements: requirements || [],
        dataSource: 'Live authenticated buyer orders & requirements',
      };
    }

    return {
      authenticated: false,
      dataSource: 'KisanSetu Authenticated User Store',
      message: 'अनजान उपयोगकर्ता भूमिका। कृपया किसान या खरीदार के रूप में पुनः लॉगिन करें।',
    };
  } catch (error: any) {
    console.error('Error in getAuthenticatedUserData:', error);
    return {
      authenticated: false,
      dataSource: 'KisanSetu Authenticated User Store',
      message: 'अभी यह जानकारी वेबसाइट से प्राप्त नहीं हो पा रही है। कृपया थोड़ी देर बाद फिर प्रयास करें।',
    };
  }
}

// ============================================================================
// 4. PRIVACY RULES CHECKER (PREVENTS LEAKING OTHER USERS' PRIVATE DATA)
// ============================================================================

export function checkPrivacyViolation(query: string): { violated: boolean; reason?: string } {
  const q = query.toLowerCase();

  // Questions asking for personal phone numbers of farmers / buyers
  const asksPhone =
    (q.includes('mobile') || q.includes('phone') || q.includes('नंबर') || q.includes('number') || q.includes('contact')) &&
    (q.includes('farmer') || q.includes('kisan') || q.includes('किसान') || q.includes('buyer') || q.includes('rajesh') || q.includes('suresh') || q.includes('vikram') || q.includes('dusre'));

  // Questions asking for personal bank details or Aadhaar
  const asksFinancial =
    q.includes('aadhaar') ||
    q.includes('आधार') ||
    q.includes('bank account') ||
    q.includes('खाता संख्या') ||
    q.includes('ifsc') ||
    q.includes('pan card') ||
    q.includes('पैन');

  // Questions asking for another user's private orders
  const asksOtherOrders =
    (q.includes('dusre') || q.includes('other') || q.includes('kisi aur') || q.includes('rajesh') || q.includes('vikram')) &&
    (q.includes('order') || q.includes('ऑर्डर') || q.includes('kamai') || q.includes('earning'));

  if (asksPhone || asksFinancial || asksOtherOrders) {
    return {
      violated: true,
      reason:
        'गोपनीयता और डेटा सुरक्षा नीति के अनुसार, किसानसेतु किसी भी अन्य किसान या उपयोगकर्ता की व्यक्तिगत संपर्क जानकारी (मोबाइल नंबर, आधार या बैंक विवरण) या निजी ऑर्डर्स साझा नहीं करता है। आप मार्केटप्लेस लिस्टिंग के माध्यम से सीधे संदेश भेजकर या अधिकृत सहायता डेस्क से संपर्क कर सकते हैं।',
    };
  }

  return { violated: false };
}

// ============================================================================
// 5. CROP VARIETIES & GRADES TOOL
// ============================================================================

export function getCropVarieties(cropName: string): {
  success: boolean;
  crop?: string;
  category?: string;
  varieties: Array<{ name: string; nameHi: string; gradeReference?: string }>;
  standardMoisture?: string;
  standardStorage?: string;
  dataSource: string;
} {
  try {
    let search = cropName.trim();
    const lower = search.toLowerCase();
    if (CROP_ALIASES[lower]) {
      search = CROP_ALIASES[lower];
    }

    const found = CROP_VARIETIES_DATABASE.find(
      (c) =>
        c.name.toLowerCase() === search.toLowerCase() ||
        c.nameHi.includes(search) ||
        c.mandiCommodityName.toLowerCase() === search.toLowerCase()
    );

    if (!found) {
      return {
        success: false,
        varieties: [],
        dataSource: 'KisanSetu Crop Variety Catalog',
      };
    }

    return {
      success: true,
      crop: found.name,
      category: found.category,
      varieties: found.varieties,
      standardMoisture: found.standardMoisture,
      standardStorage: found.standardStorage,
      dataSource: 'KisanSetu Crop Variety Catalog',
    };
  } catch (err) {
    return {
      success: false,
      varieties: [],
      dataSource: 'KisanSetu Crop Variety Catalog',
    };
  }
}

// ============================================================================
// 6. WEBSITE NAVIGATION & FEATURE GUIDANCE TOOL
// ============================================================================

export interface NavigationGuidance {
  topic: string;
  instructionsHi: string;
  instructionsEn: string;
  suggestedAction: SupportAction;
}

export function getWebsiteNavigationHelp(query: string): NavigationGuidance | null {
  const q = query.toLowerCase();

  if (q.includes('add crop') || q.includes('फसल जोड़') || q.includes('list crop') || q.includes('fasal kaise beche') || q.includes('sell crop')) {
    return {
      topic: 'Add Crop Listing',
      instructionsHi: 'फसल बेचने के लिए किसान डैशबोर्ड पर जाएं और ऊपर दाईं ओर स्थित "फसल जोड़ें (Add Crop)" बटन पर क्लिक करें। फसल का नाम, किस्म, मात्रा, ग्रेड और फ़ोटो अपलोड करके लिस्टिंग सक्रिय करें।',
      instructionsEn: 'To list your produce for sale, go to the Farmer Dashboard and click "Add Crop". Enter the crop name, variety, quantity, expected price, and upload produce photos.',
      suggestedAction: {
        id: 'act_nav_add_crop',
        label: 'Go to Add Crop',
        labelHi: 'फसल जोड़ें पर जाएं',
        actionType: 'NAVIGATE_ADD_CROP',
      },
    };
  }

  if (q.includes('post requirement') || q.includes('खरीद मांग') || q.includes('requirement kaise')) {
    return {
      topic: 'Post Buyer Requirement',
      instructionsHi: 'खरीद मांग दर्ज करने के लिए खरीदार डैशबोर्ड (Buyer Portal) पर जाएं और "Post Requirement" बटन पर क्लिक करें। अपनी आवश्यक फसल, मात्रा, अपेक्षित मूल्य और डिलीवरी स्थान दर्ज करें।',
      instructionsEn: 'To post a procurement requirement, open the Buyer Dashboard and click "Post Requirement". Specify the required crop, quantity, budget, and destination.',
      suggestedAction: {
        id: 'act_nav_req',
        label: 'Post Requirement',
        labelHi: 'मांग दर्ज करें',
        actionType: 'NAVIGATE_REQUIREMENTS',
      },
    };
  }

  if (q.includes('bhulekh') || q.includes('भूलेख') || q.includes('khatauni') || q.includes('खतौनी') || q.includes('gata') || q.includes('property') || q.includes('जमीन')) {
    return {
      topic: 'Land Records & Bhulekh',
      instructionsHi: 'किसानसेतु में अपनी जमीन के रिकॉर्ड देखने के लिए किसान डैशबोर्ड के "Property & Land Records" टैब में जाएं। आधिकारिक यूपी भूलेख सत्यापन के लिए दिए गए लिंक (upbhulekh.gov.in) पर जाकर अपनी खतौनी देख सकते हैं।',
      instructionsEn: 'To view your registered land holdings, open the "Property & Land Records" tab in the Farmer Dashboard. You can also verify official records via the UP Bhulekh portal link.',
      suggestedAction: {
        id: 'act_nav_prop',
        label: 'View Land Records',
        labelHi: 'जमीन रिकॉर्ड देखें',
        actionType: 'NAVIGATE_PROPERTY',
      },
    };
  }

  if (q.includes('order') || q.includes('ऑर्डर') || q.includes('tracking') || q.includes('डिलीवरी')) {
    return {
      topic: 'Order Tracking',
      instructionsHi: 'अपने ऑर्डर्स की लाइव स्थिति और डिलीवरी ट्रैकिंग देखने के लिए पोर्टल के "Orders" टैब पर क्लिक करें। यहाँ आपको हर ऑर्डर का बैच नंबर, वाहन विवरण और एस्क्रो भुगतान स्थिति मिलेगी।',
      instructionsEn: 'To view your orders and live tracking, click on the "Orders" tab. You can inspect batch traceability, dispatch timeline, and escrow payment protection.',
      suggestedAction: {
        id: 'act_nav_orders',
        label: 'Open Orders',
        labelHi: 'ऑर्डर देखें',
        actionType: 'NAVIGATE_ORDERS',
      },
    };
  }

  if (q.includes('mandi') || q.includes('मंडी भाव') || q.includes('mandi rate') || q.includes('apmc')) {
    return {
      topic: 'Mandi Intelligence',
      instructionsHi: 'नवीनतम सरकारी और एपीएमसी मंडी भाव देखने के लिए पोर्टल के "Mandi Intelligence" सेक्शन पर जाएं। यहाँ जिलेवार और फसलवार आधिकारिक AGMARKNET डेटा उपलब्ध है।',
      instructionsEn: 'To check official daily APMC market prices, open the Mandi Intelligence tab to see live AGMARKNET wholesale rates across districts.',
      suggestedAction: {
        id: 'act_nav_mandi',
        label: 'Mandi Intelligence',
        labelHi: 'मंडी भाव देखें',
        actionType: 'NAVIGATE_MANDI',
      },
    };
  }

  if (q.includes('marketplace') || q.includes('खरीदना') || q.includes('buy crop') || q.includes('market')) {
    return {
      topic: 'Marketplace',
      instructionsHi: 'सत्यापित किसानों से सीधी खरीद के लिए किसानसेतु "Marketplace" पर जाएं। वहाँ आप फसल, किस्म, ग्रेड और मूल्य के आधार पर फ़िल्टर कर सकते हैं।',
      instructionsEn: 'To browse verified farm listings directly from farmers, visit the Marketplace. You can filter by crop, variety, grade, price, and distance.',
      suggestedAction: {
        id: 'act_nav_market',
        label: 'Open Marketplace',
        labelHi: 'मार्केटप्लेस खोलें',
        actionType: 'NAVIGATE_MARKETPLACE',
      },
    };
  }

  return null;
}

// ============================================================================
// 7. COMPREHENSIVE INTENT ANALYZER & LIVE DATA DISPATCHER
// ============================================================================

export type ChatbotIntent =
  | 'SELL_TO_BUYER'
  | 'SELL_MY_HARVEST'
  | 'ADD_CROP'
  | 'EDIT_MY_LISTING'
  | 'DELETE_MY_LISTING'
  | 'CONTACT_BUYER'
  | 'FIND_BUYER'
  | 'VIEW_MY_CROPS'
  | 'VIEW_MY_PROFILE'
  | 'VIEW_MY_ORDERS'
  | 'VIEW_ORDER_STATUS'
  | 'OPEN_MARKETPLACE'
  | 'OPEN_MANDI_RATES'
  | 'OPEN_MESSAGES'
  | 'OPEN_SETTINGS'
  | 'CHANGE_LANGUAGE';

export interface ToolExecutionResult {
  toolExecuted: string;
  success: boolean;
  data: any;
  groundedExplanation?: string;
  suggestedActions: SupportAction[];
  dataSource: string;
  requiresClarification?: boolean;
}

export function detectDeterministicIntent(query: string): ChatbotIntent | null {
  const q = query.toLowerCase().trim();

  // 1. Language change
  if (
    q.includes('change language') ||
    q.includes('select language') ||
    q.includes('switch language') ||
    q.includes('bhasha badlo') ||
    q.includes('bhasha change') ||
    q.includes('language change') ||
    q.includes('boli badlo') ||
    q.includes('भाषा बदलो') ||
    q.includes('भाषा बदलें') ||
    q.includes('भाषा बदलिए') ||
    q.includes('ਬੋਲੀ ਬਦਲੋ') ||
    q.includes('భాషను మార్చండి') ||
    q.includes('மொழியை மாற்றவும்')
  ) {
    return 'CHANGE_LANGUAGE';
  }

  // 2. Open Settings
  if (
    q.includes('open settings') ||
    q.includes('go to settings') ||
    q.includes('app settings') ||
    q.includes('account settings') ||
    q.includes('setting kholein') ||
    q.includes('settings kholein') ||
    q.includes('सेटिंग खोलें') ||
    q.includes('सेटिंग्स') ||
    q === 'settings' ||
    q === 'setting'
  ) {
    return 'OPEN_SETTINGS';
  }

  // 3. Open Messages / Chat
  if (
    q.includes('open messages') ||
    q.includes('open message') ||
    q.includes('open chat') ||
    q.includes('go to chat') ||
    q.includes('sandesh') ||
    q.includes('संदेश') ||
    q.includes('मैसेज खोलें') ||
    q.includes('मैसेज') ||
    q === 'messages' ||
    q === 'message' ||
    q === 'chat' ||
    q === 'inbox'
  ) {
    return 'OPEN_MESSAGES';
  }

  // 4. Contact Buyer
  if (
    q.includes('contact buyer') ||
    q.includes('message buyer') ||
    q.includes('call buyer') ||
    q.includes('buyer se baat') ||
    q.includes('buyer se contact') ||
    q.includes('buyer ko call') ||
    q.includes('buyer ko message') ||
    q.includes('kharidar se baat') ||
    q.includes('kharidar ko call') ||
    q.includes('खरीदार से बात') ||
    q.includes('खरीदार से संपर्क')
  ) {
    return 'CONTACT_BUYER';
  }

  // 5. Find Buyer
  if (
    q.includes('find buyer') ||
    q.includes('search buyer') ||
    q.includes('look for buyer') ||
    q.includes('buyer dhundo') ||
    q.includes('buyer dhoondo') ||
    q.includes('buyer khojo') ||
    q.includes('buyer search') ||
    q.includes('kharidar khojo') ||
    q.includes('kharidar dhundo') ||
    q.includes('buyer chahiye') ||
    q.includes('buyer kaise milega') ||
    q.includes('खरीदार खोजें') ||
    q.includes('खरीदार ढूंढो') ||
    q.includes('खरीदार चाहिए')
  ) {
    return 'FIND_BUYER';
  }

  // 6. Delete Listing
  if (
    q.includes('delete my listing') ||
    q.includes('delete listing') ||
    q.includes('remove listing') ||
    q.includes('delete crop') ||
    q.includes('listing delete') ||
    q.includes('listing hatao') ||
    q.includes('fasal hatao') ||
    q.includes('लिस्टिंग हटाएं') ||
    q.includes('लिस्टिंग हटाओ') ||
    q.includes('फसल हटाएं')
  ) {
    return 'DELETE_MY_LISTING';
  }

  // 7. Edit Listing
  if (
    q.includes('edit my listing') ||
    q.includes('edit listing') ||
    q.includes('update listing') ||
    q.includes('edit crop') ||
    q.includes('listing edit') ||
    q.includes('price badlo') ||
    q.includes('rate badlo') ||
    q.includes('मात्रा बदलो') ||
    q.includes('रेट बदलो') ||
    q.includes('लिस्टिंग एडिट') ||
    q.includes('लिस्टिंग बदलें') ||
    q.includes('लिस्टिंग बदलो')
  ) {
    return 'EDIT_MY_LISTING';
  }

  // 7b. Direct Selling to Buyers on Kisan Saathi / Marketplace (Core Identity)
  // E.g.: "क्या मैं अपनी फसल किसान साथी पर buyer को बेच सकता हूँ?", "Can I sell my crop directly to a buyer?",
  // "क्या किसान साथी पर फसल बेच सकते हैं?", "How can I sell my wheat to a buyer?"
  if (
    ((q.includes('बेच') || q.includes('bech') || q.includes('sell') || q.includes('sale') || q.includes('listing') || q.includes('लिस्टिंग')) &&
      (q.includes('buyer') ||
        q.includes('खरीदार') ||
        q.includes('vyapari') ||
        q.includes('व्यापारी') ||
        q.includes('सकता हूँ') ||
        q.includes('सकती हूँ') ||
        q.includes('सकते हैं') ||
        q.includes('सकते') ||
        q.includes('sakta') ||
        q.includes('sakte') ||
        q.includes('kaise') ||
        q.includes('how to') ||
        q.includes('how can i') ||
        q.includes('direct') ||
        q.includes('सीधे') ||
        q.includes('kisan saathi') ||
        q.includes('किसान साथी') ||
        q.includes('kisansetu') ||
        q.includes('platform') ||
        q.includes('वेबसाइट') ||
        q.includes('website'))) ||
    q.includes('buyer ko bech') ||
    q.includes('buyers ko bech') ||
    q.includes('खरीदार को बेच') ||
    q.includes('buyer को बेच') ||
    q.includes('buyer ko') ||
    q.includes('buyers ko') ||
    q.includes('खरीदारों को')
  ) {
    return 'SELL_TO_BUYER';
  }

  // 8. Add Crop / Sell My Harvest
  if (
    q.includes('add crop') ||
    q.includes('list crop') ||
    q.includes('new crop') ||
    q.includes('crop add') ||
    q.includes('fasal jodo') ||
    q.includes('nayee fasal') ||
    q.includes('नई फसल') ||
    q.includes('फसल जोड़ें') ||
    q.includes('फसल जोड़ो') ||
    q.includes('फसल लिस्ट करें')
  ) {
    return 'ADD_CROP';
  }

  if (
    q.includes('sell my harvest') ||
    q.includes('sell harvest') ||
    q.includes('sell crop') ||
    q.includes('sell produce') ||
    q.includes('sell') ||
    q.includes('fasal bech') ||
    q.includes('bechni hai') ||
    q.includes('bechna hai') ||
    q.includes('bechna') ||
    q.includes('becho') ||
    q.includes('harvest bechna') ||
    q.includes('अपनी फसल बेच') ||
    q.includes('फसल बेच') ||
    q.includes('फसल बेचना') ||
    q.includes('फसल बेचनी') ||
    q.includes('बेचना') ||
    q.includes('बेचनी') ||
    q.includes('बेचें')
  ) {
    return 'SELL_MY_HARVEST';
  }

  // 9. View My Crops
  if (
    q.includes('view my crops') ||
    q.includes('my crops') ||
    q.includes('mere crops') ||
    q.includes('meri fasal') ||
    q.includes('meri listing') ||
    q.includes('my listings') ||
    q.includes('meri fasalein') ||
    q.includes('मेरी फसलें') ||
    q.includes('मेरी लिस्टिंग') ||
    q.includes('मेरे क्रॉप्स') ||
    q.includes('मेरी फसल') ||
    q.includes('crops dikhao') ||
    q.includes('fasal dikhao') ||
    q === 'crops' ||
    q === 'my crop'
  ) {
    return 'VIEW_MY_CROPS';
  }

  // 10. View My Profile
  if (
    q.includes('view my profile') ||
    q.includes('my profile') ||
    q.includes('mera profile') ||
    q.includes('meri profile') ||
    q.includes('profile dikhao') ||
    q.includes('मेरी प्रोफाइल') ||
    q.includes('मेरा प्रोफाइल') ||
    q.includes('प्रोफाइल दिखाओ') ||
    q === 'profile' ||
    q === 'my account' ||
    q === 'account'
  ) {
    return 'VIEW_MY_PROFILE';
  }

  // 11. View Order Status / Tracking
  if (
    q.includes('view order status') ||
    q.includes('order status') ||
    q.includes('track order') ||
    q.includes('order tracking') ||
    q.includes('delivery status') ||
    q.includes('dispatch status') ||
    q.includes('ऑर्डर स्टेटस') ||
    q.includes('ऑर्डर स्थिति') ||
    q.includes('ऑर्डर ट्रैकिंग') ||
    q.includes('ट्रैकिंग') ||
    q.includes('डिलीवरी स्थिति')
  ) {
    return 'VIEW_ORDER_STATUS';
  }

  // 12. View My Orders
  if (
    q.includes('view my orders') ||
    q.includes('my orders') ||
    q.includes('mere orders') ||
    q.includes('mere order') ||
    q.includes('orders dikhao') ||
    q.includes('मेरे ऑर्डर') ||
    q.includes('मेरे ऑर्डर्स') ||
    q.includes('ऑर्डर्स दिखाओ') ||
    q === 'orders' ||
    q === 'order' ||
    q === 'my order'
  ) {
    return 'VIEW_MY_ORDERS';
  }

  // 13. Open Marketplace
  if (
    q.includes('open marketplace') ||
    q.includes('go to marketplace') ||
    q.includes('open market') ||
    q.includes('browse marketplace') ||
    q.includes('marketplace kholein') ||
    q.includes('मार्केटप्लेस खोलें') ||
    q.includes('मार्केटप्लेस') ||
    q.includes('bazar kholein') ||
    q.includes('बाजार') ||
    q === 'marketplace' ||
    q === 'market'
  ) {
    return 'OPEN_MARKETPLACE';
  }

  // 14. Mandi Rates (when general / request to view mandi rates)
  if (
    q.includes('open mandi rates') ||
    q.includes('mandi rate batao') ||
    q.includes('mandi rates') ||
    q.includes('mandi bhav') ||
    q.includes('bhav batao') ||
    q.includes('rate batao') ||
    q.includes('मंडी भाव') ||
    q.includes('भाव बताओ') ||
    q.includes('रेट बताओ') ||
    q === 'mandi' ||
    q === 'mandi rate' ||
    q === 'bhav'
  ) {
    return 'OPEN_MANDI_RATES';
  }

  return null;
}

export async function handleDeterministicIntent(
  intent: ChatbotIntent,
  targetLang: string,
  authContext: { token?: string; userId?: string; userRole?: string },
  userQuery: string
): Promise<ToolExecutionResult> {
  const lang = targetLang || 'hi';

  // Helper for multi-language string generation
  const t = (texts: {
    hi: string;
    en: string;
    pa?: string;
    hr?: string;
    te?: string;
    ta?: string;
    hinglish?: string;
  }): string => {
    if (lang === 'en') return texts.en;
    if (lang === 'pa' && texts.pa) return texts.pa;
    if (lang === 'hr' && texts.hr) return texts.hr;
    if (lang === 'te' && texts.te) return texts.te;
    if (lang === 'ta' && texts.ta) return texts.ta;
    if (lang === 'hinglish' && texts.hinglish) return texts.hinglish;
    return texts.hi; // Default Hindi
  };

  switch (intent) {
    case 'SELL_TO_BUYER': {
      const explanation = t({
        hi: 'हाँ, किसान साथी पर किसान अपनी फसल की listing बनाकर उपलब्ध buyers तक सीधे पहुँच सकते हैं। आप अपनी फसल, मात्रा, गुणवत्ता और अन्य आवश्यक जानकारी दर्ज करके listing बना सकते हैं। Buyer आपकी listing देखकर enquiry/order कर सकता है।\n\nफसल बेचने की आसान प्रक्रिया:\n1. किसान के रूप में लॉगिन करें\n2. किसान डैशबोर्ड में "फसल जोड़ें (Add Crop)" पर जाएं\n3. फसल का नाम, किस्म, कुल मात्रा (किग्रा), अपेक्षित मूल्य और फ़ोटो दर्ज करें\n4. लिस्टिंग बनाएं / डिजिटल लॉट पासपोर्ट जारी करें\n5. सत्यापित खरीदार आपकी लिस्टिंग देखकर सीधे पूछताछ या खरीद ऑर्डर भेजते हैं\n6. डैशबोर्ड से एस्क्रो पेमेंट सुरक्षा के साथ ऑर्डर स्वीकार व प्रबंधित करें',
        en: 'Yes! On Kisan Saathi, farmers can list their crops and sell them directly to verified buyers. You can create a crop listing with variety, quantity, quality details, and expected price. Verified buyers browse your listing and send direct inquiries or purchase orders with Mandi Escrow payment protection.\n\nSteps to Sell:\n1. Login as a Farmer\n2. Go to Farmer Dashboard / "Add Crop"\n3. Enter crop details (crop, variety, quantity, expected price, photos)\n4. Create listing / Digital Crop Lot Passport\n5. Verified buyers view your listing and send enquiries or orders\n6. Manage orders and negotiations in your dashboard',
        hinglish: 'Haan, Kisan Saathi par kisan apni fasal ki listing banakar registered verified buyers ko directly bech sakte hain. Aap apni fasal, quantity, quality aur expected rate enter karke listing bana sakte hain. Buyers aapki listing dekhkar direct enquiry aur order bhejte hain.\n\nBechne ke aasan steps:\n1. Farmer account me Login karein\n2. Farmer Dashboard me "Add Crop" par jayein\n3. Fasal ki variety, quantity, rate aur photos dalein\n4. Listing publish karein\n5. Verified buyers aapki listing dekhkar enquiry/order bhejenge\n6. Dashboard me orders accept karke secure payment receive karein',
        pa: "ਹਾਂ, ਕਿਸਾਨ ਸਾਥੀ 'ਤੇ ਕਿਸਾਨ ਆਪਣੀ ਫਸਲ ਦੀ ਲਿਸਟਿੰਗ ਬਣਾ ਕੇ ਸਿੱਧੇ ਤਸਦੀਕਸ਼ੁਦਾ ਖਰੀਦਦਾਰਾਂ (buyers) ਨੂੰ ਵੇਚ ਸਕਦੇ ਹਨ। ਤੁਸੀਂ ਫਸਲ ਦਾ ਨਾਮ, ਕਿਸਮ, ਮਾਤਰਾ ਅਤੇ ਮੁੱਲ ਦਰਜ ਕਰਕੇ ਲਿਸਟਿੰਗ ਬਣਾ ਸਕਦੇ ਹੋ। ਖਰੀਦਦਾਰ ਤੁਹਾਡੀ ਲਿਸਟਿੰਗ ਦੇਖ ਕੇ ਆਰਡਰ ਦੇ ਸਕਦੇ ਹਨ।",
        hr: 'हाँ, किसान साथी पै किसान अपनी फसल की लिस्टिंग बणाकै सीधे खरीदारों (buyers) नैं बेच सकैं सैं। आप फसल, मात्रा, भाव दर्ज करकै लिस्टिंग बणा सको सो। खरीदार लिस्टिंग देखकै enquiry या order भेजैंगे।',
        te: 'అవును, కిసాన్ సాథీలో రైతులు తమ పంట లిస్టింగ్‌ను సృష్టించి, ధృవీకరించబడిన కొనుగోలుదారులకు నేరుగా విక్రయించవచ్చు.',
        ta: 'ஆம், கிசான் சாதியில் விவசாயிகள் தங்கள் பயிர் பட்டியலை உருவாக்கி, சரிபார்க்கப்பட்ட வாங்குபவர்களுக்கு நேரடியாக விற்கலாம்.',
      });

      return {
        toolExecuted: 'SELL_TO_BUYER',
        success: true,
        data: {
          intent: 'SELL_TO_BUYER',
          directSellingSupported: true,
          platformRole: 'Direct Farmer-to-Buyer Digital Agriculture Marketplace',
        },
        groundedExplanation: explanation,
        suggestedActions: [
          {
            id: 'act_add_crop',
            label: 'Create Crop Listing',
            labelHi: 'फसल लिस्ट करें (Add Crop)',
            actionType: 'ADD_CROP',
          },
          {
            id: 'act_find_buyer',
            label: 'View Verified Buyers',
            labelHi: 'सत्यापित खरीदार देखें',
            actionType: 'FIND_BUYER',
          },
          {
            id: 'act_nav_market',
            label: 'Open Marketplace',
            labelHi: 'मार्केटप्लेस खोलें',
            actionType: 'NAVIGATE_MARKETPLACE',
          },
        ],
        dataSource: 'Kisan Saathi Direct Agriculture Marketplace Protocol',
      };
    }

    case 'SELL_MY_HARVEST':
    case 'ADD_CROP': {
      const explanation = t({
        hi: 'अपनी फसल बेचने के लिए किसान डैशबोर्ड पर "फसल जोड़ें (Add Crop)" पर जाएं। अपनी फसल का नाम, किस्म, कुल मात्रा (किग्रा), अपेक्षित मूल्य और फ़ोटो अपलोड करें। किसानसेतु पर AI क्वालिटी ग्रेडिंग से आपको बेहतर दाम मिलता है।',
        en: 'To sell your harvest on KisanSetu, open the Farmer Dashboard and click "Add Crop". Enter the crop name, variety, quantity (kg), target price, and upload produce photos. AI quality verification ensures premium buyer pricing.',
        pa: "ਆਪਣੀ ਫਸਲ ਵੇਚਣ ਲਈ ਕਿਸਾਨ ਡੈਸ਼ਬੋਰਡ ਵਿੱਚ \"ਫਸਲ ਜੋੜੋ (Add Crop)\" 'ਤੇ ਜਾਓ। ਫਸਲ ਦਾ ਨਾਮ, ਕਿਸਮ, ਮਾਤਰਾ ਅਤੇ ਮੁੱਲ ਦਰਜ ਕਰੋ।",
        hr: 'अपनी फसल बेचन खातर किसान डैशबोर्ड पै "फसल जोड़ें" पै जाओ। फसल का नाम, किस्म, मात्रा अर भाव डाल कै लिस्टिंग करो।',
        te: 'మీ పంటను విక్రయించడానికి, రైతు డాష్‌బోర్డ్‌లో "పంటను జోడించండి (Add Crop)" ఎంపికను ఉపయోగించండి. పంట పేరు, రకం, పరిమాణం మరియు ఆశించిన ధరను నమోదు చేయండి.',
        ta: 'உங்கள் பயிரை விற்க, உழவர் டாஷ்போர்டில் "பயிரைச் சேர் (Add Crop)" என்பதை கிளிக் செய்யவும். பயிர் பெயர், ரகம், அளவு மற்றும் விலையை உள்ளிடவும்.',
        hinglish: 'Apni fasal bechne ke liye Farmer Dashboard par "Add Crop" par click karein. Fasal ka naam, variety, quantity (kg), aur target price enter karein.',
      });
      return {
        toolExecuted: intent,
        success: true,
        data: { intent },
        groundedExplanation: explanation,
        suggestedActions: [
          {
            id: 'act_add_crop',
            label: 'Add Crop Listing',
            labelHi: 'फसल जोड़ें (Add Crop)',
            actionType: 'ADD_CROP',
          },
          {
            id: 'act_view_crops',
            label: 'View My Crops',
            labelHi: 'मेरी फसलें देखें',
            actionType: 'VIEW_MY_CROPS',
          },
        ],
        dataSource: 'KisanSetu Farmer Produce Management',
      };
    }

    case 'EDIT_MY_LISTING': {
      const explanation = t({
        hi: 'अपनी लिस्टिंग में भाव, उपलब्ध मात्रा या विवरण बदलने के लिए किसान डैशबोर्ड के "My Crops" सेक्शन में जाएं और लिस्टिंग के बगल में स्थित "Edit" विकल्प का उपयोग करें।',
        en: 'To update price, available quantity, or details of an active listing, navigate to "My Crops" in your Farmer Dashboard and click "Edit" on the listing.',
        pa: 'ਆਪਣੀ ਲਿਸਟਿੰਗ ਵਿੱਚ ਕੀਮਤ ਜਾਂ ਮਾਤਰਾ ਬਦਲਣ ਲਈ "My Crops" ਵਿੱਚ ਜਾ ਕੇ "Edit" ਵਿਕਲਪ ਚੁਣੋ।',
        hr: 'अपनी लिस्टिंग का भाव या मात्रा बदलण खातर "My Crops" सैक्शन में जाकै Edit पै क्लिक करो।',
        te: 'మీ పంట లిస్టింగ్‌లోని ధర లేదా పరిమాణాన్ని నవీకరించడానికి "My Crops" విభాగంలో "Edit" ఎంచుకోండి.',
        ta: 'உங்கள் பயிர் பட்டியலில் விலை அல்லது அளவை மாற்ற "My Crops" பிரிவில் "Edit" என்பதைத் தேர்ந்தெடுக்கவும்.',
        hinglish: 'Apni listing me rate ya quantity update karne ke liye "My Crops" section me jakar listing ke Edit button par click karein.',
      });
      return {
        toolExecuted: intent,
        success: true,
        data: { intent },
        groundedExplanation: explanation,
        suggestedActions: [
          {
            id: 'act_edit_crop',
            label: 'Edit Crop Listings',
            labelHi: 'मेरी लिस्टिंग बदलें',
            actionType: 'EDIT_MY_LISTING',
          },
          {
            id: 'act_view_crops',
            label: 'My Crops Inventory',
            labelHi: 'मेरी फसलें',
            actionType: 'VIEW_MY_CROPS',
          },
        ],
        dataSource: 'KisanSetu Crop Inventory Manager',
      };
    }

    case 'DELETE_MY_LISTING': {
      const explanation = t({
        hi: 'फसल बिक जाने पर या लिस्टिंग हटाने के लिए किसान डैशबोर्ड के "My Crops" में जाकर संबंधित फसल के आगे "हटाएं / Delete" चुनें या उसे "Sold" मार्क करें।',
        en: 'To remove or archive a crop listing that is sold or no longer available, visit "My Crops" in the Farmer Dashboard and select "Delete / Archive Listing".',
        pa: 'ਆਪਣੀ ਲਿਸਟਿੰਗ ਹਟਾਉਣ ਜਾਂ ਆਰਕਾਈਵ ਕਰਨ ਲਈ "My Crops" ਵਿੱਚ ਜਾਓ ਅਤੇ "Delete" ਵਿਕਲਪ ਚੁਣੋ।',
        hr: 'लिस्टिंग हटाण खातर "My Crops" में जाकै फसल के आगै तैं Delete चुणो।',
        te: 'అమ్మకానికి లేని పంట లిస్టింగ్‌ను తొలగించడానికి "My Crops" లో "Delete" ఎంపికను ఉపయోగించండి.',
        ta: 'பயிர் பட்டியலை நீக்க அல்லது காப்பகப்படுத்த "My Crops" சென்று "Delete" என்பதை கிளிக் செய்யவும்.',
        hinglish: 'Listing remove ya archive karne ke liye "My Crops" me jakar Delete option select karein.',
      });
      return {
        toolExecuted: intent,
        success: true,
        data: { intent },
        groundedExplanation: explanation,
        suggestedActions: [
          {
            id: 'act_delete_crop',
            label: 'Manage / Delete Listing',
            labelHi: 'लिस्टिंग हटाएं / प्रबंधित करें',
            actionType: 'DELETE_MY_LISTING',
          },
          {
            id: 'act_view_crops',
            label: 'View Listed Crops',
            labelHi: 'मेरी फसलें देखें',
            actionType: 'VIEW_MY_CROPS',
          },
        ],
        dataSource: 'KisanSetu Crop Inventory Manager',
      };
    }

    case 'CONTACT_BUYER': {
      const explanation = t({
        hi: 'सत्यापित खरीदारों से संपर्क करने के लिए किसानसेतु इन-ऐप मैसेजिंग का उपयोग करें। आप "Messages" टैब या खरीदार मांग बोर्ड (Buyer Requirements) से सीधे खरीदारों से चैट कर सकते हैं।',
        en: 'To connect with verified buyers, use KisanSetu in-app messaging. You can initiate chat from the "Messages" tab or directly from the Buyer Requirements board.',
        pa: 'ਖਰੀਦਦਾਰਾਂ ਨਾਲ ਗੱਲਬਾਤ ਕਰਨ ਲਈ "Messages" ਟੈਬ ਜਾਂ ਖਰੀਦਦਾਰ ਮੰਗ ਬੋਰਡ ਦੀ ਵਰਤੋਂ ਕਰੋ।',
        hr: 'खरीदार तैं बात करण खातर "Messages" टैब या खरीदार मांग बोर्ड पै जाकै चैट करो।',
        te: 'కొనుగోలుదారులను సంప్రదించడానికి "Messages" ట్యాబ్ లేదా కొనుగోలుదారుల డిమాండ్ బోర్డుని ఉపయోగించండి.',
        ta: 'வாங்குபவர்களுடன் பேச "Messages" பகுதி அல்லது வாங்குபவர் தேவைகள் பலகையைப் பயன்படுத்தவும்.',
        hinglish: 'Buyers se contact karne ke liye "Messages" tab open karein ya Buyer Requirements board se direct chat start karein.',
      });
      return {
        toolExecuted: intent,
        success: true,
        data: { intent },
        groundedExplanation: explanation,
        suggestedActions: [
          {
            id: 'act_contact_buyer',
            label: 'Contact Buyer / In-App Chat',
            labelHi: 'खरीदार से संपर्क करें',
            actionType: 'CONTACT_BUYER',
          },
          {
            id: 'act_nav_messages',
            label: 'Open Messages',
            labelHi: 'संदेश देखें',
            actionType: 'OPEN_MESSAGES',
          },
        ],
        dataSource: 'KisanSetu Verified Communications',
      };
    }

    case 'FIND_BUYER': {
      const explanation = t({
        hi: 'अपनी फसल के लिए खरीदार खोजने के लिए "Buyer Requirements" सेक्शन देखें जहाँ सत्यापित मिलर्स, FPO और थोक खरीदार दैनिक खरीद मांग पोस्ट करते हैं।',
        en: 'To discover active buyers for your harvest, explore the "Buyer Requirements" board where verified millers, FPOs, and bulk buyers post live purchasing demands.',
        pa: 'ਖਰੀਦਦਾਰ ਲੱਭਣ ਲਈ "Buyer Requirements" ਬੋਰਡ ਦੇਖੋ ਜਿੱਥੇ ਵਪਾਰੀ ਰੋਜ਼ਾਨਾ ਮੰਗ ਪੋਸਟ ਕਰਦੇ ਹਨ।',
        hr: 'खरीदार ढूँढण खातर "Buyer Requirements" बोर्ड देखो जित ब्यापारी अपनी खरीद मांग पोस्ट करैं सैं।',
        te: 'కొనుగోలుదారులను కనుగొనడానికి "Buyer Requirements" విభాగంలో ప్రత్యక్ష డిమాండ్‌లను చూడండి.',
        ta: 'வாங்குபவர்களைக் கண்டறிய "Buyer Requirements" பலகையில் நேரடி கொள்முதல் தேவைகளைப் பார்க்கவும்.',
        hinglish: 'Buyers dhoondhne ke liye "Buyer Requirements" section check karein jahan verified millers aur bulk buyers requirement post karte hain.',
      });
      return {
        toolExecuted: intent,
        success: true,
        data: { intent },
        groundedExplanation: explanation,
        suggestedActions: [
          {
            id: 'act_find_buyer',
            label: 'Find Buyers (Requirements)',
            labelHi: 'खरीदार मांग खोजें',
            actionType: 'FIND_BUYER',
          },
          {
            id: 'act_nav_market',
            label: 'Open Marketplace',
            labelHi: 'मार्केटप्लेस खोलें',
            actionType: 'OPEN_MARKETPLACE',
          },
        ],
        dataSource: 'KisanSetu Buyer Demand Registry',
      };
    }

    case 'VIEW_MY_CROPS': {
      const userData = getAuthenticatedUserData({
        authToken: authContext.token,
        contextUserId: authContext.userId,
        contextUserRole: authContext.userRole,
      });

      if (!userData.authenticated) {
        const explanation = t({
          hi: 'आप अभी लॉगिन नहीं हैं। अपनी पंजीकृत फसलें और इन्वेंट्री देखने के लिए कृपया पहले किसान के रूप में लॉगिन करें।',
          en: 'You are currently not logged in. Please log in as a farmer to view your listed crops and inventory.',
          pa: 'ਤੁਸੀਂ ਅਜੇ ਲੌਗਇਨ ਨਹੀਂ ਹੋ। ਆਪਣੀਆਂ ਫਸਲਾਂ ਦੇਖਣ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਲੌਗਇਨ ਕਰੋ।',
          hr: 'तूं अभी लॉगिन कोन्या सै। अपनी फसलें देखण खातर पैहलां किसान बनकै लॉगिन करो।',
          te: 'మీరు లాగిన్ అవ్వలేదు. మీ పంటలను వీక్షించడానికి దయచేసి రైతుగా లాగిన్ అవ్వండి.',
          ta: 'நீங்கள் உள்நுழையவில்லை. உங்கள் பயிர்களைப் பார்க்க உழவராக உள்நுழையவும்.',
          hinglish: 'Aap abhi logged in nahi hain. Apne crops dekhne ke liye kripya pehle farmer account me login karein.',
        });
        return {
          toolExecuted: intent,
          success: false,
          data: userData,
          groundedExplanation: explanation,
          suggestedActions: [
            {
              id: 'act_login',
              label: 'Log In / Sign In',
              labelHi: 'लॉगिन करें',
              actionType: 'NAVIGATE_LOGIN',
            },
          ],
          dataSource: 'KisanSetu Authentication Guard',
        };
      }

      const crops = userData.crops || [];
      const active = crops.filter((c) => c.status === 'Available for Sale' || !c.status.includes('Archive'));
      let exp = '';
      if (active.length > 0) {
        const cropList = active
          .map((c) => `• ${c.name} (${c.variety}) - मात्रा: ${c.quantityKg?.toLocaleString() || '1,000'} किग्रा, ग्रेड: ${c.grade || 'A'}, अपेक्षित मूल्य: ₹${c.expectedPrice}/किग्रा, स्थिति: ${c.status}`)
          .join('\n');
        exp = t({
          hi: `सिस्टम लाइव डेटा:\nआपके किसान खाते (${userData.userName || 'किसान'}, ID: ${userData.profile?.farmerId || 'KISAN-UP-8842'}) में कुल ${active.length} फसलें पंजीकृत हैं:\n${cropList}\n\nसभी फसलें मार्केटप्लेस में सक्रिय हैं।`,
          en: `System Live Data:\nUnder your farmer account (${userData.userName || 'Farmer'}, ID: ${userData.profile?.farmerId || 'KISAN-UP-8842'}), ${active.length} crop listing(s) are registered:\n${cropList}`,
          hinglish: `System Live Data:\nAapke farmer account (${userData.userName}, ID: ${userData.profile?.farmerId}) me ${active.length} active crop listings hain:\n${cropList}`,
        });
      } else {
        exp = t({
          hi: 'आपके किसान खाते में वर्तमान में कोई सक्रिय फसल लिस्टिंग उपलब्ध नहीं है। नई फसल जोड़ने के लिए "फसल जोड़ें" पर क्लिक करें।',
          en: 'You currently have no active crop listings. Click "Add Crop" to list your harvest.',
          hinglish: 'Aapke account me abhi koi active crop listing nahi hai. Nayi fasal jodne ke liye "Add Crop" par click karein.',
        });
      }

      return {
        toolExecuted: intent,
        success: true,
        data: crops,
        groundedExplanation: exp,
        suggestedActions: [
          {
            id: 'act_view_crops',
            label: 'Manage My Crops',
            labelHi: 'मेरी फसलें देखें',
            actionType: 'VIEW_MY_CROPS',
          },
          {
            id: 'act_add_crop',
            label: 'Add New Crop',
            labelHi: 'नई फसल जोड़ें',
            actionType: 'ADD_CROP',
          },
        ],
        dataSource: 'Live authenticated farmer crops database',
      };
    }

    case 'VIEW_MY_PROFILE': {
      const userData = getAuthenticatedUserData({
        authToken: authContext.token,
        contextUserId: authContext.userId,
        contextUserRole: authContext.userRole,
      });

      if (!userData.authenticated) {
        const explanation = t({
          hi: 'आप अभी लॉगिन नहीं हैं। अपनी प्रोफ़ाइल और खाता विवरण देखने के लिए कृपया पहले लॉगिन करें।',
          en: 'You are currently not logged in. Please log in to view your profile and account details.',
          pa: 'ਤੁਸੀਂ ਅਜੇ ਲੌਗਇਨ ਨਹੀਂ ਹੋ। ਆਪਣੀ ਪ੍ਰੋਫਾਈਲ ਦੇਖਣ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਲੌਗਇਨ ਕਰੋ।',
          hr: 'तूं अभी लॉगिन कोन्या सै। अपनी प्रोफाइल देखण खातर पैहलां लॉगिन करो।',
          te: 'మీరు లాగిన్ అవ్వలేదు. మీ ప్రొఫైల్‌ను వీక్షించడానికి దయచేసి లాగిన్ అవ్వండి.',
          ta: 'நீங்கள் உள்நுழையவில்லை. உங்கள் சுயவிவரத்தைப் பார்க்க உள்நுழையவும்.',
          hinglish: 'Aap abhi logged in nahi hain. Apni profile dekhne ke liye pehle login karein.',
        });
        return {
          toolExecuted: intent,
          success: false,
          data: userData,
          groundedExplanation: explanation,
          suggestedActions: [
            {
              id: 'act_login',
              label: 'Log In / Sign In',
              labelHi: 'लॉगिन करें',
              actionType: 'NAVIGATE_LOGIN',
            },
          ],
          dataSource: 'KisanSetu Authentication Guard',
        };
      }

      const prof = userData.profile || {};
      const exp = t({
        hi: `आपकी पंजीकृत प्रोफ़ाइल विवरण:\n• नाम: ${prof.name || userData.userName}\n• आईडी: ${prof.farmerId || prof.buyerId || userData.userId}\n• फोन: ${prof.mobile || prof.phone || 'पंजीकृत'}\n• स्थान: ${prof.location || prof.district || 'उत्तर प्रदेश'}\n• ई-केवाईसी स्थिति: ${prof.eKycStatus || 'सत्यापित ✓'}\n• भूमिका: ${userData.role === 'farmer' ? 'सत्यापित किसान' : 'सत्यापित खरीदार'}`,
        en: `Your Registered Profile Details:\n• Name: ${prof.name || userData.userName}\n• ID: ${prof.farmerId || prof.buyerId || userData.userId}\n• Phone: ${prof.mobile || prof.phone || 'Registered'}\n• Location: ${prof.location || prof.district || 'Uttar Pradesh'}\n• e-KYC: ${prof.eKycStatus || 'VERIFIED ✓'}\n• Role: ${userData.role === 'farmer' ? 'Verified Farmer' : 'Verified Buyer'}`,
        hinglish: `Aapki Profile Jankari:\n• Name: ${prof.name || userData.userName}\n• ID: ${prof.farmerId || prof.buyerId || userData.userId}\n• Location: ${prof.location || prof.district}\n• e-KYC: ${prof.eKycStatus || 'VERIFIED ✓'}`,
      });

      return {
        toolExecuted: intent,
        success: true,
        data: prof,
        groundedExplanation: exp,
        suggestedActions: [
          {
            id: 'act_view_profile',
            label: 'View My Profile',
            labelHi: 'मेरी प्रोफ़ाइल देखें',
            actionType: 'VIEW_MY_PROFILE',
          },
          {
            id: 'act_open_settings',
            label: 'Open Settings',
            labelHi: 'सेटिंग्स खोलें',
            actionType: 'OPEN_SETTINGS',
          },
        ],
        dataSource: 'Live authenticated user profile',
      };
    }

    case 'VIEW_MY_ORDERS': {
      const userData = getAuthenticatedUserData({
        authToken: authContext.token,
        contextUserId: authContext.userId,
        contextUserRole: authContext.userRole,
      });

      if (!userData.authenticated) {
        const explanation = t({
          hi: 'आप अभी लॉगिन नहीं हैं। अपने ऑर्डर्स देखने और ट्रैक करने के लिए कृपया पहले लॉगिन करें।',
          en: 'You are currently not logged in. Please log in to view and track your orders.',
          pa: 'ਤੁਸੀਂ ਅਜੇ ਲੌਗਇਨ ਨਹੀਂ ਹੋ। ਆਪਣੇ ਆਰਡਰ ਦੇਖਣ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਲੌਗਇਨ ਕਰੋ।',
          hr: 'तूं अभी लॉगिन कोन्या सै। अपने आर्डर देखण खातर पैहलां लॉगिन करो।',
          te: 'మీరు లాగిన్ అవ్వలేదు. మీ ఆర్డర్‌లను వీక్షించడానికి దయచేసి లాగిన్ అవ్వండి.',
          ta: 'நீங்கள் உள்நுழையவில்லை. உங்கள் ஆர்டர்களைப் பார்க்க உள்நுழையவும்.',
          hinglish: 'Aap abhi logged in nahi hain. Apne orders check karne ke liye kripya pehle login karein.',
        });
        return {
          toolExecuted: intent,
          success: false,
          data: userData,
          groundedExplanation: explanation,
          suggestedActions: [
            {
              id: 'act_login',
              label: 'Log In / Sign In',
              labelHi: 'लॉगिन करें',
              actionType: 'NAVIGATE_LOGIN',
            },
          ],
          dataSource: 'KisanSetu Authentication Guard',
        };
      }

      const orders = userData.orders || [];
      let exp = '';
      if (orders.length > 0) {
        const orderList = orders
          .map(
            (o) =>
              `• ऑर्डर #${o.orderNumber || o.id}: ${o.crop} (${o.variety || 'Grade A'}) - मात्रा: ${o.quantityKg?.toLocaleString()} किग्रा, कुल मूल्य: ₹${(o.totalAmount || (o.pricePerKg || 0) * (o.quantityKg || 0)).toLocaleString()}, स्थिति: ${o.status}`
          )
          .join('\n');
        exp = t({
          hi: `आपके खाते में कुल ${orders.length} ऑर्डर्स दर्ज हैं:\n${orderList}\n\nसभी सौदे किसानसेतु सुरक्षित एस्क्रो के तहत 100% संरक्षित हैं।`,
          en: `You have ${orders.length} order(s) registered under your account:\n${orderList}\n\nAll deals are 100% protected by KisanSetu Mandi Escrow.`,
          hinglish: `Aapke account me ${orders.length} orders registered hain:\n${orderList}\n\nSabhi orders KisanSetu Escrow protection ke tahat secured hain.`,
        });
      } else {
        exp = t({
          hi: 'आपके खाते में वर्तमान में कोई सक्रिय ऑर्डर नहीं है। फसलें खरीदने के लिए मार्केटप्लेस देखें या अपनी फसल बेचने के लिए लिस्टिंग जोड़ें।',
          en: 'You currently have no active orders in your account. Visit the Marketplace to explore available produce.',
          hinglish: 'Aapke account me abhi koi active order nahi hai. Marketplace me jakar active produce check kar sakte hain.',
        });
      }

      return {
        toolExecuted: intent,
        success: true,
        data: orders,
        groundedExplanation: exp,
        suggestedActions: [
          {
            id: 'act_view_orders',
            label: 'View My Orders',
            labelHi: 'मेरे ऑर्डर देखें',
            actionType: 'VIEW_MY_ORDERS',
          },
          {
            id: 'act_order_status',
            label: 'Track Order Status',
            labelHi: 'ऑर्डर ट्रैकिंग',
            actionType: 'VIEW_ORDER_STATUS',
          },
        ],
        dataSource: 'Live authenticated orders store',
      };
    }

    case 'VIEW_ORDER_STATUS': {
      const explanation = t({
        hi: 'अपने ऑर्डर्स की लाइव डिलीवरी स्थिति, वाहन जीपीएस ट्रैकिंग, और डिजिटल एस्क्रो भुगतान रिलीज की स्थिति देखने के लिए "Orders" सेक्शन खोलें। किसानसेतु पर डिलीवरी स्वीकृति और वजन पुष्टि के बाद ही राशि रिलीज होती है।',
        en: 'To check live order tracking, vehicle GPS coordinates, and escrow disbursement status, open the Orders section. Payments are held in secure escrow until weighment verification.',
        pa: 'ਆਪਣੇ ਆਰਡਰਾਂ ਦੀ ਲਾਈਵ ਸਥਿਤੀ ਅਤੇ ਟਰੈਕਿੰਗ ਦੇਖਣ ਲਈ Orders ਸੈਕਸ਼ਨ ਖੋਲ੍ਹੋ।',
        hr: 'अपने आर्डर की लाइव डिलीवरी स्थिति अर ट्रैकिंग देखण खातर Orders सैक्शन खोलो।',
        te: 'లైవ్ ఆర్డర్ ట్రాకింగ్ మరియు డెలివరీ స్థితిని తనిఖీ చేయడానికి Orders విభాగాన్ని తెరవండి.',
        ta: 'நேரடி ஆர்டர் கண்காணிப்பு மற்றும் விநியோக நிலையை சரிபார்க்க Orders பகுதியைத் திறக்கவும்.',
        hinglish: 'Apne orders ki live tracking aur delivery status check karne ke liye Orders tab open karein.',
      });
      return {
        toolExecuted: intent,
        success: true,
        data: { intent },
        groundedExplanation: explanation,
        suggestedActions: [
          {
            id: 'act_view_order_status',
            label: 'View Order Status',
            labelHi: 'ऑर्डर स्थिति देखें',
            actionType: 'VIEW_ORDER_STATUS',
          },
          {
            id: 'act_view_orders',
            label: 'All Orders',
            labelHi: 'सभी ऑर्डर',
            actionType: 'VIEW_MY_ORDERS',
          },
        ],
        dataSource: 'KisanSetu Order Logistics & Escrow Tracking',
      };
    }

    case 'OPEN_MARKETPLACE': {
      const explanation = t({
        hi: 'किसानसेतु मार्केटप्लेस पर आप सीधे सत्यापित किसानों से शुद्ध फसलें खरीद सकते हैं। यहाँ पारदर्शी मूल्य, गुणवत्ता ग्रेडिंग, प्रत्यक्ष किसान प्रोफाइल और सुरक्षित एस्क्रो भुगतान उपलब्ध है।',
        en: 'Welcome to the KisanSetu Marketplace. Discover farm-direct produce from verified farmers with transparent pricing, quality certification, and escrow protection.',
        pa: 'ਕਿਸਾਨਸੇਤੂ ਮਾਰਕੀਟਪਲੇਸ ਵਿੱਚ ਸਿੱਧੇ ਕਿਸਾਨਾਂ ਤੋਂ ਫਸਲਾਂ ਖਰੀਦੋ।',
        hr: 'किसानसेतु मार्केटप्लेस पै सीधे किसान भाइयां तैं फसल खरीदो बिना किसी बिचौलिए के।',
        te: 'కిసాన్‌సేతు మార్కెట్‌ప్లేస్‌లో ధృవీకరించబడిన రైతుల నుండి నేరుగా పంటలను కొనుగోలు చేయండి.',
        ta: 'கிசான்சேது சந்தையில் சரிபார்க்கப்பட்ட விவசாயிகளிடமிருந்து நேரடியாக பயிர்களை வாங்கலாம்.',
        hinglish: 'KisanSetu Marketplace par direct verified farmers se crops purchase karein with zero middlemen and escrow protection.',
      });
      return {
        toolExecuted: intent,
        success: true,
        data: { intent },
        groundedExplanation: explanation,
        suggestedActions: [
          {
            id: 'act_open_marketplace',
            label: 'Open Marketplace',
            labelHi: 'मार्केटप्लेस खोलें',
            actionType: 'OPEN_MARKETPLACE',
          },
          {
            id: 'act_check_mandi',
            label: 'Check Mandi Rates',
            labelHi: 'मंडी भाव देखें',
            actionType: 'OPEN_MANDI_RATES',
          },
        ],
        dataSource: 'KisanSetu Farm-Direct Marketplace',
      };
    }

    case 'OPEN_MANDI_RATES': {
      // Check if query mentions a specific commodity
      let matchedCrop: string | undefined = undefined;
      for (const [alias, canonical] of Object.entries(CROP_ALIASES)) {
        if (userQuery.toLowerCase().includes(alias)) {
          matchedCrop = canonical;
          break;
        }
      }

      let matchedDistrict: string | undefined = undefined;
      for (const [alias, canonical] of Object.entries(DISTRICT_ALIASES)) {
        if (userQuery.toLowerCase().includes(alias)) {
          matchedDistrict = canonical;
          break;
        }
      }

      if (matchedCrop) {
        const mandiResult = await getMandiPrice(matchedCrop, matchedDistrict);
        if (mandiResult.found && (mandiResult.summary || (mandiResult.records && mandiResult.records.length > 0))) {
          const m = mandiResult.summary || mandiResult.records[0];
          const exp = t({
            hi: `आधिकारिक सरकारी मंडी भाव (AGMARKNET):\n• फसल: ${mandiResult.commodity} (${matchedCrop})\n• मंडी / जिला: ${m.market}, ${m.district}\n• मॉडल भाव: ₹${m.modalPrice}/किग्रा\n• न्यूनतम - अधिकतम: ₹${m.minPrice} - ₹${m.maxPrice}/किग्रा\n• दिनांक: ${m.arrivalDate || 'आज'}`,
            en: `Official AGMARKNET Mandi Intelligence:\n• Commodity: ${mandiResult.commodity} (${matchedCrop})\n• Market / District: ${m.market}, ${m.district}\n• Modal Price: ₹${m.modalPrice}/kg\n• Min - Max: ₹${m.minPrice} - ₹${m.maxPrice}/kg\n• Date: ${m.arrivalDate || 'Today'}`,
            hinglish: `Official Mandi Rates (AGMARKNET):\n• Crop: ${mandiResult.commodity} (${matchedCrop})\n• Mandi: ${m.market} (${m.district})\n• Modal Rate: ₹${m.modalPrice}/kg\n• Price Range: ₹${m.minPrice} - ₹${m.maxPrice}/kg`,
          });
          return {
            toolExecuted: intent,
            success: true,
            data: mandiResult,
            groundedExplanation: exp,
            suggestedActions: [
              {
                id: 'act_open_mandi',
                label: 'View Mandi Intelligence',
                labelHi: 'मंडी भाव देखें',
                actionType: 'OPEN_MANDI_RATES',
              },
              {
                id: 'act_open_market',
                label: 'Compare in Marketplace',
                labelHi: 'मार्केटप्लेस में तुलना करें',
                actionType: 'OPEN_MARKETPLACE',
              },
            ],
            dataSource: 'Official AGMARKNET Mandi Price Registry',
          };
        }
      }

      const explanation = t({
        hi: 'किसानसेतु "Mandi Intelligence" में भारत सरकार के AGMARKNET पोर्टल से दैनिक एपीएमसी थोक भाव प्रदर्शित किए जाते हैं। यहाँ आप जिलेवार गेहूं, धान, मक्का, चना, सरसों आदि के मॉडल भाव और मूल्य रुझान देख सकते हैं।',
        en: 'KisanSetu "Mandi Intelligence" provides daily APMC wholesale market rates synchronized from the AGMARKNET portal. Compare district-level modal prices, trends, and arrival quantities across crops.',
        pa: 'ਕਿਸਾਨਸੇਤੂ ਮਾਰਕੀਟ ਰੇਟ ਸੈਕਸ਼ਨ ਵਿੱਚ ਰੋਜ਼ਾਨਾ ਸਰਕਾਰੀ ਮੰਡੀ ਭਾਅ ਦੇਖੋ।',
        hr: 'किसानसेतु मंडी सैक्शन में सरकारी AGMARKNET पोर्टल तैं रोजाना के भाव देख सको हो।',
        te: 'కిసాన్‌సేతు మండి ఇంటెలిజెన్స్‌లో ప్రతిరోజూ అధికారిక వ్యవసాయ మార్కెట్ ధరలను తనిఖీ చేయండి.',
        ta: 'கிசான்சேது மண்டி நுண்ணறிவு பிரிவில் தினசரி சந்தை விலைகளைச் சரிபார்க்கவும்.',
        hinglish: 'KisanSetu Mandi Intelligence me daily official AGMARKNET wholesale rates aur modal prices check karein.',
      });
      return {
        toolExecuted: intent,
        success: true,
        data: { intent },
        groundedExplanation: explanation,
        suggestedActions: [
          {
            id: 'act_open_mandi',
            label: 'Open Mandi Rates',
            labelHi: 'मंडी भाव देखें',
            actionType: 'OPEN_MANDI_RATES',
          },
          {
            id: 'act_open_market',
            label: 'Compare Marketplace',
            labelHi: 'मार्केटप्लेस देखें',
            actionType: 'OPEN_MARKETPLACE',
          },
        ],
        dataSource: 'Official AGMARKNET APMC Mandi Registry',
      };
    }

    case 'OPEN_MESSAGES': {
      const explanation = t({
        hi: 'सत्यापित किसानों और थोक खरीदारों के बीच सुरक्षित बातचीत और सौदे तय करने के लिए "Messages" इनबॉक्स का उपयोग करें। आप यहाँ सीधे बातचीत और डिलीवरी विवरण तय कर सकते हैं।',
        en: 'Use the "Messages" inbox for secure negotiations and deal confirmations directly between verified farmers and buyers.',
        pa: 'ਕਿਸਾਨਾਂ ਅਤੇ ਖਰੀਦਦਾਰਾਂ ਵਿਚਕਾਰ ਗੱਲਬਾਤ ਕਰਨ ਲਈ Messages ਇਨਬਾਕਸ ਦੀ ਵਰਤੋਂ ਕਰੋ।',
        hr: 'किसान अर खरीदार के बीच बातचीत करण खातर Messages इनबॉक्स का इस्तेमाल करो।',
        te: 'రైతులు మరియు కొనుగోలుదారుల మధ్య ప్రత్యక్ష సంభాషణల కోసం Messages ఇన్‌బాక్స్‌ని ఉపయోగించండి.',
        ta: 'விவசாயிகள் மற்றும் வாங்குபவர்களிடையே நேரடி உரையாடலுக்கு Messages இன்பாக்ஸைப் பயன்படுத்தவும்.',
        hinglish: 'Farmers aur buyers ke beech direct negotiation ke liye Messages inbox open karein.',
      });
      return {
        toolExecuted: intent,
        success: true,
        data: { intent },
        groundedExplanation: explanation,
        suggestedActions: [
          {
            id: 'act_open_messages',
            label: 'Open Messages',
            labelHi: 'संदेश देखें',
            actionType: 'OPEN_MESSAGES',
          },
          {
            id: 'act_contact_buyer',
            label: 'Contact Buyer',
            labelHi: 'खरीदार से संपर्क',
            actionType: 'CONTACT_BUYER',
          },
        ],
        dataSource: 'KisanSetu In-App Secure Messaging',
      };
    }

    case 'OPEN_SETTINGS': {
      const explanation = t({
        hi: 'अपनी खाता सेटिंग्स, भाषा प्राथमिकता, सूचना सेटिंग्स और प्रोफ़ाइल विवरण प्रबंधित करने के लिए सेटिंग्स खोलें।',
        en: 'Open Settings to manage your account preferences, language selection, notifications, and profile details.',
        pa: 'ਆਪਣੀ ਖਾਤਾ ਸੈਟਿੰਗਾਂ ਅਤੇ ਭਾਸ਼ਾ ਬਦਲਣ ਲਈ Settings ਖੋਲ੍ਹੋ।',
        hr: 'अपनी खाता सेटिंग्स अर भाषा बदलण खातर Settings खोलो।',
        te: 'మీ ఖాతా ప్రాధాన్యతలు మరియు భాషను నిర్వహించడానికి Settings తెరవండి.',
        ta: 'உங்கள் கணக்கு அமைப்புகள் மற்றும் மொழியை நிர்வகிக்க Settings திறக்கவும்.',
        hinglish: 'Account preferences aur language change karne ke liye Settings open karein.',
      });
      return {
        toolExecuted: intent,
        success: true,
        data: { intent },
        groundedExplanation: explanation,
        suggestedActions: [
          {
            id: 'act_open_settings',
            label: 'Open Settings',
            labelHi: 'सेटिंग्स खोलें',
            actionType: 'OPEN_SETTINGS',
          },
          {
            id: 'act_view_profile',
            label: 'View Profile',
            labelHi: 'मेरी प्रोफ़ाइल देखें',
            actionType: 'VIEW_MY_PROFILE',
          },
        ],
        dataSource: 'KisanSetu User Preferences',
      };
    }

    case 'CHANGE_LANGUAGE': {
      const explanation = t({
        hi: 'किसानसेतु 6 भाषाओं में उपलब्ध है: हिंदी (Hindi), English, ਪੰਜਾਬੀ (Punjabi), हरियाणवी (Haryanvi), తెలుగు (Telugu), और தமிழ் (Tamil)। भाषा बदलने के लिए ऊपर नेविगेशन बार में दिए गए भाषा चयनकर्ता पर क्लिक करें।',
        en: 'KisanSetu supports 6 official languages: Hindi, English, Punjabi, Haryanvi, Telugu, and Tamil. You can change your language anytime using the language selector in the top navigation bar.',
        pa: "ਕਿਸਾਨਸੇਤੂ 6 ਭਾਸ਼ਾਵਾਂ (ਹਿੰਦੀ, ਅੰਗਰੇਜ਼ੀ, ਪੰਜਾਬੀ, ਹਰਿਆਣਵੀ, ਤੇਲਗੂ, ਤਮਿਲ) ਦਾ ਸਮਰਥਨ ਕਰਦਾ ਹੈ। ਭਾਸ਼ਾ ਬਦਲਣ ਲਈ ਉੱਪਰ ਦਿੱਤੇ ਭਾਸ਼ਾ ਚੋਣਕਾਰ 'ਤੇ ਕਲਿੱਕ ਕਰੋ।",
        hr: 'किसानसेतु पै 6 भाषाएं उपलब्ध सैं (हिंदी, English, पंजाबी, हरियाणवी, तेलुगु, तमिल)। भाषा बदलण खातर ऊपर नैविगेशन बार में भाषा चूज करो।',
        te: 'కిసాన్‌సేతు 6 భాషలకు మద్దతు ఇస్తుంది: హిందీ, ఇంగ్లీష్, పంజాబీ, హర్యాన్వీ, తెలుగు, తమిళం. పై నావిగేషన్ బార్‌లోని భాషా ఎంపిక ద్వారా మార్చుకోవచ్చు.',
        ta: 'கிசான்சேது 6 மொழிகளை ஆதரிக்கிறது: இந்தி, ஆங்கிலம், பஞ்சாபி, ஹரியான்வி, தெலுங்கு, தமிழ். மேலே உள்ள மொழி தேர்வி மூலம் மொழியை மாற்றலாம்.',
        hinglish: 'KisanSetu 6 languages support karta hai: Hindi, English, Punjabi, Haryanvi, Telugu, aur Tamil. Top navigation bar me jakar language change karein.',
      });
      return {
        toolExecuted: intent,
        success: true,
        data: { intent, supportedLanguages: ['hi', 'en', 'pa', 'hr', 'te', 'ta'] },
        groundedExplanation: explanation,
        suggestedActions: [
          {
            id: 'act_change_language',
            label: 'Change Language',
            labelHi: 'भाषा बदलें',
            actionType: 'CHANGE_LANGUAGE',
          },
          {
            id: 'act_open_settings',
            label: 'Open Settings',
            labelHi: 'सेटिंग्स खोलें',
            actionType: 'OPEN_SETTINGS',
          },
        ],
        dataSource: 'KisanSetu Multilingual System Core',
      };
    }

    default:
      return {
        toolExecuted: 'handleDeterministicIntent_fallback',
        success: true,
        data: {},
        groundedExplanation: 'किसानसेतु पर सहायता उपलब्ध है। कृपया नीचे दिए गए विकल्पों में से चुनें।',
        suggestedActions: [
          {
            id: 'act_nav_market',
            label: 'Browse Marketplace',
            labelHi: 'मार्केटप्लेस देखें',
            actionType: 'OPEN_MARKETPLACE',
          },
        ],
        dataSource: 'KisanSetu Core Guidance',
      };
  }
}

export async function analyzeIntentAndExecuteWebsiteTool(
  userQuery: string,
  targetLang: string,
  authContext: {
    token?: string;
    userId?: string;
    userRole?: string;
  }
): Promise<ToolExecutionResult | null> {
  const isHi = targetLang === 'hi' || targetLang === 'pa' || targetLang === 'hr';
  const q = userQuery.toLowerCase().trim();

  // 1. Strict Privacy Check FIRST
  const privacyCheck = checkPrivacyViolation(userQuery);
  if (privacyCheck.violated) {
    return {
      toolExecuted: 'checkPrivacyViolation',
      success: true,
      data: { blocked: true },
      groundedExplanation: isHi
        ? privacyCheck.reason!
        : 'Under KisanSetu Data Protection & Privacy Policy, personal contact information (mobile numbers, Aadhaar, bank credentials) and private orders of other users cannot be disclosed. You can use the in-app Message Farmer feature on active marketplace listings.',
      suggestedActions: [
        {
          id: 'act_nav_market',
          label: 'Browse Public Marketplace',
          labelHi: 'पब्लिक मार्केटप्लेस देखें',
          actionType: 'NAVIGATE_MARKETPLACE',
        },
      ],
      dataSource: 'KisanSetu Privacy & Data Protection Policy',
    };
  }

  // 2. High-Performance Deterministic Intent Matcher (Instant Bypass of LLM)
  const deterministicIntent = detectDeterministicIntent(userQuery);
  if (deterministicIntent) {
    return await handleDeterministicIntent(deterministicIntent, targetLang, authContext, userQuery);
  }

  // 2. Authenticated User's Personal Data Queries
  // Examples: "Mere orders kitne hain?", "Mera order kaha hai?", "Meri fasal kaunsi hai?", "Mere crops", "Meri property", "Mera profile"
  const isPersonalQuery =
    q.includes('mere ') ||
    q.includes('mera ') ||
    q.includes('meri ') ||
    q.includes('my ') ||
    q.includes('mine ') ||
    q.includes('apna ') ||
    q.includes('apni ') ||
    q.includes('apne ') ||
    q.includes('mujhe ') ||
    q.includes('mera order') ||
    q.includes('mere order') ||
    q.includes('meri fasal') ||
    q.includes('mere crop') ||
    q.includes('meri property') ||
    q.includes('meri requirement');

  if (isPersonalQuery) {
    // Check if user is logged in
    const userData = getAuthenticatedUserData({
      authToken: authContext.token,
      contextUserId: authContext.userId,
      contextUserRole: authContext.userRole,
    });

    if (!userData.authenticated) {
      return {
        toolExecuted: 'getAuthenticatedUserData',
        success: false,
        data: userData,
        groundedExplanation: isHi
          ? 'आप अभी लॉगिन नहीं हैं। अपनी निजी फसलें, ऑर्डर्स, या मांग देखने के लिए कृपया पहले किसान या खरीदार के रूप में लॉगिन करें।'
          : 'You are currently not logged in. Please log in as a farmer or buyer to view your orders, crops, or requirements.',
        suggestedActions: [
          {
            id: 'act_login',
            label: 'Log In / Sign In',
            labelHi: 'लॉगिन करें',
            actionType: 'NAVIGATE_LOGIN',
          },
        ],
        dataSource: 'KisanSetu Authentication Guard',
      };
    }

    // Farmer personal questions
    if (userData.role === 'farmer') {
      if (q.includes('property') || q.includes('जमीन') || q.includes('bhulekh') || q.includes('gata') || q.includes('khatauni')) {
        const props = userData.properties || [];
        let exp = '';
        if (props.length > 0) {
          const propDetails = props
            .map(
              (p) =>
                `• गाटा संख्या: ${p.gataNumber}, खतौनी: ${p.khatauniNumber || 'उपलब्ध'}, क्षेत्रफल: ${p.landArea} ${p.landAreaUnit}, ग्राम: ${p.village}, तहसील: ${p.tehsil}, जिला: ${p.district} (स्थिति: ${p.status})`
            )
            .join('\n');
          exp = isHi
            ? `आपके खाते में कुल ${props.length} जमीन संपत्ति रिकॉर्ड पंजीकृत हैं:\n${propDetails}\n\nआधिकारिक भूलेख खतौनी देखने के लिए UP Bhulekh लिंक का उपयोग कर सकते हैं।`
            : `You have ${props.length} registered land holding(s):\n${propDetails}`;
        } else {
          exp = isHi
            ? 'आपके खाते में अभी कोई जमीन संपत्ति विवरण दर्ज नहीं है। आप "Property & Land Records" टैब में जाकर अपनी जमीन जोड़ सकते हैं।'
            : 'No property records are currently registered under your farmer account.';
        }
        return {
          toolExecuted: 'getAuthenticatedUserData_properties',
          success: true,
          data: props,
          groundedExplanation: exp,
          suggestedActions: [
            {
              id: 'act_nav_prop',
              label: 'Manage Properties',
              labelHi: 'संपत्ति प्रबंधित करें',
              actionType: 'NAVIGATE_PROPERTY',
            },
          ],
          dataSource: 'Live authenticated farmer property records',
        };
      }

      // Farmer crops / inventory
      if (q.includes('crop') || q.includes('fasal') || q.includes('फसल') || q.includes('listing') || q.includes('inventory') || q.includes('wheat') || q.includes('rice') || q.includes('paddy') || q.includes('maize') || q.includes('chana') || q.includes('quantity')) {
        const crops = userData.crops || [];
        const active = crops.filter((c) => c.status === 'Available for Sale');
        let exp = '';
        if (active.length > 0) {
          const cropList = active
            .map((c) => `• ${c.name} (${c.variety}) - मात्रा: ${c.quantityKg.toLocaleString()} किग्रा, ग्रेड: ${c.grade}, अपेक्षित मूल्य: ₹${c.expectedPrice}/किग्रा, स्थिति: ${c.status}`)
            .join('\n');
          exp = isHi
            ? `सिस्टम लाइव डेटा:\nआपके किसान खाते (${userData.userName}, ID: ${userData.profile?.farmerId}) में कुल ${active.length} सक्रिय फसलें उपलब्ध हैं:\n${cropList}\n\nसभी फसलें फोटो वेरीफाइड हैं और मार्केटप्लेस में पंजीकृत हैं।`
            : `System Live Data:\nUnder your farmer account (${userData.userName}, ID: ${userData.profile?.farmerId}), ${active.length} active crop listings are registered:\n${cropList}`;
        } else {
          exp = isHi
            ? 'आपके खाते में वर्तमान में कोई सक्रिय फसल लिस्टिंग उपलब्ध नहीं है। नई फसल जोड़ने के लिए "फसल जोड़ें" पर क्लिक करें।'
            : 'You currently have no active crop listings in your account.';
        }
        return {
          toolExecuted: 'getAuthenticatedUserData_crops',
          success: true,
          data: crops,
          groundedExplanation: exp,
          suggestedActions: [
            {
              id: 'act_nav_add_crop',
              label: 'Manage My Crops',
              labelHi: 'मेरी फसलें प्रबंधित करें',
              actionType: 'NAVIGATE_ADD_CROP',
            },
            {
              id: 'act_nav_market',
              label: 'View in Marketplace',
              labelHi: 'मार्केटप्लेस में देखें',
              actionType: 'NAVIGATE_MARKETPLACE',
            },
          ],
          dataSource: 'Live authenticated farmer crops database',
        };
      }

      // Farmer general profile
      const prof = userData.profile;
      const exp = isHi
        ? `आपकी पंजीकृत किसान प्रोफ़ाइल विवरण:\n• नाम: ${prof.name}\n• किसान ID: ${prof.farmerId}\n• स्थान: ${prof.location}\n• कुल भूमि: ${prof.landAreaAcres} एकड़\n• प्राथमिक फसलें: ${prof.primaryCrops?.join(', ')}\n• ई-केवाईसी स्थिति: ${prof.eKycStatus}\n• केसीसी स्थिति: ${prof.kccStatus}`
        : `Your Registered Farmer Profile Details:\n• Name: ${prof.name}\n• Farmer ID: ${prof.farmerId}\n• Location: ${prof.location}\n• Land Area: ${prof.landAreaAcres} Acres\n• Primary Crops: ${prof.primaryCrops?.join(', ')}\n• e-KYC: ${prof.eKycStatus}\n• KCC Status: ${prof.kccStatus}`;
      return {
        toolExecuted: 'getAuthenticatedUserData_profile',
        success: true,
        data: prof,
        groundedExplanation: exp,
        suggestedActions: [
          {
            id: 'act_nav_add_crop',
            label: 'Farmer Dashboard',
            labelHi: 'किसान डैशबोर्ड',
            actionType: 'NAVIGATE_ADD_CROP',
          },
        ],
        dataSource: 'Live authenticated farmer profile',
      };
    }

    // Buyer personal questions
    if (userData.role === 'buyer') {
      if (q.includes('requirement') || q.includes('मांग')) {
        const reqs = userData.requirements || [];
        let exp = '';
        if (reqs.length > 0) {
          const reqList = reqs
            .map(
              (r) =>
                `• ${r.crop} (${r.variety || 'All Varieties'}) - मात्रा: ${r.requiredQuantityKg ?? (r as any).targetQuantityKg} किग्रा, बजट: ₹${r.maxPricePerKg ?? (r as any).maxTargetPricePerKg}/किग्रा, स्थिति: ${r.status}`
            )
            .join('\n');
          exp = isHi
            ? `आपके खरीदार खाते में कुल ${reqs.length} आवश्यकताएं दर्ज हैं:\n${reqList}`
            : `You have ${reqs.length} posted requirement(s):\n${reqList}`;
        } else {
          exp = isHi
            ? 'आपके खरीदार खाते में अभी कोई मांग पोस्ट नहीं है। नई मांग दर्ज करने के लिए "Post Requirement" का उपयोग करें।'
            : 'You have not posted any buyer requirements yet.';
        }
        return {
          toolExecuted: 'getAuthenticatedUserData_requirements',
          success: true,
          data: reqs,
          groundedExplanation: exp,
          suggestedActions: [
            {
              id: 'act_nav_req',
              label: 'Post New Requirement',
              labelHi: 'नई मांग दर्ज करें',
              actionType: 'NAVIGATE_REQUIREMENTS',
            },
          ],
          dataSource: 'Live authenticated buyer requirements store',
        };
      }

      // Buyer orders
      const orders = userData.orders || [];
      let exp = '';
      if (orders.length > 0) {
        const orderList = orders
          .map(
            (o) =>
              `• ऑर्डर #${o.orderNumber || o.id}: ${o.crop} (${o.variety || 'A Grade'}) - मात्रा: ${o.quantityKg} किग्रा, कुल मूल्य: ₹${o.totalAmount || (o.pricePerKg || 0) * (o.quantityKg || 0)}, स्थिति: ${o.status}`
          )
          .join('\n');
        exp = isHi
          ? `आपके खाते में कुल ${orders.length} ऑर्डर्स दर्ज हैं:\n${orderList}\n\nसभी ऑर्डर्स किसानसेतु सुरक्षित एस्क्रो के तहत संरक्षित हैं।`
          : `You have ${orders.length} order(s) under your buyer account:\n${orderList}\n\nAll orders are protected by Mandi Escrow.`;
      } else {
        exp = isHi
          ? 'आपके खाते में वर्तमान में कोई सक्रिय ऑर्डर नहीं है। फसलें खरीदने के लिए मार्केटप्लेस देखें।'
          : 'You currently have no active orders in your buyer account.';
      }
      return {
        toolExecuted: 'getAuthenticatedUserData_orders',
        success: true,
        data: orders,
        groundedExplanation: exp,
        suggestedActions: [
          {
            id: 'act_nav_orders',
            label: 'View Order Details',
            labelHi: 'ऑर्डर विवरण देखें',
            actionType: 'NAVIGATE_ORDERS',
          },
          {
            id: 'act_nav_market',
            label: 'Browse Marketplace',
            labelHi: 'मार्केटप्लेस देखें',
            actionType: 'NAVIGATE_MARKETPLACE',
          },
        ],
        dataSource: 'Live authenticated buyer orders database',
      };
    }
  }

  // 3. Official Mandi Rate Queries (AGMARKNET Government Rates)
  // E.g.: "aaj ka mandi rate kya hai", "bareilly mandi wheat rate", "UP me wheat ka rate kya hai", "mandi bhav"
  const isMandiQuery =
    (q.includes('mandi') || q.includes('मंडी') || q.includes('bhav') || q.includes('भाव') || q.includes('rate') || q.includes('रेट')) &&
    !q.includes('website par') &&
    !q.includes('sasta wheat kis farmer') &&
    !q.includes('kaunse farmers');

  if (isMandiQuery) {
    // Extract commodity and district
    let matchedCommodity = 'Wheat';
    for (const [alias, canonical] of Object.entries(CROP_ALIASES)) {
      if (q.includes(alias)) {
        matchedCommodity = canonical;
        break;
      }
    }

    let matchedDistrict = undefined;
    for (const [alias, canonical] of Object.entries(DISTRICT_ALIASES)) {
      if (q.includes(alias)) {
        matchedDistrict = canonical;
        break;
      }
    }

    const mandiRes = await getMandiPrice({
      commodity: matchedCommodity,
      district: matchedDistrict,
    });

    if (!mandiRes.found) {
      return {
        toolExecuted: 'getMandiPrice',
        success: true,
        data: mandiRes,
        groundedExplanation: isHi
          ? 'इस समय इस फ़िल्टर के लिए सरकारी मंडी डेटा उपलब्ध नहीं है।'
          : 'Official government mandi data is not available for this filter right now.',
        suggestedActions: [
          {
            id: 'act_nav_mandi',
            label: 'Open Mandi Intelligence',
            labelHi: 'मंडी भाव देखें',
            actionType: 'NAVIGATE_MANDI',
          },
        ],
        dataSource: 'Source: Government mandi data / AGMARKNET',
      };
    }

    const summary = mandiRes.summary!;
    const exp = isHi
      ? `सरकारी मंडी डेटा (AGMARKNET):\n• फसल: ${mandiRes.commodity}\n• मंडी / जिला: ${summary.market}, ${summary.district}\n• मोडल (औसत) भाव: ₹${summary.modalPrice}/क्विंटल (₹${(summary.modalPrice / 100).toFixed(1)}/किग्रा)\n• न्यूनतम - अधिकतम: ₹${summary.minPrice} - ₹${summary.maxPrice}/क्विंटल\n• आवक तिथि: ${summary.arrivalDate}\n\nस्रोतः सरकारी मंडी डेटा / AGMARKNET`
      : `Official Mandi Data (AGMARKNET):\n• Commodity: ${mandiRes.commodity}\n• Market / District: ${summary.market}, ${summary.district}\n• Modal Price: ₹${summary.modalPrice}/quintal (₹${(summary.modalPrice / 100).toFixed(1)}/kg)\n• Min - Max Range: ₹${summary.minPrice} - ₹${summary.maxPrice}/quintal\n• Arrival Date: ${summary.arrivalDate}\n\nSource: Government mandi data / AGMARKNET`;

    return {
      toolExecuted: 'getMandiPrice',
      success: true,
      data: mandiRes,
      groundedExplanation: exp,
      suggestedActions: [
        {
          id: 'act_nav_mandi',
          label: 'Mandi Intelligence',
          labelHi: 'मंडी भाव देखें',
          actionType: 'NAVIGATE_MANDI',
        },
        {
          id: 'act_nav_market',
          label: 'Compare in Marketplace',
          labelHi: 'मार्केटप्लेस में तुलना करें',
          actionType: 'NAVIGATE_MARKETPLACE',
        },
      ],
      dataSource: 'Source: Government mandi data / AGMARKNET',
    };
  }

  // 4. Marketplace Search Queries
  // E.g.: "website par wheat kitne ka mil raha hai", "sabse sasta wheat kiske paas hai",
  // "kaunse farmers wheat sell kar rahe hain", "is farmer ke paas kitni quantity hai", "kaunse crops available hain"
  const isSellingOrBuyerInquiry =
    q.includes('bech') ||
    q.includes('बेच') ||
    q.includes('sell my') ||
    q.includes('can i sell') ||
    q.includes('buyer ko') ||
    q.includes('buyers ko') ||
    q.includes('खरीदार को') ||
    q.includes('फसल बेच');

  const qWithoutBrand = q
    .replace(/kisan\s*saathi|किसान\s*साथी|kisansetu|किसानसेतु/g, '')
    .trim();

  const isMarketplaceQuery =
    !isSellingOrBuyerInquiry &&
    (q.includes('website par') ||
      q.includes('market') ||
      q.includes('seller') ||
      qWithoutBrand.includes('farmer') ||
      qWithoutBrand.includes('किसान') ||
      q.includes('sasta') ||
      q.includes('cheapest') ||
      q.includes('lowest') ||
      q.includes('available') ||
      q.includes('kitne ka') ||
      q.includes('price') ||
      q.includes('stock') ||
      q.includes('quantity') ||
      q.includes('crops available'));

  if (isMarketplaceQuery) {
    let matchedCrop = undefined;
    for (const [alias, canonical] of Object.entries(CROP_ALIASES)) {
      if (q.includes(alias)) {
        matchedCrop = canonical;
        break;
      }
    }

    let matchedDistrict = undefined;
    for (const [alias, canonical] of Object.entries(DISTRICT_ALIASES)) {
      if (q.includes(alias)) {
        matchedDistrict = canonical;
        break;
      }
    }

    const wantsCheapest =
      q.includes('sasta') ||
      q.includes('cheapest') ||
      q.includes('lowest') ||
      q.includes('sabse kam') ||
      q.includes('कम कीमत');

    const searchRes = searchMarketplace({
      crop: matchedCrop,
      location: matchedDistrict,
      sortBy: wantsCheapest ? 'cheapest' : 'recommended',
    });

    if (!searchRes.found) {
      return {
        toolExecuted: 'searchMarketplace',
        success: true,
        data: searchRes,
        groundedExplanation: isHi
          ? 'किसानसेतु वेबसाइट पर अभी इस फसल की कोई सक्रिय लिस्टिंग उपलब्ध नहीं है।'
          : 'There are currently no active listings for this produce on the KisanSetu marketplace.',
        suggestedActions: [
          {
            id: 'act_nav_market',
            label: 'Open Marketplace',
            labelHi: 'मार्केटप्लेस खोलें',
            actionType: 'NAVIGATE_MARKETPLACE',
          },
        ],
        dataSource: 'Live KisanSetu marketplace data',
      };
    }

    let exp = '';
    const cheapest = searchRes.cheapestItem;
    if (wantsCheapest && cheapest) {
      exp = isHi
        ? `किसानसेतु लाइव मार्केटप्लेस रिपोर्ट:\nसबसे सस्ता ${cheapest.crop} किसान **${cheapest.farmerName}** (${cheapest.location}) के पास उपलब्ध है:\n• किस्म: ${cheapest.variety}\n• कीमत: ₹${cheapest.pricePerKg}/किग्रा (न्यूनतम)\n• उपलब्ध मात्रा: ${cheapest.availableQuantityKg.toLocaleString()} किग्रा (न्यूनतम ऑर्डर: ${cheapest.minOrderQtyKg} किग्रा)\n• ग्रेड: ${cheapest.grade}, रेटिंग: ⭐${cheapest.farmerRating}\n• भंडारण: ${cheapest.storageType || 'ऑन-फार्म'}`
        : `KisanSetu Live Marketplace Report:\nThe lowest priced ${cheapest.crop} is listed by farmer **${cheapest.farmerName}** (${cheapest.location}):\n• Variety: ${cheapest.variety}\n• Price: ₹${cheapest.pricePerKg}/kg\n• Available Stock: ${cheapest.availableQuantityKg.toLocaleString()} kg (Min Order: ${cheapest.minOrderQtyKg} kg)\n• Grade: ${cheapest.grade}, Rating: ⭐${cheapest.farmerRating}\n• Storage: ${cheapest.storageType || 'On-Farm'}`;
    } else {
      const itemsOverview = searchRes.items
        .slice(0, 4)
        .map(
          (item) =>
            `• ${item.crop} (${item.variety}) - ₹${item.pricePerKg}/किग्रा | मात्रा: ${item.availableQuantityKg.toLocaleString()} किग्रा | किसान: ${item.farmerName} (${item.district}, ${item.state})`
        )
        .join('\n');

      const priceRange = searchRes.priceRange
        ? ` (रेट दायरा: ₹${searchRes.priceRange.min} - ₹${searchRes.priceRange.max}/किग्रा, औसत: ₹${searchRes.priceRange.average}/किग्रा)`
        : '';

      exp = isHi
        ? `किसानसेतु लाइव मार्केटप्लेस डेटा:\nवर्तमान में कुल ${searchRes.count} लिस्टिंग उपलब्ध हैं${priceRange}:\n${itemsOverview}\n\nसभी फसलें सत्यापित किसानों द्वारा सूचीबद्ध हैं और सीधी खरीद के लिए उपलब्ध हैं।`
        : `KisanSetu Live Marketplace Data:\nCurrently, ${searchRes.count} listing(s) are available${priceRange}:\n${itemsOverview}\n\nAll listings are farm-direct from verified sellers.`;
    }

    return {
      toolExecuted: 'searchMarketplace',
      success: true,
      data: searchRes,
      groundedExplanation: exp,
      suggestedActions: [
        {
          id: 'act_nav_market',
          label: 'View in Marketplace',
          labelHi: 'मार्केटप्लेस में देखें',
          actionType: 'NAVIGATE_MARKETPLACE',
        },
      ],
      dataSource: 'Live KisanSetu marketplace data',
    };
  }

  // 5. Crop Variety Catalog Queries
  // E.g.: "wheat ki kaunsi varieties hoti hain", "sarson ki varieties"
  if (q.includes('variety') || q.includes('किस्म') || q.includes('प्रकार')) {
    let matchedCrop = 'Wheat';
    for (const [alias, canonical] of Object.entries(CROP_ALIASES)) {
      if (q.includes(alias)) {
        matchedCrop = canonical;
        break;
      }
    }

    const varRes = getCropVarieties(matchedCrop);
    if (varRes.success && varRes.varieties.length > 0) {
      const vList = varRes.varieties.map((v) => `• ${v.name} (${v.nameHi})${v.gradeReference ? ` - ${v.gradeReference}` : ''}`).join('\n');
      const exp = isHi
        ? `किसानसेतु डेटाबेस के अनुसार ${varRes.crop} की मुख्य किस्में:\n${vList}\n\nमानक नमी: ${varRes.standardMoisture || 'मानक'}\nभंडारण: ${varRes.standardStorage || 'उचित शेड'}`
        : `Official Varieties for ${varRes.crop} in KisanSetu database:\n${vList}\n\nStandard Moisture: ${varRes.standardMoisture}\nStorage: ${varRes.standardStorage}`;

      return {
        toolExecuted: 'getCropVarieties',
        success: true,
        data: varRes,
        groundedExplanation: exp,
        suggestedActions: [
          {
            id: 'act_nav_market',
            label: 'Search Crop in Marketplace',
            labelHi: 'मार्केटप्लेस में खोजें',
            actionType: 'NAVIGATE_MARKETPLACE',
          },
        ],
        dataSource: 'KisanSetu Crop Variety Catalog',
      };
    }
  }

  // 6. Navigation / Website Features How-To Queries
  const navHelp = getWebsiteNavigationHelp(userQuery);
  if (navHelp) {
    return {
      toolExecuted: 'getWebsiteNavigationHelp',
      success: true,
      data: navHelp,
      groundedExplanation: isHi ? navHelp.instructionsHi : navHelp.instructionsEn,
      suggestedActions: [navHelp.suggestedAction],
      dataSource: 'KisanSetu Official Platform Guide',
    };
  }

  return null;
}
