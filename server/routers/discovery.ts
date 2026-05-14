/**
 * Discovery Router
 * Handles domain discovery and curation
 */

import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../_core/trpc.js';
import { seedCuratedDomains, getCuratedDomains, addCuratedDomain } from '../services/domainCuration.js';
import { dailyDomainSync } from '../services/domainDiscoveryWorking.js';

export const discoveryRouter = router({
  /**
   * Get discovered domains with filters
   */
  getDomains: protectedProcedure
    .input(z.object({
      niche: z.string().optional(),
      minScore: z.number().optional(),
      status: z.string().optional(),
      limit: z.number().default(50),
    }).optional())
    .query(async ({ input }) => {
      const domains = await getCuratedDomains({
        niche: input?.niche,
        minScore: input?.minScore,
        status: input?.status,
        limit: input?.limit,
      });

      return { domains, count: domains.length };
    }),

  /**
   * Seed database with initial curated domains
   * Admin only
   */
  seedDomains: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Check if admin
      if (ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      await seedCuratedDomains();
      return { success: true, message: 'Domains seeded successfully' };
    }),

  /**
   * Add a new curated domain
   * Admin only
   */
  addDomain: protectedProcedure
    .input(z.object({
      domain: z.string(),
      tld: z.string(),
      status: z.enum(['pending_delete', 'auction', 'available', 'dropped']),
      niche: z.string(),
      metrics: z.object({
        trustFlow: z.number(),
        citationFlow: z.number(),
        referringDomains: z.number(),
        domainAge: z.number(),
      }),
      estimatedValue: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      await addCuratedDomain({
        ...input,
        whyGood: '',
        source: 'manual_curation',
      }, 'admin');

      return { success: true, message: `Added ${input.domain}` };
    }),

  /**
   * Run daily sync (manual trigger)
   * Admin only
   */
  runDailySync: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      const stats = await dailyDomainSync();
      return { success: true, stats };
    }),

  /**
   * Get discovery stats
   */
  getStats: publicProcedure
    .query(async () => {
      // Return stats about the domain feed
      return {
        totalDomains: 10, // Replace with actual count
        todayAdded: 5,
        byNiche: {
          health: 3,
          finance: 2,
          tech: 2,
          marketing: 2,
          education: 1,
        },
      };
    }),
});
