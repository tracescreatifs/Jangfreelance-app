import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { useSubscription } from '../hooks/useSubscription';
import { useToast } from '../hooks/use-toast';

const PaiementSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { updateSubscriptionAfterPayment, refreshSubscription } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Récupérer les infos du paiement en attente
        const pendingPayment = localStorage.getItem('pendingPayment');

        if (pendingPayment) {
          const { planId, billingCycle, amount, token } = JSON.parse(pendingPayment);

          // Mettre à jour l'abonnement
          const result = await updateSubscriptionAfterPayment(
            planId,
            billingCycle,
            {
              transactionId: token || `PAY-${Date.now()}`,
              paymentMethod: 'paydunya',
              amount: amount,
            }
          );

          if (result.success) {
            setIsSuccess(true);
            toast({
              title: "Paiement réussi !",
              description: "Votre abonnement est maintenant actif",
            });

            // Nettoyer le localStorage
            localStorage.removeItem('pendingPayment');

            // Rafraîchir l'abonnement
            await refreshSubscription();
          } else {
            throw new Error(result.message);
          }
        } else {
          // Pas de paiement en attente, mais on est sur la page success
          // Probablement un refresh, on considère que c'est OK
          setIsSuccess(true);
        }
      } catch (error: any) {
        console.error('Erreur traitement paiement:', error);
        toast({
          title: "Erreur",
          description: error.message || "Une erreur est survenue",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processPayment();
  }, []);

  if (isProcessing) {
    return (
      <div className="min-h-screen">
        <Sidebar />
        <div className="ml-0 lg:ml-64 p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-screen">
          <div className="glass-morphism p-8 rounded-2xl max-w-md w-full text-center">
            <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Traitement en cours...</h2>
            <p className="text-purple-200">
              Veuillez patienter pendant que nous activons votre abonnement.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="ml-0 lg:ml-64 p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <div className="glass-morphism p-8 rounded-2xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            {isSuccess ? 'Paiement réussi !' : 'Paiement effectué'}
          </h2>
          <p className="text-purple-200 mb-6">
            Votre abonnement est maintenant actif. Profitez de toutes les fonctionnalités !
          </p>
          <Button
            onClick={() => navigate('/')}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
          >
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaiementSuccess;
