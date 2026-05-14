import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, Globe, Clock, Sparkles, DollarSign, User } from "lucide-react";

interface Activity {
  id: string;
  user: string;
  action: string;
  domain?: string;
  value?: string;
  time: string;
  type: "find" | "sale" | "analysis" | "signup" | "upgrade";
}

const mockActivities: Activity[] = [
  { id: "1", user: "Mike R.", action: "found a hidden gem", domain: "TechVault.com", value: "$4,500", time: "2 min ago", type: "find" },
  { id: "2", user: "Sarah K.", action: "flipped", domain: "GreenEnergy.co", value: "$12,000", time: "5 min ago", type: "sale" },
  { id: "3", user: "David L.", action: "analyzed 50 domains", time: "8 min ago", type: "analysis" },
  { id: "4", user: "Lisa M.", action: "saved", domain: "CryptoWallet.net", value: "$8,200", time: "12 min ago", type: "find" },
  { id: "5", user: "Tom H.", action: "joined Pro", time: "15 min ago", type: "upgrade" },
  { id: "6", user: "Jennifer W.", action: "found", domain: "AIStartup.io", value: "$15,000", time: "18 min ago", type: "find" },
  { id: "7", user: "Alex P.", action: "registered", domain: "DataHub.pro", value: "$3,800", time: "22 min ago", type: "sale" },
  { id: "8", user: "Chris B.", action: "upgraded to Pro", time: "25 min ago", type: "upgrade" },
  { id: "9", user: "Emma S.", action: "analyzed 25 domains", time: "28 min ago", type: "analysis" },
  { id: "10", user: "James R.", action: "found", domain: "CloudBase.io", value: "$6,500", time: "32 min ago", type: "find" },
];

function getActivityIcon(type: Activity["type"]) {
  switch (type) {
    case "find":
      return <Sparkles className="w-4 h-4 text-yellow-500" />;
    case "sale":
      return <DollarSign className="w-4 h-4 text-green-500" />;
    case "analysis":
      return <Globe className="w-4 h-4 text-blue-500" />;
    case "upgrade":
      return <TrendingUp className="w-4 h-4 text-purple-500" />;
    default:
      return <User className="w-4 h-4 text-gray-500" />;
  }
}

function getActivityColor(type: Activity["type"]) {
  switch (type) {
    case "find":
      return "bg-yellow-50 border-yellow-200";
    case "sale":
      return "bg-green-50 border-green-200";
    case "analysis":
      return "bg-blue-50 border-blue-200";
    case "upgrade":
      return "bg-purple-50 border-purple-200";
    default:
      return "bg-gray-50 border-gray-200";
  }
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>(mockActivities);

  // Simulate new activity every 30-60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newActivity = mockActivities[Math.floor(Math.random() * mockActivities.length)];
        const activityWithNewTime = {
          ...newActivity,
          id: Date.now().toString(),
          time: "Just now"
        };
        setActivities(prev => [activityWithNewTime, ...prev.slice(0, 9)]);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Live Activity Feed
          <Badge variant="secondary" className="ml-auto text-xs">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`p-3 rounded-lg border ${getActivityColor(activity.type)} transition-all hover:shadow-md`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">{activity.user}</span>{" "}
                      {activity.action}
                    </p>
                    {activity.domain && (
                      <p className="text-sm font-semibold text-indigo-600 truncate">
                        {activity.domain}
                      </p>
                    )}
                    {activity.value && (
                      <p className="text-xs text-green-600 font-medium">
                        Est. value: {activity.value}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
