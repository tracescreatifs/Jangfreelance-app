import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import Index from '@/pages/Index';
import LandingPage from '@/pages/LandingPage';

export default function RootRoute() {
  const { user, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white/60 rounded-full animate-spin" />
          <p className="text-white/50 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  // Not logged in → Landing page
  if (!user) {
    return <LandingPage />;
  }

  // Logged in → Dashboard (wrapped in ProtectedRoute for onboarding/license checks)
  return (
    <ProtectedRoute>
      <Index />
    </ProtectedRoute>
  );
}
