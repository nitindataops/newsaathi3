import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  DollarSign,
  ShieldCheck,
  AlertCircle,
  Navigation,
  ArrowRight,
  Route,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { LanguageCode } from '../../types';
import {
  generateSampleLogistics,
  LogisticsShipment,
  calculateFreightEstimate,
} from '../../services/logisticsService';

interface LogisticsTrackerViewProps {
  orders?: any[];
  currentLanguage: LanguageCode;
}

export const LogisticsTrackerView: React.FC<LogisticsTrackerViewProps> = ({
  orders = [],
  currentLanguage,
}) => {
  const isHindi = currentLanguage === 'hi';
  const shipments = generateSampleLogistics(orders);
  const [selectedShipment, setSelectedShipment] = useState<LogisticsShipment>(shipments[0]);

  // Interactive Freight Calculator state
  const [calcDistance, setCalcDistance] = useState<number>(35);
  const [calcQuantity, setCalcQuantity] = useState<number>(3000);
  const freightCalc = calculateFreightEstimate(calcDistance, calcQuantity);

  const steps = [
    { title: isHindi ? 'ऑर्डर पुष्टि' : 'Order Confirmed' },
    { title: isHindi ? 'वाहन प्रस्थान' : 'Vehicle Dispatched' },
    { title: isHindi ? 'खेत पर तौल' : 'Farm Gate Weighment' },
    { title: isHindi ? 'मार्ग में' : 'In Transit' },
    { title: isHindi ? 'अनलोडिंग व भुगतान' : 'Delivered & Escrow' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="rounded-3xl bg-linear-to-br from-[#245C3A] via-[#1E4D31] to-[#122E1D] text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-[#D6A63A]/20 blur-3xl" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#D6A63A] text-xs font-bold mb-3">
            <Truck className="w-3.5 h-3.5" />
            <span>{isHindi ? 'स्मार्ट लॉजिस्टिक्स व पिकअप प्रबंधन' : 'Smart Logistics & Farm Gate Dispatch'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black mb-2 text-white">
            {isHindi ? 'खेत से मिल तक लाइव ढुलाई ट्रैकिंग' : 'Live Agri-Freight & Farm Gate Pickup Tracking'}
          </h1>
          <p className="text-sm text-[#EEF3E8] leading-relaxed">
            {isHindi
              ? 'सत्यापित ड्राइवरों द्वारा खेत पर डिजिटल धर्मकांटा तौल, जीपीएस रूटिंग और नजदीकी किसानों के साथ संयुक्त रूटिंग से परिवहन व्यय में २५% तक बचत।'
              : 'End-to-end telemetry from farm gate pickup to APMC/mill gate delivery with automated weighbridge sync and pooled carrier freight savings.'}
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of Shipments */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-[#EEF3E8] p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#68736B] mb-3">
              {isHindi ? 'सक्रिय लॉजिस्टिक्स शिपमेंट्स' : 'Active Dispatches & Orders'}
            </h3>

            <div className="space-y-3">
              {shipments.map((s) => (
                <button
                  key={s.orderId}
                  onClick={() => setSelectedShipment(s)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selectedShipment.orderId === s.orderId
                      ? 'bg-[#FBFAF4] border-[#245C3A] ring-2 ring-[#245C3A]/20 shadow-xs'
                      : 'bg-white border-[#EEF3E8] hover:border-[#245C3A]/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold text-[#245C3A] bg-[#245C3A]/10 px-2 py-0.5 rounded-md">
                      {s.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        s.pickupStatus === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {s.pickupStatus}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-[#26332B] font-serif mb-1">
                    {s.cropName} ({s.quantityKg.toLocaleString('en-IN')} kg)
                  </h4>

                  <p className="text-xs text-[#68736B] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#5F8F45]" />
                    <span>{s.farmerLocation.village} → {s.buyerLocation.district}</span>
                  </p>

                  {s.isPooledRoute && (
                    <div className="mt-2 text-[10px] font-bold text-[#8C6212] bg-[#D6A63A]/20 px-2 py-0.5 rounded-md inline-block">
                      {isHindi
                        ? `✨ संयुक्त रूट: ३ किसानों के साथ ${s.pooledSavingsPercent}% भाड़ा बचत`
                        : `✨ Pooled Route: ${s.pooledSavingsPercent}% freight savings`}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Freight Calculator Widget */}
          <div className="bg-[#FBFAF4] rounded-2xl border border-[#EEF3E8] p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-[#68736B] uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-[#245C3A]" />
              <span>{isHindi ? 'अनुमानित भाड़ा कैलकुलेटर' : 'Agri Freight Estimator'}</span>
            </h4>

            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span className="text-[#68736B]">{isHindi ? 'दूरी:' : 'Distance:'}</span>
                <span className="text-[#245C3A] font-bold">{calcDistance} km</span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={calcDistance}
                onChange={(e) => setCalcDistance(Number(e.target.value))}
                className="w-full accent-[#245C3A]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span className="text-[#68736B]">{isHindi ? 'मात्रा:' : 'Quantity:'}</span>
                <span className="text-[#245C3A] font-bold">
                  {calcQuantity.toLocaleString('en-IN')} kg ({(calcQuantity / 100).toFixed(0)} Qtl)
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="15000"
                step="500"
                value={calcQuantity}
                onChange={(e) => setCalcQuantity(Number(e.target.value))}
                className="w-full accent-[#245C3A]"
              />
            </div>

            <div className="pt-2 border-t border-[#EEF3E8] flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-[#68736B] block">{isHindi ? 'सुझाया गया वाहन:' : 'Vehicle:'}</span>
                <span className="font-bold text-[#26332B]">{freightCalc.suggestedVehicle}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#68736B] block">{isHindi ? 'कुल अनुमानित भाड़ा:' : 'Est. Freight:'}</span>
                <span className="font-black text-sm text-[#245C3A]">₹{freightCalc.totalCost}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Shipment Live Telemetry */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl border border-[#EEF3E8] p-6 sm:p-8 shadow-sm space-y-6">
            {/* Shipment Topline */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EEF3E8]">
              <div>
                <span className="font-mono text-xs font-bold text-[#245C3A]">
                  {selectedShipment.orderNumber} • Lot: {selectedShipment.lotId}
                </span>
                <h2 className="text-xl font-bold font-serif text-[#26332B] mt-1">
                  {selectedShipment.cropName} ({selectedShipment.quantityKg.toLocaleString('en-IN')} kg)
                </h2>
                <p className="text-xs text-[#68736B]">
                  {isHindi ? 'खरीदार:' : 'Buyer:'} {selectedShipment.buyerName}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold text-[#68736B] block">
                  {isHindi ? 'परिवहन किराया' : 'Total Freight'}
                </span>
                <span className="text-xl font-black text-[#245C3A]">
                  ₹{selectedShipment.totalFreightCost}
                </span>
                <span className="text-[11px] text-[#68736B] block">
                  (₹{selectedShipment.freightCostPerQuintal}/Qtl)
                </span>
              </div>
            </div>

            {/* Step Progress Tracker */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#68736B] mb-3">
                {isHindi ? 'पिकअप व डिलीवरी चरण' : 'Pickup & Delivery Progress'}
              </h4>
              <div className="grid grid-cols-5 gap-1.5 text-center">
                {steps.map((step, idx) => {
                  const isDone = idx <= selectedShipment.stepIndex;
                  const isCurrent = idx === selectedShipment.stepIndex;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isDone ? 'bg-[#245C3A]' : 'bg-[#EEF3E8]'
                        } ${isCurrent ? 'ring-2 ring-[#D6A63A]' : ''}`}
                      />
                      <span
                        className={`text-[10px] block font-semibold leading-tight ${
                          isDone ? 'text-[#245C3A]' : 'text-[#68736B]'
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Geo Route Locations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#FBFAF4] border border-[#EEF3E8] space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#245C3A] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'पिकअप (किसान का खेत)' : 'Pickup (Farm Gate)'}</span>
                </span>
                <p className="text-xs font-bold text-[#26332B]">{selectedShipment.farmerLocation.village}</p>
                <p className="text-[11px] text-[#68736B]">
                  {selectedShipment.farmerLocation.tehsil}, {selectedShipment.farmerLocation.district} (PIN: {selectedShipment.farmerLocation.pincode})
                </p>
                <p className="text-[11px] font-semibold text-[#245C3A]">
                  {isHindi ? 'समय:' : 'Time:'} {selectedShipment.estimatedPickupTime}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FBFAF4] border border-[#EEF3E8] space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#8C6212] flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'डिलीवरी (खरीदार गोदाम/मिल)' : 'Destination (Buyer Mill)'}</span>
                </span>
                <p className="text-xs font-bold text-[#26332B]">{selectedShipment.buyerLocation.facilityName}</p>
                <p className="text-[11px] text-[#68736B]">
                  {selectedShipment.buyerLocation.address}, {selectedShipment.buyerLocation.district}
                </p>
                <p className="text-[11px] font-semibold text-[#8C6212]">
                  {isHindi ? 'अनुमानित पहुंच:' : 'ETA:'} {selectedShipment.estimatedDeliveryTime}
                </p>
              </div>
            </div>

            {/* Driver & Vehicle Details */}
            <div className="p-4 rounded-2xl bg-white border border-[#EEF3E8] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#245C3A]/10 text-[#245C3A] flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#26332B]">{selectedShipment.driverName}</h4>
                  <p className="text-[11px] text-[#68736B]">
                    {selectedShipment.vehicleType} • {selectedShipment.vehicleNumber}
                  </p>
                </div>
              </div>

              <a
                href={`tel:${selectedShipment.driverPhone}`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#245C3A] text-white text-xs font-bold hover:bg-[#1B432B] transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{isHindi ? 'ड्राइवर से बात करें' : 'Call Driver'}</span>
              </a>
            </div>

            {/* Live Tracking Timeline */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#68736B] mb-3">
                {isHindi ? 'लाइव स्थिति अपडेट (Audit Trail)' : 'Live Telemetry Audit'}
              </h4>
              <div className="space-y-3">
                {selectedShipment.trackingUpdates.map((t, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-[#245C3A] mt-1 shrink-0 ring-4 ring-[#245C3A]/15" />
                    <div className="flex-1">
                      <p className="font-bold text-[#26332B]">{t.status}</p>
                      <p className="text-[11px] text-[#68736B]">{t.location}</p>
                    </div>
                    <span className="font-mono text-[10px] text-[#68736B]">{t.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
