import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Loader2, 
  Globe, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Star,
  ExternalLink,
  Bell,
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { toast } from "sonner";

interface DiscoveredDomain {
  id: string;
  domain: string;
  tld: string;
  status: 'pending_delete' | 'auction' | 'available' | 'dropped';
  dropDate?: string;
  auctionEndDate?: string;
  currentPrice?: number;
  buyNowPrice?: number;
  metrics?: {
    trustFlow?: number;
    citationFlow?: number;
    referringDomains?: number;
    domainAge?: number;
  };
  opportunityScore: number;
  niche?: string;
  source: string;
  discoveredAt: string;
}

// Domains will be fetched from API
const MOCK_DOMAINS: DiscoveredDomain[] = [
  {
    id: "1",
    domain: "wellnessvault.com",
    tld: "com",
    status: "pending_delete",
    dropDate: "2026-05-15T14:30:00Z",
    metrics: {
      trustFlow: 34,
      citationFlow: 28,
      referringDomains: 156,
      domainAge: 8,
    },
    opportunityScore: 85,
    niche: "health",
    source: "pending_delete_list",
    discoveredAt: "2026-05-14T07:00:00Z",
  },
  {
    id: "2",
    domain: "cryptoinsights.net",
    tld: "net",
    status: "auction",
    auctionEndDate: "2026-05-14T20:00:00Z",
    currentPrice: 4500,
    buyNowPrice: 8900,
    metrics: {
      trustFlow: 28,
      citationFlow: 22,
      referringDomains: 89,
      domainAge: 5,
    },
    opportunityScore: 72,
    niche: "finance",
    source: "godaddy_auctions",
    discoveredAt: "2026-05-14T06:30:00Z",
  },
  {
    id: "3",
    domain: "aistartup.io",
    tld: "io",
    status: "available",
    metrics: {
      trustFlow: 15,
      citationFlow: 18,
      referringDomains: 45,
      domainAge: 3,
    },
    opportunityScore: 68,
    niche: "tech",
    source: "registry",
    discoveredAt: "2026-05-14T06:00:00Z",
  },
  {
    id: "4",
    domain: "digitalmarketingpro.com",
    tld: "com",
    status: "dropped",
    metrics: {
      trustFlow: 42,
      citationFlow: 35,
      referringDomains: 234,
      domainAge: 12,
    },
    opportunityScore: 91,
    niche: "marketing",
    source: "expireddomains.net",
    discoveredAt: "2026-05-14T05:00:00Z",
  },
  {
    id: "5",
    domain: "fitnessguide.co",
    tld: "co",
    status: "auction",
    auctionEndDate: "2026-05-15T12:00:00Z",
    currentPrice: 1200,
    metrics: {
      trustFlow: 31,
      citationFlow: 26,
      referringDomains: 112,
      domainAge: 6,
    },
    opportunityScore: 78,
    niche: "health",
    source: "namejet",
    discoveredAt: "2026-05-14T04:30:00Z",
  },
  {
    id: "6",
    domain: "techreviewshub.com",
    tld: "com",
    status: "pending_delete",
    dropDate: "2026-05-16T10:00:00Z",
    metrics: {
      trustFlow: 38,
      citationFlow: 32,
      referringDomains: 189,
      domainAge: 9,
    },
    opportunityScore: 82,
    niche: "tech",
    source: "pending_delete_list",
    discoveredAt: "2026-05-14T04:00:00Z",
  },
  {
    id: "7",
    domain: "investmenttips.org",
    tld: "org",
    status: "available",
    metrics: {
      trustFlow: 22,
      citationFlow: 19,
      referringDomains: 67,
      domainAge: 7,
    },
    opportunityScore: 65,
    niche: "finance",
    source: "registry",
    discoveredAt: "2026-05-14T03:30:00Z",
  },
  {
    id: "8",
    domain: "organicrecipes.net",
    tld: "net",
    status: "auction",
    auctionEndDate: "2026-05-14T18:00:00Z",
    currentPrice: 850,
    buyNowPrice: 2500,
    metrics: {
      trustFlow: 29,
      citationFlow: 24,
      referringDomains: 98,
      domainAge: 8,
    },
    opportunityScore: 74,
    niche: "food",
    source: "dropcatch",
    discoveredAt: "2026-05-14T03:00:00Z",
  },
];

const NICHES = [
  { value: "all", label: "All Niches" },
  { value: "health", label: "Health & Wellness" },
  { value: "finance", label: "Finance & Crypto" },
  { value: "tech", label: "Technology" },
  { value: "marketing", label: "Marketing" },
  { value: "food", label: "Food & Recipes" },
  { value: "education", label: "Education" },
  { value: "sports", label: "Sports" },
];

const STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "pending_delete", label: "Dropping Soon" },
  { value: "auction", label: "In Auction" },
  { value: "available", label: "Available Now" },
  { value: "dropped", label: "Recently Dropped" },
];

export default function DomainDiscovery() {
  const { user } = useAuth();
  const [domains, setDomains] = useState<DiscoveredDomain[]>(MOCK_DOMAINS);
  const [filteredDomains, setFilteredDomains] = useState<DiscoveredDomain[]>(MOCK_DOMAINS);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [minTrustFlow, setMinTrustFlow] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortBy, setSortBy] = useState<"score" | "trustFlow" | "price" | "age">("score");
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  useEffect(() => {
    filterDomains();
  }, [searchQuery, selectedNiche, selectedStatus, minTrustFlow, maxPrice, sortBy, domains]);

  const filterDomains = () => {
    let filtered = [...domains];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(d => 
        d.domain.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Niche filter
    if (selectedNiche !== "all") {
      filtered = filtered.filter(d => d.niche === selectedNiche);
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter(d => d.status === selectedStatus);
    }

    // Trust Flow filter
    filtered = filtered.filter(d => 
      (d.metrics?.trustFlow || 0) >= minTrustFlow
    );

    // Price filter
    filtered = filtered.filter(d => {
      const price = d.currentPrice || d.buyNowPrice || 0;
      return price <= maxPrice;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "score":
          return b.opportunityScore - a.opportunityScore;
        case "trustFlow":
          return (b.metrics?.trustFlow || 0) - (a.metrics?.trustFlow || 0);
        case "price":
          return (a.currentPrice || 0) - (b.currentPrice || 0);
        case "age":
          return (b.metrics?.domainAge || 0) - (a.metrics?.domainAge || 0);
        default:
          return 0;
      }
    });

    setFilteredDomains(filtered);
  };

  const toggleWatchlist = (domainId: string) => {
    setWatchlist(prev => {
      const newSet = new Set(prev);
      if (newSet.has(domainId)) {
        newSet.delete(domainId);
        toast.success("Removed from watchlist");
      } else {
        newSet.add(domainId);
        toast.success("Added to watchlist");
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_delete":
        return <Badge className="bg-orange-100 text-orange-700">Dropping Soon</Badge>;
      case "auction":
        return <Badge className="bg-blue-100 text-blue-700">In Auction</Badge>;
      case "available":
        return <Badge className="bg-green-100 text-green-700">Available</Badge>;
      case "dropped":
        return <Badge className="bg-purple-100 text-purple-700">Recently Dropped</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-gray-600 bg-gray-50";
  };

  const formatPrice = (price?: number) => {
    if (!price) return "—";
    return `$${price.toLocaleString()}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getTimeRemaining = (dateString?: string) => {
    if (!dateString) return null;
    const target = new Date(dateString);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    
    if (diff <= 0) return "Ended";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navigation />
      
      <div className="container py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Available Expired Domains
          </h1>
          <p className="text-lg text-slate-600">
            Ready to register domains with backlinks and authority. Grab them before someone else does.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-indigo-600">{domains.length}</div>
              <p className="text-sm text-slate-600">Domains Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600">
                {domains.filter(d => d.opportunityScore >= 80).length}
              </div>
              <p className="text-sm text-slate-600">High Score (80+)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-orange-600">
                {domains.filter(d => d.status === "pending_delete").length}
              </div>
              <p className="text-sm text-slate-600">Dropping Soon</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600">
                {domains.filter(d => d.status === "auction").length}
              </div>
              <p className="text-sm text-slate-600">In Auction</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search domains..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Niche */}
              <Select value={selectedNiche} onValueChange={setSelectedNiche}>
                <SelectTrigger>
                  <SelectValue placeholder="Select niche" />
                </SelectTrigger>
                <SelectContent>
                  {NICHES.map(niche => (
                    <SelectItem key={niche.value} value={niche.value}>
                      {niche.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Opportunity Score</SelectItem>
                  <SelectItem value="trustFlow">Trust Flow</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="age">Domain Age</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Min Trust Flow: {minTrustFlow}
                </label>
                <Slider
                  value={[minTrustFlow]}
                  onValueChange={([v]) => setMinTrustFlow(v)}
                  max={50}
                  step={1}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Max Price: ${maxPrice.toLocaleString()}
                </label>
                <Slider
                  value={[maxPrice]}
                  onValueChange={([v]) => setMaxPrice(v)}
                  max={10000}
                  step={100}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-slate-600">
            Showing <strong>{filteredDomains.length}</strong> of {domains.length} domains
          </p>
          <Button variant="outline" onClick={() => {
            setSearchQuery("");
            setSelectedNiche("all");
            setSelectedStatus("all");
            setMinTrustFlow(0);
            setMaxPrice(10000);
          }}>
            Clear Filters
          </Button>
        </div>

        {/* Domain List */}
        <div className="space-y-4">
          {filteredDomains.map((domain) => (
            <Card key={domain.id} className="overflow-hidden">
              <div 
                className="p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedDomain(expandedDomain === domain.id ? null : domain.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Score Badge */}
                    <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${getScoreColor(domain.opportunityScore)}`}>
                      <div className="text-center">
                        <div className="text-xl font-bold">{domain.opportunityScore}</div>
                        <div className="text-xs">score</div>
                      </div>
                    </div>

                    {/* Domain Info */}
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        {domain.domain}
                        {domain.opportunityScore >= 80 && (
                          <Sparkles className="w-5 h-5 text-yellow-500" />
                        )}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(domain.status)}
                        {domain.niche && (
                          <Badge variant="outline">{domain.niche}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metrics Preview */}
                  <div className="hidden md:flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-lg font-semibold">{domain.metrics?.trustFlow || '—'}</div>
                      <div className="text-xs text-slate-500">Trust Flow</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{domain.metrics?.referringDomains || '—'}</div>
                      <div className="text-xs text-slate-500">Backlinks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{formatPrice(domain.currentPrice || domain.buyNowPrice)}</div>
                      <div className="text-xs text-slate-500">Price</div>
                    </div>
                    {domain.dropDate && (
                      <div className="text-center">
                        <div className="text-lg font-semibold text-orange-600">
                          {getTimeRemaining(domain.dropDate)}
                        </div>
                        <div className="text-xs text-slate-500">Time Left</div>
                      </div>
                    )}
                  </div>

                  {/* Expand Icon */}
                  {expandedDomain === domain.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedDomain === domain.id && (
                <div className="px-6 pb-6 border-t bg-slate-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-sm text-slate-500">Trust Flow</div>
                      <div className="text-lg font-semibold">{domain.metrics?.trustFlow || '—'}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-sm text-slate-500">Citation Flow</div>
                      <div className="text-lg font-semibold">{domain.metrics?.citationFlow || '—'}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-sm text-slate-500">Referring Domains</div>
                      <div className="text-lg font-semibold">{domain.metrics?.referringDomains || '—'}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-sm text-slate-500">Domain Age</div>
                      <div className="text-lg font-semibold">{domain.metrics?.domainAge ? `${domain.metrics.domainAge} years` : '—'}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button
                      variant={watchlist.has(domain.id) ? "default" : "outline"}
                      onClick={() => toggleWatchlist(domain.id)}
                    >
                      <Star className={`w-4 h-4 mr-2 ${watchlist.has(domain.id) ? "fill-current" : ""}`} />
                      {watchlist.has(domain.id) ? "In Watchlist" : "Add to Watchlist"}
                    </Button>
                    
                    <Button variant="outline" asChild>
                      <a 
                        href={`https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(domain.domain)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Check Namecheap
                      </a>
                    </Button>
                    
                    <Button variant="outline" asChild>
                      <a 
                        href={`https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=${encodeURIComponent(domain.domain)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Check GoDaddy
                      </a>
                    </Button>

                    {domain.status === "auction" && (
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Place Bid
                      </Button>
                    )}

                    {domain.status === "pending_delete" && (
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        <Bell className="w-4 h-4 mr-2" />
                        Set Backorder Alert
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {filteredDomains.length === 0 && (
          <div className="text-center py-12">
            <Globe className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No domains found</h3>
            <p className="text-slate-600">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </div>
    </div>
  );
}
