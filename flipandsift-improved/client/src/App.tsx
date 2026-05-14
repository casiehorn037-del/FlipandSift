import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import DomainDiscovery from "./pages/DomainDiscovery";
import Watchlist from "./pages/Watchlist";
import Dashboard from "./pages/Dashboard";
import { DomainDetail } from "./pages/DomainDetail";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import Onboarding from "./components/Onboarding";
import AffiliateIntelligence from "./pages/AffiliateIntelligence";
import DomainChecker from "./pages/DomainChecker";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import ApiKeys from "./pages/ApiKeys";
import Alerts from "./pages/Alerts";
import AdminDashboard from "./pages/AdminDashboard";
import { useAuth } from "./_core/hooks/useAuth";
import { trpc } from "./lib/trpc";
import { useEffect, useState } from "react";

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Home} />
      <Route path="/pricing" component={Pricing} />

      {/* Authenticated — Core */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/discovery" component={DomainDiscovery} />
      <Route path="/domain/:domainName" component={DomainDetail} />
      <Route path="/watchlist" component={Watchlist} />
      <Route path="/settings" component={Settings} />

      {/* Authenticated — Tools */}
      <Route path="/affiliate-intelligence" component={AffiliateIntelligence} />
      <Route path="/domain-checker" component={DomainChecker} />
      <Route path="/alerts" component={Alerts} />

      {/* Authenticated — Projects */}
      <Route path="/projects" component={Projects} />
      <Route path="/projects/:id" component={ProjectDetail} />

      {/* Authenticated — Developer */}
      <Route path="/api-keys" component={ApiKeys} />
      <Route path="/developer" component={Developer} />

      {/* Admin */}
      <Route path="/admin" component={AdminDashboard} />

      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { user, loading } = useAuth();
  const [runOnboarding, setRunOnboarding] = useState(false);
  const { data: settings } = trpc.settings.get.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    if (!loading && user && settings && settings.onboardingCompleted === 0) {
      setRunOnboarding(true);
    }
  }, [loading, user, settings]);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
          {user && (
            <Onboarding
              run={runOnboarding}
              onComplete={() => setRunOnboarding(false)}
            />
          )}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
