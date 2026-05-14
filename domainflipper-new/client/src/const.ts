export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Magic Link auth - no OAuth needed
export const getLoginUrl = () => {
  return "/login";
};
