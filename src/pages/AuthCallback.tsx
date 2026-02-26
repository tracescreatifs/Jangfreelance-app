import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Confirmation en cours...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Lire le type depuis le hash fragment (#access_token=...&type=signup)
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace('#', ''));
        const type = params.get('type');
        const errorDescription = params.get('error_description');

        // Si Supabase a renvoye une erreur dans le hash
        if (errorDescription) {
          setMessage('Erreur de confirmation');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // Attendre que Supabase traite le token automatiquement
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[AuthCallback] Erreur session:', error);
          setMessage('Erreur de confirmation. Redirection...');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        if (type === 'recovery') {
          // Reset password → envoyer vers la page de changement de mot de passe
          setMessage('Redirection vers le changement de mot de passe...');
          setTimeout(() => navigate('/reset-password'), 500);
        } else if (type === 'signup') {
          // Inscription confirmee → onboarding
          setMessage('Compte confirmé ! Configuration...');
          setTimeout(() => navigate('/onboarding'), 1000);
        } else if (type === 'email_change' || session) {
          // Autre confirmation → dashboard
          setMessage('Confirmé ! Redirection...');
          setTimeout(() => navigate('/'), 1000);
        } else {
          // Fallback → login
          setMessage('Redirection...');
          setTimeout(() => navigate('/login'), 1000);
        }
      } catch (err) {
        console.error('[AuthCallback] Exception:', err);
        setMessage('Une erreur est survenue. Redirection...');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <p className="text-white text-lg font-medium">{message}</p>
        <p className="text-white/40 text-sm mt-2">Veuillez patienter...</p>
      </div>
    </div>
  );
}
