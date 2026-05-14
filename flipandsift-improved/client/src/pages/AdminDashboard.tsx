import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Users, 
  Globe, 
  DollarSign, 
  Activity,
  Plus,
  Loader2,
  TrendingUp,
  BarChart3
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [newDomain, setNewDomain] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Fetch admin stats
  const { data: stats, isLoading } = trpc.discovery.getStats.useQuery();
  
  // Seed domains mutation
  const seedMutation = trpc.discovery.seedDomains.useMutation({
    onSuccess: () => {
      toast.success("Domains seeded successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Add domain mutation
  const addDomainMutation = trpc.discovery.addDomain.useMutation({
    onSuccess: () => {
      toast.success("Domain added!");
      setNewDomain("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-600">Admin access required</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAddDomain = async () => {
    if (!newDomain) return;
    setIsAdding(true);
    
    // Parse domain and add default metrics
    await addDomainMutation.mutateAsync({
      domain: newDomain,
      tld: newDomain.split('.').pop() || 'com',
      status: 'available',
      niche: 'general',
      metrics: {
        trustFlow: 20,
        citationFlow: 18,
        referringDomains: 50,
        domainAge: 5,
      },
      estimatedValue: 500,
    });
    
    setIsAdding(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage domains, users, and platform settings
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isLoading ? "..." : "24"}</div>
              <p className="text-xs text-muted-foreground mt-1">+3 this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Domains</CardTitle>
              <Globe className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalDomains || "12"}</div>
              <p className="text-xs text-muted-foreground mt-1">+5 today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">$0</div>
              <p className="text-xs text-muted-foreground mt-1">Launch pending</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Today</CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">8</div>
              <p className="text-xs text-muted-foreground mt-1">Users online</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="domains" className="space-y-6">
          <TabsList>
            <TabsTrigger value="domains">Domains</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="domains" className="space-y-6">
            {/* Add Domain */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Domain</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="example.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleAddDomain}
                    disabled={isAdding || !newDomain}
                  >
                    {isAdding ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Add Domain
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => seedMutation.mutate()}
                    disabled={seedMutation.isPending}
                  >
                    {seedMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Seed All Curated Domains
                  </Button>
                  <Button variant="outline">
                    Import from CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Domain List */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Domains</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { domain: "wellnessvault.com", tf: 34, rd: 156, status: "available" },
                    { domain: "digitalmarketingpro.com", tf: 42, rd: 234, status: "available" },
                    { domain: "techreviewshub.com", tf: 38, rd: 189, status: "available" },
                  ].map((d) => (
                    <div key={d.domain} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{d.domain}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">TF: {d.tf}</Badge>
                          <Badge variant="outline">RD: {d.rd}</Badge>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700">{d.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { name: "John Doe", email: "john@example.com", plan: "pro", joined: "2 days ago" },
                    { name: "Jane Smith", email: "jane@example.com", plan: "free", joined: "5 days ago" },
                    { name: "Mike Johnson", email: "mike@example.com", plan: "agency", joined: "1 week ago" },
                  ].map((u) => (
                    <div key={u.email} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                      <div className="text-right">
                        <Badge className="mb-1">{u.plan}</Badge>
                        <p className="text-xs text-muted-foreground">{u.joined}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    User Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-end justify-between gap-2">
                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                      <div
                        key={i}
                        className="bg-primary/20 rounded-t"
                        style={{ height: `${h}%`, width: '100%' }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Top Niches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { niche: "Health", count: 45, percent: 35 },
                      { niche: "Finance", count: 32, percent: 25 },
                      { niche: "Tech", count: 28, percent: 22 },
                      { niche: "Marketing", count: 23, percent: 18 },
                    ].map((n) => (
                      <div key={n.niche}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{n.niche}</span>
                          <span>{n.count} domains</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${n.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Maintenance Mode</p>
                    <p className="text-sm text-muted-foreground">Disable access for all users</p>
                  </div>
                  <Button variant="outline">Enable</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">New Registrations</p>
                    <p className="text-sm text-muted-foreground">Allow new user signups</p>
                  </div>
                  <Button variant="outline">Disable</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">API Rate Limiting</p>
                    <p className="text-sm text-muted-foreground">Current: 100 req/min</p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
