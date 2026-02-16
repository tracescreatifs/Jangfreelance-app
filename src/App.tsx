import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Index from "./pages/Index";
import Projets from "./pages/Projets";
import Clients from "./pages/Clients";
import TimerPage from "./pages/TimerPage";
import Factures from "./pages/Factures";
import Comptabilite from "./pages/Comptabilite";
import Suivi from "./pages/Suivi";
import Exports from "./pages/Exports";
import Parametres from "./pages/Parametres";
import Services from "./pages/Services";
import Tarifs from "./pages/Tarifs";
import Paiement from "./pages/Paiement";
import PaiementSuccess from "./pages/PaiementSuccess";
import LicenseActivation from "./pages/LicenseActivation";
import LicenseAdmin from "./pages/LicenseAdmin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminLicenses from "./pages/admin/AdminLicenses";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminEmails from "./pages/admin/AdminEmails";
import AdminRoute from "./components/AdminRoute";
import Corbeille from "./pages/Corbeille";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PWAInstallPrompt />
          <Routes>
            {/* Routes publiques */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Routes protégées */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/projets" element={<ProtectedRoute><Projets /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
            <Route path="/timer" element={<ProtectedRoute><TimerPage /></ProtectedRoute>} />
            <Route path="/factures" element={<ProtectedRoute><Factures /></ProtectedRoute>} />
            <Route path="/comptabilite" element={<ProtectedRoute><Comptabilite /></ProtectedRoute>} />
            <Route path="/suivi" element={<ProtectedRoute><Suivi /></ProtectedRoute>} />
            <Route path="/exports" element={<ProtectedRoute><Exports /></ProtectedRoute>} />
            <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
            <Route path="/parametres" element={<ProtectedRoute><Parametres /></ProtectedRoute>} />
            <Route path="/tarifs" element={<ProtectedRoute><Tarifs /></ProtectedRoute>} />
            <Route path="/paiement" element={<ProtectedRoute><Paiement /></ProtectedRoute>} />
            <Route path="/paiement/success" element={<ProtectedRoute><PaiementSuccess /></ProtectedRoute>} />
            <Route path="/license" element={<ProtectedRoute><LicenseActivation /></ProtectedRoute>} />
            <Route path="/license-admin" element={<ProtectedRoute><LicenseAdmin /></ProtectedRoute>} />
            <Route path="/corbeille" element={<ProtectedRoute><Corbeille /></ProtectedRoute>} />

            {/* Routes admin */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/licenses" element={<AdminRoute><AdminLicenses /></AdminRoute>} />
            <Route path="/admin/revenue" element={<AdminRoute><AdminRevenue /></AdminRoute>} />
            <Route path="/admin/emails" element={<AdminRoute><AdminEmails /></AdminRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
