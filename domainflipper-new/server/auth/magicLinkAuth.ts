import { Router } from "express";
import jwt from "jsonwebtoken";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const MAGIC_LINK_EXPIRY = "15m"; // 15 minutes

// In-memory store for magic tokens (in production, use Redis)
const magicTokens = new Map<string, { email: string; expires: Date }>();

export function registerMagicLinkAuthRoutes(router: Router) {
  // Request magic link
  router.post("/api/auth/magic-link", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "Valid email required" });
      }

      // Generate magic token
      const magicToken = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      
      magicTokens.set(magicToken, { email, expires });

      // In production, send email here
      // For now, return the link directly (for testing)
      const baseUrl = process.env.NODE_ENV === "production" 
        ? "https://flipandsift.onrender.com"
        : "http://localhost:3000";
      
      const magicLink = `${baseUrl}/api/auth/verify-magic-link?token=${magicToken}`;

      console.log(`[Magic Link] Generated for ${email}: ${magicLink}`);

      // TODO: Send actual email in production
      // await sendEmail({
      //   to: email,
      //   subject: "Your FlipAndSift Login Link",
      //   text: `Click here to login: ${magicLink}\n\nThis link expires in 15 minutes.`
      // });

      res.json({
        success: true,
        message: "Magic link sent to your email",
        // Only include link in development
        ...(process.env.NODE_ENV !== "production" && { magicLink })
      });
    } catch (error) {
      console.error("Magic link error:", error);
      res.status(500).json({ error: "Failed to generate magic link" });
    }
  });

  // Verify magic link
  router.get("/api/auth/verify-magic-link", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        return res.status(400).json({ error: "Invalid token" });
      }

      // Check if token exists and is valid
      const magicData = magicTokens.get(token);
      if (!magicData) {
        return res.status(400).json({ error: "Invalid or expired link" });
      }

      if (new Date() > magicData.expires) {
        magicTokens.delete(token);
        return res.status(400).json({ error: "Link has expired" });
      }

      const { email } = magicData;

      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }

      // Find or create user
      let userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
      
      let userId: number;
      let userName: string;

      if (userResult.length === 0) {
        // Create new user
        const insertResult = await db.insert(users).values({
          email,
          name: email.split("@")[0],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        userId = Number(insertResult[0].insertId);
        userName = email.split("@")[0];
      } else {
        userId = userResult[0].id;
        userName = userResult[0].name || email.split("@")[0];
      }

      // Generate JWT
      const authToken = jwt.sign(
        { userId, email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Delete used magic token
      magicTokens.delete(token);

      // Redirect to app with token
      const baseUrl = process.env.NODE_ENV === "production"
        ? "https://flipandsift.onrender.com"
        : "http://localhost:3000";

      res.redirect(`${baseUrl}/auth/callback?token=${authToken}`);
    } catch (error) {
      console.error("Verify magic link error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Verify auth token
  router.get("/api/auth/me", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      
      if (!token) {
        return res.status(401).json({ error: "No token provided" });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
      
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }

      const userResult = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
      
      if (userResult.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = userResult[0];
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Logout
  router.post("/api/auth/logout", (req, res) => {
    res.json({ success: true });
  });
}
