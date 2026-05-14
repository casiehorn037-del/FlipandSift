// Fallback database implementation for when DATABASE_URL is not set
// This allows the app to start and show a setup page

export const isDatabaseConfigured = () => {
  return !!process.env.DATABASE_URL;
};

export const getDbStatus = () => {
  return {
    configured: isDatabaseConfigured(),
    message: isDatabaseConfigured() 
      ? "Database connected" 
      : "Database not configured. Please set DATABASE_URL environment variable."
  };
};
