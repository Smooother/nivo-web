import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import StyleGuide from "./pages/StyleGuide";
import DashboardLayout from "./app/DashboardLayout";
import AdminLayout from "./app/(admin)/admin/layout";
import OverviewPage from "./app/(analysis)/page";
import SearchPage from "./app/(analysis)/search/page";
import AnalysisPage from "./app/(analysis)/analysis/page";
import InsightsPage from "./app/(analysis)/insights/page";
import ExportPage from "./app/(analysis)/export/page";
import ScrapersPage from "./app/(analysis)/scrapers/page";
import AdminUsersPage from "./app/(admin)/admin/users/page";
import RolesPage from "./app/(admin)/admin/roles/page";
import DbStatusPage from "./app/(admin)/admin/db-status/page";
import IntegrationsPage from "./app/(admin)/admin/integrations/page";
import { ThemeProvider } from "@/components/theme-provider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<OverviewPage />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="analysis" element={<AnalysisPage />} />
                <Route path="insights" element={<InsightsPage />} />
                <Route path="export" element={<ExportPage />} />
                <Route path="scrapers" element={<ScrapersPage />} />
                <Route element={<AdminLayout />}>
                  <Route path="admin/users" element={<AdminUsersPage />} />
                  <Route path="admin/roles" element={<RolesPage />} />
                  <Route path="admin/db-status" element={<DbStatusPage />} />
                  <Route path="admin/integrations" element={<IntegrationsPage />} />
                </Route>
              </Route>
              <Route path="/landing" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/styleguide" element={<StyleGuide />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
