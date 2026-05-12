import { createContext } from "../server/_core/context-fetch";
import { appRouter } from "../server/routers";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// tRPC handler for Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Handle Stripe webhook separately (needs raw body)
  if (req.url === "/api/stripe/webhook") {
    const { registerStripeWebhook } = await import("../server/stripeWebhook");
    return registerStripeWebhook(req, res);
  }

  // Handle all other tRPC requests
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: req as any,
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      console.error(`tRPC error on ${path}:`, error);
    },
  });
}