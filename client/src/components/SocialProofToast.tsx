import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TrendingUp, Globe, Clock, DollarSign, Sparkles } from "lucide-react";

interface SocialProofEvent {
  id: string;
  user: string;
  action: string;
  domain?: string;
  value?: string;
  time: string;
  icon: React.ReactNode;
}

const mockEvents: SocialProofEvent[] = [
  { id: "1", user: "Mike from Texas", action: "found a hidden gem", domain: "TechVault.com", value: "$4,500", time: "2 min ago", icon: <Sparkles className="w-4 h-4 text-yellow-500" /> },
  { id: "2", user: "Sarah", action: "flipped", domain: "GreenEnergy.co", value: "$12,000", time: "5 min ago", icon: <DollarSign className="w-4 h-4 text-green-500" /> },
  { id: "3", user: "David", action: "analyzed 50 domains", time: "8 min ago", icon: <Globe className="w-4 h-4 text-blue-500" /> },
  { id: "4", user: "Lisa from CA", action: "saved", domain: "CryptoWallet.net", value: "$8,200", time: "12 min ago", icon: <TrendingUp className="w-4 h-4 text-purple-500" /> },
  { id: "5", user: "Tom", action: "joined Pro", time: "15 min ago", icon: <Clock className="w-4 h-4 text-indigo-500" /> },
  { id: "6", user: "Jennifer", action: "found", domain: "AIStartup.io", value: "$15,000", time: "18 min ago", icon: <Sparkles className="w-4 h-4 text-yellow-500" /> },
  { id: "7", user: "Alex from NY", action: "registered", domain: "DataHub.pro", value: "$3,800", time: "22 min ago", icon: <Globe className="w-4 h-4 text-blue-500" /> },
  { id: "8", user: "Chris", action: "upgraded to Pro", time: "25 min ago", icon: <DollarSign className="w-4 h-4 text-green-500" /> },
];

export function useSocialProof() {
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (hasStarted) return;
    setHasStarted(true);

    // Show first notification after 10 seconds
    const initialTimeout = setTimeout(() => {
      showRandomEvent();
    }, 10000);

    // Continue showing notifications every 45-90 seconds
    const interval = setInterval(() => {
      showRandomEvent();
    }, 45000 + Math.random() * 45000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [hasStarted]);

  const showRandomEvent = () => {
    const event = mockEvents[Math.floor(Math.random() * mockEvents.length)];
    
    toast.success(
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{event.icon}</div>
        <div className="flex-1">
          <p className="font-medium text-sm">
            {event.user} {event.action}
          </p>
          {event.domain && (
            <p className="text-sm font-semibold text-indigo-600">
              {event.domain}
            </p>
          )}
          {event.value && (
            <p className="text-xs text-green-600 font-medium">
              Est. value: {event.value}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">{event.time}</p>
        </div>
      </div>,
      {
        duration: 5000,
        position: "bottom-right",
      }
    );
  };
}

export function SocialProofToast() {
  useSocialProof();
  return null;
}
