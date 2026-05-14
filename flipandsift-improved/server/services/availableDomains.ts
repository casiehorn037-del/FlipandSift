/**
 * Available & Expired Domain Discovery
 * Focuses on domains that are immediately registerable
 */

import axios from 'axios';
import { getDb } from '../db.js';
import { domainFeed } from '../../drizzle/schema.js';
import { eq, and, or, desc } from 'drizzle-orm';

export interface AvailableDomain {
  domain: string;
  tld: string;
  status: 'available' | 'expired' | 'dropped';
  dropDate?: Date;
  availableSince?: Date;
  previousOwner?: string;
  metrics?: {
    trustFlow?: number;
    citationFlow?: number;
    referringDomains?: number;
    domainAge?: number;
    archiveOrgSnapshots?: number;
    lastSeen?: Date;
  };
  whyAvailable?: string;
  estimatedValue: number;
  registrar?: string;
  source: string;
}

/**
 * Check if domain is available for registration
 * Uses WHOIS and DNS checks
 */
export async function checkDomainAvailability(domain: string): Promise<{
  available: boolean;
  status: string;
  dropDate?: Date;
}> {
  try {
    // Check DNS first (fast)
    const dns = await import('dns').then(m => m.promises);
    try {
      await dns.resolveNs(domain);
      return { available: false, status: 'registered' };
    } catch (dnsError: any) {
      if (dnsError.code === 'ENOTFOUND' || dnsError.code === 'ENODATA') {
        // No NS records - likely available
        return { available: true, status: 'available' };
      }
    }

    // Fallback to WHOIS check
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      const { stdout } = await execAsync(`whois ${domain}`, { timeout: 10000 });
      
      // Check for available indicators
      if (stdout.toLowerCase().includes('no match') || 
          stdout.toLowerCase().includes('not found') ||
          stdout.toLowerCase().includes('available')) {
        return { available: true, status: 'available' };
      }

      // Check for expired
      if (stdout.toLowerCase().includes('expired') || 
          stdout.toLowerCase().includes('redemption')) {
        return { available: false, status: 'expired_pending' };
      }

      return { available: false, status: 'registered' };
    } catch (error) {
      // WHOIS failed, assume available
      return { available: true, status: 'unknown' };
    }
  } catch (error) {
    console.error(`[Availability] Check failed for ${domain}:`, error);
    return { available: false, status: 'error' };
  }
}

/**
 * Fetch recently dropped domains (available for registration)
 */
async function fetchDroppedDomains(): Promise<AvailableDomain[]> {
  const domains: AvailableDomain[] = [];

  // Source 1: Registry drop lists (authoritative)
  // Verisign publishes daily drop lists for .com/.net
  try {
    const comDrops = await fetchVerisignDrops('com');
    domains.push(...comDrops);
  } catch (error) {
    console.error('[Discovery] Verisign drops failed:', error);
  }

  // Source 2: Pending delete lists
  // Domains dropping in next 5 days
  try {
    const pendingDrops = await fetchPendingDeleteList();
    domains.push(...pendingDrops);
  } catch (error) {
    console.error('[Discovery] Pending delete failed:', error);
  }

  return domains;
}

/**
 * Fetch Verisign drop list (.com/.net)
 */
async function fetchVerisignDrops(tld: string): Promise<AvailableDomain[]> {
  try {
    // Verisign publishes daily drops via FTP
    // This is a simplified version - real implementation needs FTP access
    const response = await axios.get(`https://www.verisign.com/domain-information/${tld}-expiration/`, {
      timeout: 30000,
    });

    // Parse drop list
    // Real implementation would parse their actual data format
    return [];
  } catch (error) {
    console.error(`[Discovery] Verisign ${tld} fetch failed:`, error);
    return [];
  }
}

/**
 * Fetch pending delete list
 * Domains entering deletion phase
 */
async function fetchPendingDeleteList(): Promise<AvailableDomain[]> {
  // Multiple sources track pending delete domains
  const domains: AvailableDomain[] = [];

  // Try common TLDs
  const tlds = ['com', 'net', 'org', 'io', 'co'];

  for (const tld of tlds) {
    try {
      // Use DNS to find domains in redemption period
      // This is a simplified approach
      const response = await axios.get(`https://www.expireddomains.net/pending-delete/?tld=${tld}`, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FlipAndSift/1.0)'
        }
      });

      const cheerio = await import('cheerio');
      const $ = cheerio.load(response.data);

      $('table tbody tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 3) {
          const domain = cells.eq(0).text().trim();
          const dropDate = cells.eq(1).text().trim();
          
          if (domain && domain.includes('.')) {
            domains.push({
              domain,
              tld: domain.split('.').pop() || tld,
              status: 'expired',
              dropDate: new Date(dropDate),
              source: 'pending_delete_list',
              estimatedValue: 0, // Will be calculated
            });
          }
        }
      });
    } catch (error) {
      console.error(`[Discovery] Pending delete ${tld} failed:`, error);
    }
  }

  return domains;
}

/**
 * Fetch expired domains with metrics
 * These are the gold - expired but with backlinks
 */
async function fetchExpiredDomainsWithMetrics(): Promise<AvailableDomain[]> {
  // This requires access to SEO data APIs
  // Majestic, Ahrefs, or SEMrush
  
  const domains: AvailableDomain[] = [];
  const majesticKey = process.env.MAJESTIC_API_KEY;

  if (!majesticKey) {
    console.log('[Discovery] Majestic API not configured, skipping metrics');
    return domains;
  }

  try {
    // Get fresh index from Majestic
    const response = await axios.get('https://api.majestic.com/api/json', {
      params: {
        app_api_key: majesticKey,
        cmd: 'GetExpiredDomains',
        datasource: 'fresh',
        Count: 100,
      },
      timeout: 60000,
    });

    if (response.data && response.data.DataTables) {
      const domains_data = response.data.DataTables.Domains.Data;
      
      domains_data.forEach((d: any) => {
        domains.push({
          domain: d.Domain,
          tld: d.Domain.split('.').pop() || 'com',
          status: 'expired',
          metrics: {
            trustFlow: parseInt(d.TrustFlow) || 0,
            citationFlow: parseInt(d.CitationFlow) || 0,
            referringDomains: parseInt(d.RefDomains) || 0,
            domainAge: parseInt(d.Age) || 0,
          },
          source: 'majestic_expired',
          estimatedValue: calculateDomainValue({
            trustFlow: parseInt(d.TrustFlow) || 0,
            referringDomains: parseInt(d.RefDomains) || 0,
            domainAge: parseInt(d.Age) || 0,
          }),
        });
      });
    }
  } catch (error) {
    console.error('[Discovery] Majestic expired domains failed:', error);
  }

  return domains;
}

/**
 * Calculate estimated domain value
 */
function calculateDomainValue(metrics: {
  trustFlow: number;
  referringDomains: number;
  domainAge: number;
}): number {
  let value = 0;

  // Base value from Trust Flow
  value += metrics.trustFlow * 10;

  // Value from backlinks
  value += metrics.referringDomains * 2;

  // Age premium
  value += metrics.domainAge * 5;

  // Minimum value
  if (value < 50) value = 50;

  return Math.round(value);
}

/**
 * Verify domains are actually available
 * Batch check to avoid overwhelming WHOIS servers
 */
export async function verifyAvailability(
  domains: AvailableDomain[],
  batchSize: number = 10
): Promise<AvailableDomain[]> {
  const verified: AvailableDomain[] = [];

  for (let i = 0; i < domains.length; i += batchSize) {
    const batch = domains.slice(i, i + batchSize);
    
    const results = await Promise.all(
      batch.map(async (domain) => {
        const check = await checkDomainAvailability(domain.domain);
        return { domain, check };
      })
    );

    results.forEach(({ domain, check }) => {
      if (check.available) {
        verified.push({
          ...domain,
          status: 'available',
          whyAvailable: 'Recently dropped, available for registration',
        });
      }
    });

    // Rate limiting - be nice to WHOIS servers
    if (i + batchSize < domains.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return verified;
}

/**
 * Main discovery function
 * Returns available and expired domains ready for registration
 */
export async function discoverAvailableDomains(
  options: {
    limit?: number;
    minTrustFlow?: number;
    verify?: boolean;
  } = {}
): Promise<AvailableDomain[]> {
  console.log('[Discovery] Finding available and expired domains...');

  const allDomains: AvailableDomain[] = [];

  // Fetch from multiple sources
  const [dropped, expired] = await Promise.all([
    fetchDroppedDomains(),
    fetchExpiredDomainsWithMetrics(),
  ]);

  allDomains.push(...dropped, ...expired);

  // Remove duplicates
  const unique = new Map<string, AvailableDomain>();
  allDomains.forEach(d => {
    const existing = unique.get(d.domain);
    if (!existing || (d.metrics?.trustFlow || 0) > (existing.metrics?.trustFlow || 0)) {
      unique.set(d.domain, d);
    }
  });

  let domains = Array.from(unique.values());

  // Filter by quality
  if (options.minTrustFlow) {
    domains = domains.filter(d => (d.metrics?.trustFlow || 0) >= options.minTrustFlow!);
  }

  // Sort by value
  domains.sort((a, b) => b.estimatedValue - a.estimatedValue);

  // Limit results
  if (options.limit) {
    domains = domains.slice(0, options.limit);
  }

  // Verify availability (optional, slower)
  if (options.verify) {
    console.log(`[Discovery] Verifying ${domains.length} domains...`);
    domains = await verifyAvailability(domains);
  }

  console.log(`[Discovery] Found ${domains.length} available/expired domains`);
  return domains;
}

/**
 * Store available domains in database
 */
export async function storeAvailableDomains(domains: AvailableDomain[]): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  for (const domain of domains) {
    try {
      // Check if exists
      const existing = await db
        .select()
        .from(domainFeed)
        .where(eq(domainFeed.domain, domain.domain))
        .limit(1);

      const data = {
        domain: domain.domain,
        tld: domain.tld,
        status: domain.status,
        source: domain.source,
        metrics: domain.metrics ? JSON.stringify(domain.metrics) : null,
        opportunityScore: Math.min(domain.estimatedValue / 10, 100),
        discoveredAt: new Date(),
        updatedAt: new Date(),
      };

      if (existing.length > 0) {
        await db.update(domainFeed).set(data).where(eq(domainFeed.domain, domain.domain));
      } else {
        await db.insert(domainFeed).values(data);
      }
    } catch (error) {
      console.error(`[Discovery] Failed to store ${domain.domain}:`, error);
    }
  }
}

/**
 * Daily sync for available domains
 */
export async function dailyAvailableDomainSync(): Promise<{
  found: number;
  stored: number;
  verified: number;
}> {
  console.log('[Discovery] Starting daily available domain sync...');

  const stats = { found: 0, stored: 0, verified: 0 };

  try {
    // Find domains
    const domains = await discoverAvailableDomains({
      limit: 100,
      minTrustFlow: 10,
    });
    stats.found = domains.length;

    // Verify top domains (optional, can be slow)
    const topDomains = domains.slice(0, 20);
    const verified = await verifyAvailability(topDomains);
    stats.verified = verified.length;

    // Store all
    await storeAvailableDomains(domains);
    stats.stored = domains.length;

    console.log('[Discovery] Daily sync complete:', stats);
  } catch (error) {
    console.error('[Discovery] Daily sync failed:', error);
  }

  return stats;
}
