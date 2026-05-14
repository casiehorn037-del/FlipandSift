/**
 * Working Domain Discovery Implementation
 * Uses available APIs and sources
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { getDb } from '../db.js';
import { domainFeed } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

export interface DiscoveredDomain {
  domain: string;
  tld: string;
  status: 'pending_delete' | 'auction' | 'available' | 'dropped';
  dropDate?: Date;
  auctionEndDate?: Date;
  currentPrice?: number;
  buyNowPrice?: number;
  source: string;
  sourceUrl?: string;
  metrics?: {
    trustFlow?: number;
    citationFlow?: number;
    referringDomains?: number;
    domainAge?: number;
    backlinks?: number;
  };
}

/**
 * Fetch from GoDaddy Auctions (if API key available)
 */
async function fetchGoDaddyAuctions(): Promise<DiscoveredDomain[]> {
  const apiKey = process.env.GODADDY_API_KEY;
  const apiSecret = process.env.GODADDY_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.log('[Discovery] GoDaddy API credentials not configured');
    return [];
  }

  try {
    const response = await axios.get('https://api.godaddy.com/v1/auctions', {
      headers: {
        'Authorization': `sso-key ${apiKey}:${apiSecret}`,
        'Accept': 'application/json',
      },
      timeout: 30000,
    });

    return response.data.map((auction: any) => ({
      domain: auction.domain,
      tld: auction.domain.split('.').pop() || 'com',
      status: 'auction' as const,
      auctionEndDate: auction.auctionEndTime ? new Date(auction.auctionEndTime) : undefined,
      currentPrice: auction.currentPrice ? Math.round(auction.currentPrice / 10000) : undefined,
      buyNowPrice: auction.buyNowPrice ? Math.round(auction.buyNowPrice / 10000) : undefined,
      source: 'godaddy_auctions',
      sourceUrl: `https://www.godaddy.com/domainsearch/find?domainToCheck=${encodeURIComponent(auction.domain)}`,
    }));
  } catch (error: any) {
    console.error('[Discovery] GoDaddy API error:', error.message);
    return [];
  }
}

/**
 * Fetch from Namecheap Marketplace (if API available)
 */
async function fetchNamecheapDomains(): Promise<DiscoveredDomain[]> {
  // Namecheap requires API access for marketplace
  // Placeholder for when credentials are available
  return [];
}

/**
 * Fetch from Sedo (if API available)
 */
async function fetchSedoDomains(): Promise<DiscoveredDomain[]> {
  // Sedo has API for partners
  // Placeholder for when credentials are available
  return [];
}

/**
 * Fetch from free sources (with rate limiting and respect for ToS)
 */
async function fetchFreeSources(): Promise<DiscoveredDomain[]> {
  const domains: DiscoveredDomain[] = [];

  // NOTE: These are educational examples. Always check robots.txt and ToS
  // before scraping any website.

  // Source 1: ExpiredDomains.net (check their API/terms first)
  try {
    const response = await axios.get('https://www.expireddomains.net/deleted-domains/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    
    $('table.base1 tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 4) {
        const domain = cells.eq(0).text().trim();
        const bl = parseInt(cells.eq(1).text().trim()) || 0;
        const dp = parseInt(cells.eq(2).text().trim()) || 0;
        const ab = cells.eq(3).text().trim();
        
        if (domain && domain.includes('.')) {
          domains.push({
            domain,
            tld: domain.split('.').pop() || 'com',
            status: 'dropped',
            source: 'expireddomains.net',
            sourceUrl: `https://www.expireddomains.net/domain/${domain}`,
            metrics: {
              referringDomains: bl || undefined,
            },
          });
        }
      }
    });

    console.log(`[Discovery] ExpiredDomains.net: ${domains.length} domains`);
  } catch (error: any) {
    console.error('[Discovery] ExpiredDomains error:', error.message);
  }

  return domains;
}

/**
 * Generate sample/demo domains for testing
 * Remove this in production
 */
function generateDemoDomains(): DiscoveredDomain[] {
  const niches = ['health', 'tech', 'finance', 'marketing', 'education'];
  const tlds = ['com', 'net', 'org', 'io', 'co'];
  
  const domains: DiscoveredDomain[] = [
    {
      domain: 'wellnessvault.com',
      tld: 'com',
      status: 'dropped',
      source: 'demo',
      metrics: { trustFlow: 34, citationFlow: 28, referringDomains: 156, domainAge: 8 },
    },
    {
      domain: 'cryptoinsights.net',
      tld: 'net',
      status: 'auction',
      currentPrice: 4500,
      source: 'demo',
      metrics: { trustFlow: 28, citationFlow: 22, referringDomains: 89, domainAge: 5 },
    },
    {
      domain: 'aistartup.io',
      tld: 'io',
      status: 'available',
      source: 'demo',
      metrics: { trustFlow: 15, citationFlow: 18, referringDomains: 45, domainAge: 3 },
    },
    {
      domain: 'digitalmarketingpro.com',
      tld: 'com',
      status: 'dropped',
      source: 'demo',
      metrics: { trustFlow: 42, citationFlow: 35, referringDomains: 234, domainAge: 12 },
    },
    {
      domain: 'fitnessguide.co',
      tld: 'co',
      status: 'auction',
      currentPrice: 1200,
      source: 'demo',
      metrics: { trustFlow: 31, citationFlow: 26, referringDomains: 112, domainAge: 6 },
    },
  ];

  // Generate more random domains
  for (let i = 0; i < 20; i++) {
    const niche = niches[Math.floor(Math.random() * niches.length)];
    const tld = tlds[Math.floor(Math.random() * tlds.length)];
    const name = `${niche}${Math.floor(Math.random() * 1000)}`;
    
    domains.push({
      domain: `${name}.${tld}`,
      tld,
      status: Math.random() > 0.5 ? 'dropped' : 'available',
      source: 'demo',
      metrics: {
        trustFlow: Math.floor(Math.random() * 40) + 10,
        citationFlow: Math.floor(Math.random() * 35) + 15,
        referringDomains: Math.floor(Math.random() * 200) + 20,
        domainAge: Math.floor(Math.random() * 15) + 2,
      },
    });
  }

  return domains;
}

/**
 * Main discovery function
 */
export async function discoverDomains(): Promise<DiscoveredDomain[]> {
  console.log('[Discovery] Starting domain discovery...');

  const allDomains: DiscoveredDomain[] = [];

  // Try API sources first
  const [godaddyDomains, namecheapDomains, sedoDomains] = await Promise.all([
    fetchGoDaddyAuctions(),
    fetchNamecheapDomains(),
    fetchSedoDomains(),
  ]);

  allDomains.push(...godaddyDomains, ...namecheapDomains, ...sedoDomains);

  // Try free sources
  const freeDomains = await fetchFreeSources();
  allDomains.push(...freeDomains);

  // If no real data, use demo data (for testing)
  if (allDomains.length === 0) {
    console.log('[Discovery] No real data sources available, using demo data');
    const demoDomains = generateDemoDomains();
    allDomains.push(...demoDomains);
  }

  // Remove duplicates
  const uniqueDomains = new Map<string, DiscoveredDomain>();
  allDomains.forEach(domain => {
    const existing = uniqueDomains.get(domain.domain);
    if (!existing) {
      uniqueDomains.set(domain.domain, domain);
    }
  });

  const result = Array.from(uniqueDomains.values());
  console.log(`[Discovery] Total unique domains: ${result.length}`);

  return result;
}

/**
 * Store discovered domains in database
 */
export async function storeDiscoveredDomains(domains: DiscoveredDomain[]): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  let added = 0;
  let updated = 0;

  for (const domain of domains) {
    try {
      // Check if domain already exists
      const existing = await db
        .select()
        .from(domainFeed)
        .where(eq(domainFeed.domain, domain.domain))
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(domainFeed)
          .set({
            status: domain.status,
            currentPrice: domain.currentPrice,
            buyNowPrice: domain.buyNowPrice,
            metrics: domain.metrics ? JSON.stringify(domain.metrics) : null,
            updatedAt: new Date(),
          })
          .where(eq(domainFeed.domain, domain.domain));
        updated++;
      } else {
        // Insert new
        await db.insert(domainFeed).values({
          domain: domain.domain,
          tld: domain.tld,
          status: domain.status,
          dropDate: domain.dropDate,
          auctionEndDate: domain.auctionEndDate,
          currentPrice: domain.currentPrice,
          buyNowPrice: domain.buyNowPrice,
          source: domain.source,
          sourceUrl: domain.sourceUrl,
          metrics: domain.metrics ? JSON.stringify(domain.metrics) : null,
          discoveredAt: new Date(),
          updatedAt: new Date(),
        });
        added++;
      }
    } catch (error) {
      console.error(`[Discovery] Failed to store ${domain.domain}:`, error);
    }
  }

  console.log(`[Discovery] Stored: ${added} new, ${updated} updated`);
}

/**
 * Daily sync job
 */
export async function dailyDomainSync(): Promise<{
  discovered: number;
  stored: number;
  errors: number;
}> {
  console.log('[Discovery] Starting daily sync...');

  const stats = {
    discovered: 0,
    stored: 0,
    errors: 0,
  };

  try {
    const domains = await discoverDomains();
    stats.discovered = domains.length;

    await storeDiscoveredDomains(domains);
    stats.stored = domains.length;

    console.log('[Discovery] Daily sync complete');
  } catch (error) {
    console.error('[Discovery] Daily sync failed:', error);
    stats.errors++;
  }

  return stats;
}
