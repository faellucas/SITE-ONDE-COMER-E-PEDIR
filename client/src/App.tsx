import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import MobileBottomNav from "./components/MobileBottomNav";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
import { ThemeProvider } from "./contexts/ThemeContext";
import HomePage from "./pages/Home";
import SearchPage from "./pages/Search";
import ListingDetailPage from "./pages/ListingDetail";
import CategoryPage from "./pages/Category";
import PlansPage from "./pages/Plans";
import AdvertiserDashboard from "./pages/advertiser/Dashboard";
import AdvertiserProfile from "./pages/advertiser/Profile";
import NewListing from "./pages/advertiser/NewListing";
import AdminDashboard from "./pages/admin/Dashboard";
import FavoritesPage from "./pages/Favorites";
import LoginPage from "./pages/Login";
import ResetPasswordPage from "./pages/ResetPassword";
import HowItWorksPage from "./pages/HowItWorks";
import TermsPage from "./pages/Terms";
import PrivacyPage from "./pages/Privacy";
import CityPage from "./pages/City";
import GuidePage from "./pages/Guide";
import StoresPage from "./pages/Stores";
import BoosterPage from "./pages/Booster";

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/entrar" component={LoginPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/cadastro" component={LoginPage} />
      <Route path="/redefinir-senha" component={ResetPasswordPage} />
      <Route path="/busca" component={SearchPage} />
      <Route path="/guia" component={GuidePage} />
      <Route path="/lojas" component={StoresPage} />
      <Route path="/booster" component={BoosterPage} />
      <Route path="/anuncio/:id" component={ListingDetailPage} />
      <Route path="/categoria/:slug" component={CategoryPage} />
      <Route path="/cidade/:slug" component={CityPage} />
      <Route path="/planos" component={PlansPage} />
      <Route path="/como-funciona" component={HowItWorksPage} />
      <Route path="/termos" component={TermsPage} />
      <Route path="/privacidade" component={PrivacyPage} />
      <Route path="/anunciante" component={AdvertiserDashboard} />
      <Route path="/anunciante/meus-dados" component={AdvertiserProfile} />
      <Route path="/painel" component={AdvertiserDashboard} />
      <Route path="/cliente" component={AdvertiserDashboard} />
      <Route path="/anunciante/novo" component={NewListing} />
      <Route path="/anunciante/editar/:id" component={NewListing} />
      <Route path="/anunciar" component={NewListing} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/painel-admin" component={AdminDashboard} />
      <Route path="/favoritos" component={FavoritesPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <ScrollToTop />
          <Toaster />
          <PwaInstallPrompt />
          <Router />
          <MobileBottomNav />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
