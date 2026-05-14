import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export function registerSimpleAuthRoutes(router: Router) {
  // Register
  router.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }

      // Check if user exists
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const result = await db.insert(users).values({
        email,
        name: name || email.split("@")[0],
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const userId = Number(result[0].insertId);

      // Generate JWT
      const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "7d" });

      res.json({
        success: true,
        token,
        user: {
          id: userId,
          email,
          name: name || email.split("@")[0],
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Login
  router.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }

      // Find user
      const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (userResult.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = userResult[0];

      // Check password
      const validPassword = await bcrypt.compare(password, user.password || "");
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Verify token
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
}
