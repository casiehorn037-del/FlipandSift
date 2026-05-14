import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Debug: Log current directory and structure
  console.log(`[Static] Current directory: ${process.cwd()}`);
  console.log(`[Static] __dirname: ${import.meta.dirname}`);
  
  // Try multiple possible locations for the dist folder
  const possiblePaths = [
    // Render specific (one level up from src) - where build actually outputs
    path.resolve(import.meta.dirname, "..", "..", "..", "dist", "public"),
    // Standard location (project root)
    path.resolve(import.meta.dirname, "..", "..", "dist", "public"),
    // Current working directory
    path.resolve(process.cwd(), "dist", "public"),
    // Current working directory parent (for Render)
    path.resolve(process.cwd(), "..", "dist", "public"),
  ];

  let distPath = "";
  for (const testPath of possiblePaths) {
    const exists = fs.existsSync(testPath);
    console.log(`[Static] Checking: ${testPath} - ${exists ? 'EXISTS' : 'NOT FOUND'}`);
    if (exists && !distPath) {
      distPath = testPath;
      console.log(`[Static] ✓ Using build directory: ${distPath}`);
    }
  }

  if (!distPath) {
    console.error(`[Static] ✗ Could not find build directory in any location`);
    // Use the Render-specific path as default
    distPath = possiblePaths[0];
  }

  // Verify index.html exists
  const indexPath = path.resolve(distPath, "index.html");
  console.log(`[Static] Looking for index.html at: ${indexPath}`);
  console.log(`[Static] index.html exists: ${fs.existsSync(indexPath)}`);

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    if (!fs.existsSync(indexPath)) {
      console.error(`[Static] index.html not found at ${indexPath}`);
      res.status(500).send(`Server Error: Build files not found. Checked: ${possiblePaths.join(', ')}`);
      return;
    }
    res.sendFile(indexPath);
  });
}
