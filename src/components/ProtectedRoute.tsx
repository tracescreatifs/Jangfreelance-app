import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle } from 'lucide-react';

function ExpiredBanner() {
  const navigate = useNavigate();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 py-2.5 flex items-center justify-center gap-3 shadow-lg">
      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm font-medium">
        Votre licence a expire. L'application est en mode lecture seule.
      </span>
      <button
        onClick={() => navigate('/tarifs')}
        className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-semibold transition-colors"
      >
        Renouveler
      </button>
    </div>
  );
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, licenseExpired, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/70 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const showExpiredBanner = licenseExpired && !isAdmin;

  return (
    <>
      {showExpiredBanner && <ExpiredBanner />}
      <div className={showExpiredBanner ? 'pt-10' : ''}>
        {children}
      </div>
    </>
  );
}
