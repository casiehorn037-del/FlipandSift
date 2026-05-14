import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  Globe, 
  Target, 
  Users, 
  Lightbulb,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";

interface ProjectFormData {
  name: string;
  niche: string;
  keywords: string;
  audience: string;
  description: string;
  goals: string;
  tlds: string[];
  style: string;
  competitorUrl: string;
}

interface ProjectCreationFormProps {
  onSubmit: (data: ProjectFormData) => void;
  isLoading?: boolean;
}

const NICHES = [
  { value: "health-fitness", label: "Health & Fitness" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "ai-tech", label: "AI Comfort & Safety" },
  { value: "productivity", label: "The Prompt Economy" },
  { value: "saas", label: "SaaS Infrastructure" },
  { value: "finance", label: "Finance & Crypto" },
  { value: "education", label: "Education" },
  { value: "food", label: "Food & Recipes" },
  { value: "travel", label: "Travel" },
  { value: "fashion", label: "Fashion" },
  { value: "gaming", label: "Gaming" },
  { value: "lifestyle", label: "Lifestyle" },
];

const DOMAIN_STYLES = [
  { value: "brandable", label: "Brandable (e.g., Google, Spotify)" },
  { value: "keyword", label: "Keyword-rich (e.g., BestFitnessTips.com)" },
  { value: "short", label: "Short & Memorable (e.g., AI.io)" },
  { value: "authoritative", label: "Authoritative (e.g., HealthAuthority.org)" },
  { value: "trendy", label: "Trendy/Modern (e.g., CryptoVault.xyz)" },
];

const TLDS = [
  { value: ".com", label: ".com", default: true },
  { value: ".net", label: ".net" },
  { value: ".io", label: ".io" },
  { value: ".ai", label: ".ai" },
  { value: ".co", label: ".co" },
  { value: ".org", label: ".org" },
  { value: ".app", label: ".app" },
  { value: ".dev", label: ".dev" },
];

export function ProjectCreationForm({ onSubmit, isLoading }: ProjectCreationFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    niche: "",
    keywords: "",
    audience: "",
    description: "",
    goals: "",
    tlds: [".com"],
    style: "",
    competitorUrl: "",
  });

  const updateField = (field: keyof ProjectFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTld = (tld: string) => {
    setFormData(prev => ({
      ...prev,
      tlds: prev.tlds.includes(tld)
        ? prev.tlds.filter(t => t !== tld)
        : [...prev.tlds, tld]
    }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.niche) {
      toast.error("Please fill in required fields");
      return;
    }
    onSubmit(formData);
  };

  const isStep1Valid = formData.name && formData.niche;
  const isStep2Valid = formData.keywords && formData.audience;
  const isStep3Valid = formData.tlds.length > 0 && formData.style;

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-600" />
          Create New Project
        </CardTitle>
        <CardDescription>
          Tell us about your website idea so we can suggest the perfect expired domain
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-600"
              }`}>
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-1 ${step > s ? "bg-indigo-600" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Project Name *
              </Label>
              <Input
                id="name"
                placeholder="My Awesome Website"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="niche" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Niche/Industry *
              </Label>
              <Select value={formData.niche} onValueChange={(v) => updateField("niche", v)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="e.g., Health & Fitness" />
                </SelectTrigger>
                <SelectContent>
                  {NICHES.map((niche) => (
                    <SelectItem key={niche.value} value={niche.value}>
                      {niche.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords" className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Keywords (comma-separated)
              </Label>
              <Input
                id="keywords"
                placeholder="fitness, workout, nutrition"
                value={formData.keywords}
                onChange={(e) => updateField("keywords", e.target.value)}
                className="h-12"
              />
              <p className="text-xs text-gray-500">Enter relevant keywords separated by commas</p>
            </div>

            <Button 
              onClick={() => setStep(2)} 
              disabled={!isStep1Valid}
              className="w-full h-12"
            >
              Continue <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Audience & Goals */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="audience" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Target Audience
              </Label>
              <Textarea
                id="audience"
                placeholder="Describe your ideal audience..."
                value={formData.audience}
                onChange={(e) => updateField("audience", e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">What is your website about?</Label>
              <Textarea
                id="description"
                placeholder="Describe your website idea..."
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals">What do you want to achieve?</Label>
              <Textarea
                id="goals"
                placeholder="e.g., Build an authority site, generate affiliate revenue, establish thought leadership..."
                value={formData.goals}
                onChange={(e) => updateField("goals", e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12">
                Back
              </Button>
              <Button 
                onClick={() => setStep(3)} 
                disabled={!isStep2Valid}
                className="flex-1 h-12"
              >
                Continue <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Domain Preferences */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Preferred Domain Extensions (The Sniper Scope)
              </Label>
              <div className="flex flex-wrap gap-2">
                {TLDS.map((tld) => (
                  <Badge
                    key={tld.value}
                    variant={formData.tlds.includes(tld.value) ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2 text-sm"
                    onClick={() => toggleTld(tld.value)}
                  >
                    {tld.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Domain Name Style</Label>
              <Select value={formData.style} onValueChange={(v) => updateField("style", v)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Choose how you want your domain name to sound" />
                </SelectTrigger>
                <SelectContent>
                  {DOMAIN_STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="competitor">Competitor URL (Optional)</Label>
              <Input
                id="competitor"
                placeholder="https://competitor.com"
                value={formData.competitorUrl}
                onChange={(e) => updateField("competitorUrl", e.target.value)}
                className="h-12"
              />
              <p className="text-xs text-gray-500">We'll analyze their site for keyword ideas</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12">
                Back
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!isStep3Valid || isLoading}
                className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 w-4 h-4" />
                    Create Project
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
