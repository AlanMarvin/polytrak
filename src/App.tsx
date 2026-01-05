import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { SiteStructuredData } from "@/components/seo/StructuredData";
import Index from "./pages/Index";
import TraderProfile from "./pages/TraderProfile";
import AnalyzeTrader from "./pages/AnalyzeTrader";
import Markets from "./pages/Markets";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Blog from "./pages/Blog";
import BlogFeatures from "./pages/BlogFeatures";
import Contact from "./pages/Contact";
import Disclaimer from "./pages/Disclaimer";
import HowItWorks from "./pages/HowItWorks";
import Recent from "./pages/Recent";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <SiteStructuredData />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/analyze" element={<AnalyzeTrader />} />
              <Route path="/trader/:address" element={<TraderProfile />} />
              <Route path="/markets" element={<Markets />} />
              <Route path="/recent" element={<Recent />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/features" element={<BlogFeatures />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
