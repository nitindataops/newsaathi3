import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  Sprout,
  TrendingUp,
  Search,
  Package,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { CropListing, FarmerDashboardTab } from '../../types/farmer';
import { LanguageCode } from '../../types';

interface VoiceKisanModeViewProps {
  crops?: CropListing[];
  onSelectTab?: (tab: FarmerDashboardTab) => void;
  onOpenSellModal?: () => void;
  currentLanguage: LanguageCode;
}

export const VoiceKisanModeView: React.FC<VoiceKisanModeViewProps> = ({
  crops = [],
  onSelectTab,
  onOpenSellModal,
  currentLanguage,
}) => {
  const isHindi = currentLanguage === 'hi';
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [assistantReply, setAssistantReply] = useState(
    isHindi
      ? 'नमस्ते किसान साथी! आप बोलकर फसल बेच सकते हैं, भाव जान सकते हैं या ऑर्डर देख सकते हैं। नीचे माइक बटन दबाएं।'
      : 'Welcome Kisan Saathi! Tap the microphone to sell crops, check mandi rates, or track active orders.'
  );
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [detectedAction, setDetectedAction] = useState<{
    type: string;
    label: string;
    action: () => void;
  } | null>(null);

  const recognitionRef = useRef<any>(null);

  // Suggested voice prompts in Hindi
  const sampleVoicePrompts = [
    { text: 'मुझे अपनी गेहूं की फसल बेचनी है', category: 'sell' },
    { text: 'आज का गेहूं और चना का मंडी भाव क्या है?', category: 'mandi' },
    { text: 'मेरी फसल की एआई गुणवत्ता जांच करो', category: 'health' },
    { text: 'मेरे ऑर्डर और पिकअप की क्या स्थिति है?', category: 'orders' },
    { text: 'नजदीकी वेयरहाउस और कोल्ड स्टोरेज दिखाओ', category: 'storage' },
  ];

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN';

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);

        if (event.results[current].isFinal) {
          handleVoiceCommand(text);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(
        isHindi
          ? 'आपके ब्राउज़र में आवाज़ पहचान (Speech Recognition) समर्थित नहीं है। आप नीचे दिए गए बटनों का उपयोग कर सकते हैं।'
          : 'Speech recognition is not supported in this browser. Please use the quick sample buttons.'
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setDetectedAction(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Recognition start failed', err);
      }
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.95;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVoiceCommand = (userSpeech: string) => {
    const s = userSpeech.toLowerCase();

    // 1. Sell crop intent: "Mujhe apni gehun ki fasal bechni hai"
    if (s.includes('bechni') || s.includes('sell') || s.includes('बेचना') || s.includes('बेचनी')) {
      const reply = isHindi
        ? 'बहुत बढ़िया! मैंने आपका अनुरोध समझ लिया है। आइए आपकी फसल के लिए डिजिटल लॉट बनाएं और सत्यापित खरीदार खोजें।'
        : 'Understood! Let us register your crop lot and find verified buyers.';
      setAssistantReply(reply);
      speakText(reply);
      setDetectedAction({
        type: 'SELL_CROP',
        label: isHindi ? 'फसल बिक्री फ़ॉर्म खोलें' : 'Open Crop Listing Form',
        action: () => {
          if (onOpenSellModal) onOpenSellModal();
          else if (onSelectTab) onSelectTab('add-crop');
        },
      });
    }
    // 2. Mandi price intent
    else if (s.includes('bhav') || s.includes('bhaav') || s.includes('rate') || s.includes('भाव') || s.includes('मंडी')) {
      const reply = isHindi
        ? 'आज उत्तर प्रदेश मंडियों में गेहूं ₹२७ से ₹२९ और काबुली चना ₹६४ प्रति किलो ट्रेड हो रहा है। आइए लाइव भाव देखें।'
        : 'Today wheat is trading at ₹27-29/kg and Chana at ₹64/kg. Let us view the full APMC board.';
      setAssistantReply(reply);
      speakText(reply);
      setDetectedAction({
        type: 'VIEW_MANDI',
        label: isHindi ? 'लाइव मंडी भाव देखें' : 'View Live Mandi Rates',
        action: () => {
          if (onSelectTab) onSelectTab('market-prices');
        },
      });
    }
    // 3. AI Crop Health intent
    else if (s.includes('jaanch') || s.includes('rog') || s.includes('quality') || s.includes('जांच') || s.includes('बीमारी')) {
      const reply = isHindi
        ? 'फसल स्वास्थ्य जांच के लिए तैयार! अपनी फसल की फोटो खींचें ताकि एआई तुरंत रोग लक्षण व गुणवत्ता ग्रेड बता सके।'
        : 'AI Crop Diagnosis ready! Capture a crop photo to estimate quality grade and pathogen risks.';
      setAssistantReply(reply);
      speakText(reply);
      setDetectedAction({
        type: 'CROP_HEALTH',
        label: isHindi ? 'एआई फसल स्कैनर खोलें' : 'Open AI Crop Scanner',
        action: () => {
          if (onSelectTab) onSelectTab('ai-analysis');
        },
      });
    }
    // 4. Order status intent
    else if (s.includes('order') || s.includes('pickup') || s.includes('ऑर्डर') || s.includes('ट्रैकिंग')) {
      const reply = isHindi
        ? 'आपके पास २ सक्रिय ऑर्डर हैं। काबुली चना का ट्रक खेत की ओर निकल चुका है। आइए लॉजिस्टिक्स ट्रैकर देखें।'
        : 'You have active orders. Truck is en route to farm gate. Let us open logistics tracking.';
      setAssistantReply(reply);
      speakText(reply);
      setDetectedAction({
        type: 'VIEW_LOGISTICS',
        label: isHindi ? 'पिकअप व लॉजिस्टिक्स ट्रैक करें' : 'Track Pickup Logistics',
        action: () => {
          if (onSelectTab) onSelectTab('logistics');
        },
      });
    }
    // Default fallback
    else {
      const reply = isHindi
        ? `आपने कहा: "${userSpeech}"। आप फसल बेचने, भाव पूछने या खरीदार खोजने के लिए कह सकते हैं।`
        : `You said: "${userSpeech}". You can ask to sell crops, check prices, or find buyers.`;
      setAssistantReply(reply);
      speakText(reply);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Banner */}
      <div className="rounded-3xl bg-linear-to-br from-[#245C3A] via-[#1B432B] to-[#122E1D] text-white p-6 sm:p-8 shadow-xl text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#D6A63A] text-xs font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isHindi ? 'आवाज़-प्रथम किसान मोड' : 'Voice-First Kisan Mode'}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-serif font-black mb-3 text-white">
          {isHindi ? 'बोलकर चलाएं किसान साथी' : 'Voice-Assisted Kisan Navigation'}
        </h1>
        <p className="text-sm text-[#EEF3E8] max-w-lg mx-auto leading-relaxed">
          {isHindi
            ? 'टाइप करने की जरूरत नहीं! सीधे हिंदी में बोलें और अपनी फसल बेचें, भाव पता करें या लॉजिस्टिक्स ट्रैक करें।'
            : 'Designed specifically for rural smartphones with hands-free Hindi voice input and natural audio feedback.'}
        </p>
      </div>

      {/* Big Interactive Microphone Section */}
      <div className="bg-white rounded-3xl border border-[#EEF3E8] p-8 sm:p-12 shadow-md text-center flex flex-col items-center justify-center space-y-6">
        {/* Animated Listening Wave Circle */}
        <div className="relative">
          {isListening && (
            <div className="absolute -inset-4 rounded-full bg-[#245C3A]/20 animate-ping" />
          )}
          <button
            onClick={toggleListening}
            className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 transform active:scale-95 ${
              isListening
                ? 'bg-rose-600 ring-8 ring-rose-200 animate-pulse scale-105'
                : 'bg-linear-to-br from-[#245C3A] to-[#183B27] hover:brightness-110'
            }`}
          >
            {isListening ? (
              <Mic className="w-14 h-14 animate-bounce" />
            ) : (
              <Mic className="w-14 h-14 text-[#D6A63A]" />
            )}
          </button>
        </div>

        {/* Live Status Label */}
        <div>
          <span
            className={`text-sm font-bold uppercase tracking-wider px-4 py-1.5 rounded-full inline-block ${
              isListening
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : 'bg-[#FBFAF4] text-[#245C3A] border border-[#EEF3E8]'
            }`}
          >
            {isListening
              ? isHindi
                ? '🔴 आपकी आवाज़ सुन रहे हैं... बोलिए'
                : '🔴 Listening... Speak now'
              : isHindi
              ? 'माइक दबाकर बोलना शुरू करें'
              : 'Tap microphone to speak'}
          </span>
        </div>

        {/* Live Transcript Display */}
        {transcript && (
          <div className="p-4 rounded-2xl bg-[#FBFAF4] border border-[#EEF3E8] max-w-xl w-full">
            <span className="text-[10px] uppercase font-bold text-[#68736B] block mb-1">
              {isHindi ? 'पहचाने गए शब्द:' : 'Recognized Speech:'}
            </span>
            <p className="text-base font-bold text-[#26332B] font-serif">"{transcript}"</p>
          </div>
        )}

        {/* Assistant Reply Card */}
        <div className="p-5 rounded-2xl bg-[#EAF3E7] border border-[#5F8F45]/30 max-w-xl w-full text-left flex items-start gap-4">
          <button
            onClick={() => speakText(assistantReply)}
            className="p-3 rounded-full bg-[#245C3A] text-white shrink-0 hover:bg-[#1B432B] transition-colors"
            title="Listen again"
          >
            {isSpeaking ? <Volume2 className="w-5 h-5 animate-pulse" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <div className="flex-1">
            <span className="text-[10px] uppercase font-bold text-[#245C3A] block mb-1">
              {isHindi ? 'किसान साथी सहायक:' : 'Kisan Saathi Audio Voice:'}
            </span>
            <p className="text-sm font-semibold text-[#183B27] leading-relaxed">
              {assistantReply}
            </p>

            {/* If an action was identified */}
            {detectedAction && (
              <button
                onClick={detectedAction.action}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#245C3A] text-white text-xs font-bold hover:bg-[#1B432B] transition-colors shadow-xs"
              >
                <span>{detectedAction.label}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Voice Prompt Shortcuts */}
        <div className="pt-4 border-t border-[#EEF3E8] w-full max-w-xl">
          <p className="text-xs font-bold text-[#68736B] uppercase tracking-wider mb-3">
            {isHindi ? 'या इनमें से कोई भी प्रश्न टैप करें:' : 'Or tap any popular question:'}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {sampleVoicePrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => {
                  setTranscript(prompt.text);
                  handleVoiceCommand(prompt.text);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#FBFAF4] hover:bg-white border border-[#EEF3E8] text-xs font-semibold text-[#26332B] hover:border-[#245C3A] transition-all text-left flex items-center gap-2"
              >
                <span className="text-[#5F8F45]">🎙️</span>
                <span>{prompt.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
