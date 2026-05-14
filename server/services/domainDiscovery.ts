/**
 * Domain Discovery Engine
 * Replaces SpamZilla dependency with direct domain feeds
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { getDb } from '../db.js';
import { domainFeed } from '../../drizzle/schema.js';
import { eq, and, gt, lt, desc } from 'drizzle-orm';

export interface DiscoveredDomain {
  domain: string;
  tld: string;
  status: 'pending_delete' | 'auction' | 'available' | 'dropped';
  dropDate?: Date;
  auctionEndDate?: Date;
  currentPrice?: number;
  buyNowPrice?: number;
  source: string;
  metrics?: {
    trustFlow?: number;
    citationFlow?: number;
    referringDomains?: number;
    domainAge?: number;
    archiveOrgSnapshots?: number;
  };
  discoveredAt: Date;
}

/**
 * Fetch pending delete domains from registry feeds
 * Uses multiple sources for comprehensive coverage
 */
export async function fetchPendingDeleteDomains(): Promise<DiscoveredDomain[]> {
  const domains: DiscoveredDomain[] = [];

  // Source 1: Pending Delete Lists (public feeds)
  try {
    const pendingDeleteList = await fetchPendingDeleteList();
    domains.push(...pendingDeleteList);
  } catch (error) {
    console.error('Failed to fetch pending delete list:', error);
  }

  // Source 2: GoDaddy Auctions (if API available)
  try {
    const godaddyAuctions = await fetchGoDaddyAuctions();
    domains.push(...godaddyAuctions);
  } catch (error) {
    console.error('Failed to fetch GoDaddy auctions:', error);
  }

  // Source 3: NameJet Pre-Release
  try {
    const nameJetDomains = await fetchNameJetDomains();
    domains.push(...nameJetDomains);
  } catch (error) {
    console.error('Failed to fetch NameJet domains:', error);
  }

  // Source 4: DropCatch Pending
  try {
    const dropCatchDomains = await fetchDropCatchDomains();
    domains.push(...dropCatchDomains);
  } catch (error) {
    console.error('Failed to fetch DropCatch domains:', error);
  }

  return domains;
}

/**
 * Fetch from public pending delete lists
 * Scrapes or fetches from known sources
 */
async function fetchPendingDeleteList(): Promise<DiscoveredDomain[]> {
  const domains: DiscoveredDomain[] = [];

  // Example: Fetch from expireddomains.net (public list)
  try {
    const response = await axios.get('https://www.expireddomains.net/deleted-domains/', {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FlipAndSift/1.0)'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Parse domain list from table
    $('table.base1 tbody tr').each((_, row) => {
      const domainCell = $(row).find('td').first();
      const domain = domainCell.text().trim();
      
      if (domain && domain.includes('.')) {
        const tld = domain.split('.').pop() || 'com';
        
        domains.push({
          domain,
          tld,
          status: 'dropped',
          source: 'expireddomains.net',
          discoveredAt: new Date(),
        });
      }
    });
  } catch (error) {
    console.warn('Failed to fetch from expireddomains.net:', error);
  }

  return domains;
}

/**
 * Fetch GoDaddy Auctions (requires API key)
 */
async function fetchGoDaddyAuctions(): Promise<DiscoveredDomain[]> {
  const apiKey = process.env.GODADDY_API_KEY;
  const apiSecret = process.env.GODADDY_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.log('GoDaddy API credentials not configured, skipping');
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
      status: 'auction',
      auctionEndDate: new Date(auction.auctionEndTime),
      currentPrice: auction.currentPrice,
      buyNowPrice: auction.buyNowPrice,
      source: 'godaddy_auctions',
      discoveredAt: new Date(),
    }));
  } catch (error) {
    console.error('GoDaddy auctions fetch failed:', error);
    return [];
  }
}

/**
 * Fetch NameJet pre-release domains
 */
async function fetchNameJetDomains(): Promise<DiscoveredDomain[]> {
  // NameJet requires partnership agreement for API access
  // This is a placeholder for when credentials are available
  console.log('NameJet integration requires partnership agreement');
  return [];
}

/**
 * Fetch DropCatch pending domains
 */
async function fetchDropCatchDomains(): Promise<DiscoveredDomain[]> {
  // DropCatch API requires account
  // This is a placeholder for when credentials are available
  console.log('DropCatch integration requires API credentials');
  return [];
}

/**
 * Enrich domain with SEO metrics
 * Uses Majestic, Ahrefs, or other APIs
 */
export async function enrichDomainMetrics(domain: string): Promise<DiscoveredDomain['metrics']> {
  const metrics: DiscoveredDomain['metrics'] = {};

  // Try Majestic API
  try {
    const majesticData = await fetchMajesticMetrics(domain);
    metrics.trustFlow = majesticData.trustFlow;
    metrics.citationFlow = majesticData.citationFlow;
    metrics.referringDomains = majesticData.referringDomains;
  } catch (error) {
    console.warn(`Failed to fetch Majestic metrics for ${domain}:`, error);
  }

  // Try Archive.org for age
  try {
    const archiveData = await fetchArchiveOrgData(domain);
    metrics.domainAge = archiveData.age;
    metrics.archiveOrgSnapshots = archiveData.snapshots;
  } catch (error) {
    console.warn(`Failed to fetch Archive.org data for ${domain}:`, error);
  }

  return metrics;
}

/**
 * Fetch Majestic SEO metrics
 */
async function fetchMajesticMetrics(domain: string): Promise<{
  trustFlow: number;
  citationFlow: number;
  referringDomains: number;
}> {
  const apiKey = process.env.MAJESTIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('Majestic API key not configured');
  }

  const response = await axios.get('https://api.majestic.com/api/json', {
    params: {
      app_api_key: apiKey,
      cmd: 'GetIndexItemInfo',
      items: 1,
      item0: domain,
      datasource: 'fresh',
    },
    timeout: 30000,
  });

  const data = response.data.DataTables.Results.Data[0];
  
  return {
    trustFlow: parseInt(data.TrustFlow) || 0,
    citationFlow: parseInt(data.CitationFlow) || 0,
    referringDomains: parseInt(data.RefDomains) || 0,
  };
}

/**
 * Fetch Archive.org data for domain age
 */
async function fetchArchiveOrgData(domain: string): Promise<{
  age: number;
  snapshots: number;
}> {
  const response = await axios.get(`https://web.archive.org/cdx/search/cdx`, {
    params: {
      url: domain,
      output: 'json',
      collapse: 'timestamp:4', // One per year
    },
    timeout: 30000,
  });

  const data = response.data;
  const snapshots = data.length - 1; // First row is headers
  
  // Calculate age from first snapshot
  let age = 0;
  if (data.length > 1) {
    const firstSnapshot = data[1][1]; // timestamp
    const firstYear = parseInt(firstSnapshot.substring(0, 4));
    age = new Date().getFullYear() - firstYear;
  }

  return { age, snapshots };
}

/**
 * Calculate opportunity score for a domain
 * Similar to SpamZilla's SZ Score but our own algorithm
 */
export function calculateOpportunityScore(
  domain: DiscoveredDomain,
  niche?: string
): number {
  const metrics = domain.metrics;
  if (!metrics) return 0;

  // Base score from metrics
  let score = 0;
  
  // Trust Flow (0-40 points)
  score += Math.min((metrics.trustFlow || 0) * 1.5, 40);
  
  // Citation Flow (0-20 points)
  score += Math.min((metrics.citationFlow || 0) * 0.5, 20);
  
  // Referring Domains (0-25 points)
  score += Math.min((metrics.referringDomains || 0) * 0.1, 25);
  
  // Domain Age (0-15 points)
  score += Math.min((metrics.domainAge || 0) * 1.5, 15);
  
  // Price adjustment (lower price = higher score)
  if (domain.currentPrice && domain.currentPrice > 0) {
    const priceFactor = Math.max(0, 1 - (domain.currentPrice / 1000));
    score *= (0.5 + 0.5 * priceFactor);
  }

  return Math.round(score);
}

/**
 * Store discovered domains in database
 */
export async function storeDiscoveredDomains(domains: DiscoveredDomain[]): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

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
            metrics: domain.metrics ? JSON.stringify(domain.metrics) : null,
            updatedAt: new Date(),
          })
          .where(eq(domainFeed.domain, domain.domain));
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
          metrics: domain.metrics ? JSON.stringify(domain.metrics) : null,
          discoveredAt: domain.discoveredAt,
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error(`Failed to store domain ${domain.domain}:`, error);
    }
  }
}

/**
 * Get filtered domain feed for display
 */
export async function getDomainFeed(filters: {
  status?: string;
  minTrustFlow?: number;
  maxPrice?: number;
  niche?: string;
  tld?: string;
  limit?: number;
}): Promise<DiscoveredDomain[]> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  let query = db.select().from(domainFeed);

  // Apply filters
  if (filters.status) {
    query = query.where(eq(domainFeed.status, filters.status));
  }

  if (filters.tld) {
    query = query.where(eq(domainFeed.tld, filters.tld));
  }

  if (filters.maxPrice) {
    query = query.where(
      and(
        lt(domainFeed.currentPrice, filters.maxPrice),
        gt(domainFeed.currentPrice, 0)
      )
    );
  }

  // Order by discovered date (newest first)
  query = query.orderBy(desc(domainFeed.discoveredAt));

  // Limit results
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const results = await query;

  return results.map(row => ({
    domain: row.domain,
    tld: row.tld,
    status: row.status as DiscoveredDomain['status'],
    dropDate: row.dropDate,
    auctionEndDate: row.auctionEndDate,
    currentPrice: row.currentPrice,
    buyNowPrice: row.buyNowPrice,
    source: row.source,
    metrics: row.metrics ? JSON.parse(row.metrics) : undefined,
    discoveredAt: row.discoveredAt,
  }));
}

/**
 * Daily sync job - fetch and store new domains
 * Should be run via cron job
 */
export async function dailyDomainSync(): Promise<{
  discovered: number;
  enriched: number;
  errors: number;
}> {
  console.log('Starting daily domain sync...');
  
  const stats = {
    discovered: 0,
    enriched: 0,
    errors: 0,
  };

  try {
    // Fetch new domains
    const domains = await fetchPendingDeleteDomains();
    stats.discovered = domains.length;
    console.log(`Discovered ${domains.length} domains`);

    // Enrich top domains with metrics (limit to avoid API costs)
    const topDomains = domains.slice(0, 50); // Top 50 by estimated value
    
    for (const domain of topDomains) {
      try {
        const metrics = await enrichDomainMetrics(domain.domain);
        domain.metrics = metrics;
        stats.enriched++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to enrich ${domain.domain}:`, error);
        stats.errors++;
      }
    }

    // Store all domains
    await storeDiscoveredDomains(domains);
    console.log('Domain sync complete');

  } catch (error) {
    console.error('Daily sync failed:', error);
    stats.errors++;
  }

  return stats;
}
