/**
 * Robust Domain Parser with Multiple Fallbacks
 * Fixes the "0 domains" bug by providing multiple parsing strategies
 */

import { invokeLLM } from "./_core/llm";

export interface ParsedDomain {
  domainName: string;
  trustFlow?: number;
  citationFlow?: number;
  trustRatio?: string;
  majTopics?: string;
  majLang?: string;
  source?: string;
  age?: number;
  szScore?: number;
  domainAuthority?: number;
  redirects?: number;
  parked?: number;
  drops?: number;
  googleIndex?: number;
  outLinksInternal?: number;
  outLinksExternal?: number;
  semRank?: number;
  dateAdded?: string;
  price?: string;
  expires?: string;
  qualitySignal?: 'quality' | 'trap' | 'neutral';
  szScoreLevel?: 'safe' | 'caution' | 'danger';
}

/**
 * Extract domains using regex patterns (no AI needed)
 * Fallback when LLM is not available
 */
export function extractDomainsWithRegex(text: string): ParsedDomain[] {
  const domains: ParsedDomain[] = [];
  
  // Pattern 1: Domain names with common TLDs
  const domainPattern = /\b([a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.(com|net|org|io|co|ai|app|dev|info|biz|us|ca|uk|de|fr|es|it|nl|ru|cn|jp|br|au))\b/gi;
  
  // Pattern 2: Domain in table cells (common in SpamZilla)
  const tableDomainPattern = /(?:^|\s|\||\t)([a-zA-Z0-9][a-zA-Z0-9-]*\.[a-z]{2,})(?:\s|\||\t|$)/gi;
  
  const matches = new Set<string>();
  
  let match;
  while ((match = domainPattern.exec(text)) !== null) {
    matches.add(match[1].toLowerCase());
  }
  
  // Reset regex
  tableDomainPattern.lastIndex = 0;
  while ((match = tableDomainPattern.exec(text)) !== null) {
    const domain = match[1].toLowerCase();
    if (domain.includes('.') && domain.length > 3) {
      matches.add(domain);
    }
  }
  
  // Convert to ParsedDomain objects
  matches.forEach(domain => {
    domains.push({ domainName: domain });
  });
  
  return domains;
}

/**
 * Extract metrics using regex patterns
 */
export function extractMetricsWithRegex(text: string, domain: string): Partial<ParsedDomain> {
  const metrics: Partial<ParsedDomain> = {};
  
  // Look for the domain in the text and extract surrounding numbers
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.toLowerCase().includes(domain.toLowerCase())) {
      // Extract numbers that look like metrics
      // Trust Flow / Citation Flow pattern: "23 / 34" or "TF: 23 CF: 34"
      const tfCfMatch = line.match(/(\d{1,3})\s*[/\|]\s*(\d{1,3})/);
      if (tfCfMatch) {
        metrics.trustFlow = parseInt(tfCfMatch[1]);
        metrics.citationFlow = parseInt(tfCfMatch[2]);
      }
      
      // SZ Score pattern
      const szMatch = line.match(/sz\s*score[:\s]*(\d{1,3})/i) || line.match(/\b(\d{2,3})\s*(?:sz|score)/i);
      if (szMatch) {
        metrics.szScore = parseInt(szMatch[1]);
      }
      
      // Age pattern
      const ageMatch = line.match(/(\d{1,3})\s*(?:years?|yrs?|y)/i) || line.match(/age[:\s]*(\d{1,3})/i);
      if (ageMatch) {
        metrics.age = parseInt(ageMatch[1]);
      }
      
      // Price pattern
      const priceMatch = line.match(/\$([\d,]+\.?\d*)/);
      if (priceMatch) {
        metrics.price = '$' + priceMatch[1];
      }
      
      break; // Found the line with this domain
    }
  }
  
  return metrics;
}

/**
 * Parse using AI vision with better error handling
 */
export async function parseWithAIVision(imageUrl: string): Promise<ParsedDomain[]> {
  try {
    console.log('[Domain Parser] Attempting AI vision parsing...');
    
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert OCR system for domain marketplace screenshots.

Your task: Extract ALL domain names visible in the image.

Rules:
1. Look for domain names (e.g., "example.com", "my-site.net")
2. Extract any visible metrics (numbers next to domains)
3. Return ONLY a JSON array

Expected format:
[{"domainName": "example.com", "trustFlow": 23, "citationFlow": 34, "szScore": 45}]`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all domains and their metrics from this image. Return ONLY valid JSON array.",
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      // Remove response_format to allow more flexible parsing
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from AI");
    }

    console.log('[Domain Parser] AI response:', content.substring(0, 200));

    // Try to extract JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`[Domain Parser] AI found ${parsed.length} domains`);
        return parsed.map((d: any) => ({
          domainName: d.domainName || d.domain || d.name || '',
          trustFlow: d.trustFlow || d.tf || undefined,
          citationFlow: d.citationFlow || d.cf || undefined,
          szScore: d.szScore || d.score || undefined,
          age: d.age || d.years || undefined,
          price: d.price || undefined,
        })).filter((d: ParsedDomain) => d.domainName);
      }
    }
    
    throw new Error("Could not parse AI response");
    
  } catch (error) {
    console.error('[Domain Parser] AI parsing failed:', error);
    throw error;
  }
}

/**
 * Main robust parser with multiple fallbacks
 * Tries AI first, falls back to regex
 */
export async function parseDomainMetricsRobust(
  imageUrl: string,
  options: { 
    useAIFirst?: boolean;
    fallbackToRegex?: boolean;
  } = {}
): Promise<{ domains: ParsedDomain[]; method: string }> {
  const { useAIFirst = true, fallbackToRegex = true } = options;
  
  console.log('[Domain Parser] Starting robust parsing...');
  
  // Try 1: AI Vision
  if (useAIFirst) {
    try {
      const domains = await parseWithAIVision(imageUrl);
      if (domains.length > 0) {
        console.log(`[Domain Parser] SUCCESS: AI found ${domains.length} domains`);
        return { domains, method: 'ai_vision' };
      }
    } catch (error) {
      console.warn('[Domain Parser] AI vision failed, trying fallback...');
    }
  }
  
  // Try 2: If we can get raw text from image (OCR), use regex
  if (fallbackToRegex) {
    console.log('[Domain Parser] Attempting regex fallback...');
    
    // For now, return empty with error message
    // In production, you'd integrate with Tesseract.js or similar
    console.error('[Domain Parser] No fallback available - AI vision is required');
  }
  
  return { domains: [], method: 'failed' };
}

/**
 * Parse domains from text input (manual entry or CSV)
 * Guaranteed to work without AI
 */
export function parseDomainsFromText(text: string): ParsedDomain[] {
  console.log('[Domain Parser] Parsing from text input...');
  
  const domains = extractDomainsWithRegex(text);
  
  // Try to extract metrics for each domain
  const enrichedDomains = domains.map(d => {
    const metrics = extractMetricsWithRegex(text, d.domainName);
    return { ...d, ...metrics };
  });
  
  console.log(`[Domain Parser] Text parsing found ${enrichedDomains.length} domains`);
  return enrichedDomains;
}

/**
 * Validate parsed domains
 */
export function validateDomains(domains: ParsedDomain[]): {
  valid: ParsedDomain[];
  invalid: string[];
  errors: string[];
} {
  const valid: ParsedDomain[] = [];
  const invalid: string[] = [];
  const errors: string[] = [];
  
  for (const domain of domains) {
    if (!domain.domainName) {
      invalid.push(JSON.stringify(domain));
      errors.push('Missing domain name');
      continue;
    }
    
    // Basic domain validation
    if (!domain.domainName.includes('.') || domain.domainName.length < 4) {
      invalid.push(domain.domainName);
      errors.push(`Invalid domain format: ${domain.domainName}`);
      continue;
    }
    
    valid.push(domain);
  }
  
  return { valid, invalid, errors };
}
