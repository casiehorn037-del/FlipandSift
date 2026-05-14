import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, FileText, CheckCircle2, AlertCircle, Globe } from "lucide-react";
import { toast } from "sonner";

interface ParsedDomain {
  domainName: string;
  trustFlow?: number;
  citationFlow?: number;
  szScore?: number;
  age?: number;
  price?: string;
}

interface TextDomainInputProps {
  onDomainsParsed: (domains: ParsedDomain[]) => void;
  isAnalyzing: boolean;
}

const SAMPLE_INPUT = `example.com
mydomain.net 23 34 45
site.org TF:30 CF:25 Age:5

crypto-wallet.com 45 56 78 $500
health-blog.net 12 15 20
ai-tools.io 67 78 89`;

export function TextDomainInput({ onDomainsParsed, isAnalyzing }: TextDomainInputProps) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ParsedDomain[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseDomains = async (inputText: string) => {
    setIsParsing(true);
    setError(null);

    try {
      // Simple regex-based parsing (works without AI)
      const lines = inputText.split('\n').filter(line => line.trim());
      const parsed: ParsedDomain[] = [];

      for (const line of lines) {
        // Extract domain
        const domainMatch = line.match(/\b([a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-z]{2,})\b/i);
        
        if (domainMatch) {
          const domain: ParsedDomain = {
            domainName: domainMatch[1].toLowerCase(),
          };

          // Try to extract numbers (TF, CF, Score)
          const numbers = line.match(/\b(\d{1,3})\b/g);
          if (numbers) {
            const nums = numbers.map(n => parseInt(n));
            if (nums.length >= 2) {
              domain.trustFlow = nums[0];
              domain.citationFlow = nums[1];
            }
            if (nums.length >= 3) {
              domain.szScore = nums[2];
            }
          }

          // Extract age
          const ageMatch = line.match(/age[:\s]*(\d{1,3})/i) || line.match(/(\d{1,3})\s*(?:years?|yrs?)/i);
          if (ageMatch) {
            domain.age = parseInt(ageMatch[1]);
          }

          // Extract price
          const priceMatch = line.match(/\$([\d,]+\.?\d*)/);
          if (priceMatch) {
            domain.price = '$' + priceMatch[1];
          }

          parsed.push(domain);
        }
      }

      setPreview(parsed);
      
      if (parsed.length === 0) {
        setError("No valid domains found. Please check your input format.");
      } else {
        toast.success(`Found ${parsed.length} domains`);
      }
    } catch (err) {
      setError("Failed to parse domains. Please try again.");
      console.error(err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleAnalyze = () => {
    if (preview.length === 0) {
      toast.error("Please parse domains first");
      return;
    }
    onDomainsParsed(preview);
  };

  const loadSample = () => {
    setText(SAMPLE_INPUT);
    parseDomains(SAMPLE_INPUT);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Enter Domains Manually
          <Badge variant="secondary" className="ml-auto">No OCR Needed</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Paste domain list (one per line)
            </label>
            <Button variant="ghost" size="sm" onClick={loadSample}>
              Load Sample
            </Button>
          </div>
          
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`example.com
crypto-wallet.net 45 56 78
site.org TF:30 CF:25`}
            className="min-h-[200px] font-mono text-sm"
          />
          
          <p className="text-xs text-gray-500">
            Format: domain.com [TrustFlow] [CitationFlow] [SZScore] [Age] [Price]
            <br />
            Example: mysite.com 23 34 45 5y $100
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => parseDomains(text)}
            disabled={!text.trim() || isParsing}
            variant="outline"
            className="flex-1"
          >
            {isParsing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Parsing...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 mr-2" />
                Preview Domains
              </>
            )}
          </Button>
          
          <Button
            onClick={handleAnalyze}
            disabled={preview.length === 0 || isAnalyzing}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Analyze {preview.length} Domains
              </>
            )}
          </Button>
        </div>

        {preview.length > 0 && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium mb-2">Preview ({preview.length} domains):</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {preview.slice(0, 10).map((domain, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span className="font-medium">{domain.domainName}</span>
                  {domain.trustFlow && (
                    <Badge variant="outline" className="text-xs">
                      TF: {domain.trustFlow}
                    </Badge>
                  )}
                  {domain.citationFlow && (
                    <Badge variant="outline" className="text-xs">
                      CF: {domain.citationFlow}
                    </Badge>
                  )}
                </div>
              ))}
              {preview.length > 10 && (
                <p className="text-sm text-gray-500">
                  ...and {preview.length - 10} more
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
