export interface LogisticsShipment {
  orderId: string;
  orderNumber: string;
  lotId: string;
  farmerName: string;
  farmerLocation: {
    village: string;
    tehsil: string;
    district: string;
    pincode: string;
  };
  buyerName: string;
  buyerLocation: {
    facilityName: string;
    address: string;
    district: string;
  };
  cropName: string;
  quantityKg: number;
  quantityQuintals: number;
  estimatedDistanceKm: number;
  freightCostPerQuintal: number;
  totalFreightCost: number;
  vehicleType: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  pickupStatus: 'Assigned' | 'Driver En Route' | 'At Farm Gate' | 'Weighed & Loaded' | 'In Transit' | 'Delivered';
  stepIndex: number; // 0 to 5
  estimatedPickupTime: string;
  estimatedDeliveryTime: string;
  isPooledRoute: boolean; // Combined route with nearby farmers
  pooledFarmersCount?: number;
  pooledSavingsPercent?: number;
  trackingUpdates: Array<{
    status: string;
    time: string;
    location: string;
  }>;
}

export function generateSampleLogistics(orders: any[] = []): LogisticsShipment[] {
  return [
    {
      orderId: 'ord-101',
      orderNumber: 'ORD-2026-8941',
      lotId: 'KS-CHN-2026-001',
      farmerName: 'Rameshwar Singh',
      farmerLocation: {
        village: 'Village Mehmoodpur',
        tehsil: 'Suar',
        district: 'Rampur',
        pincode: '244924',
      },
      buyerName: 'Agarwal Agro Food Processors & Mills',
      buyerLocation: {
        facilityName: 'Processing Unit 2, Industrial Estate',
        address: 'Delhi Road, Moradabad',
        district: 'Moradabad',
      },
      cropName: 'Kabuli Chana (Pulses)',
      quantityKg: 2500,
      quantityQuintals: 25,
      estimatedDistanceKm: 38,
      freightCostPerQuintal: 48,
      totalFreightCost: 1200,
      vehicleType: 'Tata 407 (4-Tonne Covered Agri)',
      vehicleNumber: 'UP 22 T 8841',
      driverName: 'Mohan Lal Verma',
      driverPhone: '+91 98371 44210',
      pickupStatus: 'In Transit',
      stepIndex: 3,
      estimatedPickupTime: '10:30 AM, Today',
      estimatedDeliveryTime: '03:30 PM, Today',
      isPooledRoute: true,
      pooledFarmersCount: 3,
      pooledSavingsPercent: 24,
      trackingUpdates: [
        { status: 'Order Verified & Escrow Funded', time: '08:00 AM', location: 'Kisan Saathi Platform' },
        { status: 'Vehicle Dispatched to Suar Village', time: '09:15 AM', location: 'Rampur Transport Hub' },
        { status: 'Digital Weighment at Farm Gate (2,500 kg clean)', time: '11:00 AM', location: 'Mehmoodpur, Suar' },
        { status: 'Passed NH-24 Toll & In Transit to Moradabad', time: '01:15 PM', location: 'Rampur-Moradabad Highway' },
      ],
    },
    {
      orderId: 'ord-102',
      orderNumber: 'ORD-2026-8910',
      lotId: 'KS-WHT-2026-002',
      farmerName: 'Rameshwar Singh',
      farmerLocation: {
        village: 'Tehsil Suar',
        tehsil: 'Suar',
        district: 'Rampur',
        pincode: '244924',
      },
      buyerName: 'Kisan Shakti Wholesale Trading Co.',
      buyerLocation: {
        facilityName: 'Godown 14, Main APMC Mandi Yard',
        address: 'Bareilly Road, Rampur',
        district: 'Rampur',
      },
      cropName: 'Sharbati Wheat (HD-3086)',
      quantityKg: 5000,
      quantityQuintals: 50,
      estimatedDistanceKm: 22,
      freightCostPerQuintal: 35,
      totalFreightCost: 1750,
      vehicleType: 'Eicher Pro 2049 (6-Tonne)',
      vehicleNumber: 'UP 21 E 4122',
      driverName: 'Jaswant Singh',
      driverPhone: '+91 97561 22890',
      pickupStatus: 'Delivered',
      stepIndex: 5,
      estimatedPickupTime: '02 Sep 2026, 09:00 AM',
      estimatedDeliveryTime: '02 Sep 2026, 01:30 PM',
      isPooledRoute: false,
      trackingUpdates: [
        { status: 'Farm Gate Inspection Completed', time: '09:30 AM', location: 'Suar' },
        { status: 'Arrived at APMC Mandi Warehouse', time: '12:45 PM', location: 'Rampur Mandi' },
        { status: 'Unloading verified & Digital Escrow Released', time: '01:30 PM', location: 'Rampur Mandi' },
      ],
    },
  ];
}

export function calculateFreightEstimate(
  distanceKm: number,
  quantityKg: number
): { ratePerQuintal: number; totalCost: number; suggestedVehicle: string } {
  const quintals = quantityKg / 100;
  // Base rate ₹20/qtl + ₹0.8/km/qtl
  const ratePerQuintal = Math.round(20 + distanceKm * 0.75);
  const totalCost = Math.round(quintals * ratePerQuintal);

  let suggestedVehicle = 'Tata Ace (1.5-Tonne)';
  if (quintals > 70) suggestedVehicle = '10-Wheeler Truck (16-Tonne)';
  else if (quintals > 35) suggestedVehicle = 'Eicher Pro 2049 (6-Tonne)';
  else if (quintals > 15) suggestedVehicle = 'Tata 407 (4-Tonne)';

  return { ratePerQuintal, totalCost, suggestedVehicle };
}
