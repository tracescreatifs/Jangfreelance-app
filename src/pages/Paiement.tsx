import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Clock, CheckCircle, AlertCircle, Smartphone, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { useSubscription } from '../hooks/useSubscription';
import { useToast } from '../hooks/use-toast';

// Configuration PayDunya (à remplacer par vos vraies clés)
const PAYDUNYA_CONFIG = {
  masterKey: 'VOTRE_MASTER_KEY', // Remplacer par votre clé
  privateKey: 'VOTRE_PRIVATE_KEY', // Remplacer par votre clé
  publicKey: 'VOTRE_PUBLIC_KEY', // Remplacer par votre clé
  token: 'VOTRE_TOKEN', // Remplacer par votre clé
  mode: 'test' // 'test' ou 'live'
};

type PaymentMethod = 'orange_money' | 'wave' | 'free_money' | 'mtn_momo';

interface PaymentMethodInfo {
  id: PaymentMethod;
  name: string;
  color: string;
  icon: string;
  instructions: string;
}

const paymentMethods: PaymentMethodInfo[] = [
  {
    id: 'orange_money',
    name: 'Orange Money',
    color: 'bg-orange-500',
    icon: 'OM',
    instructions: 'Vous recevrez une notification sur votre téléphone Orange Money'
  },
  {
    id: 'wave',
    name: 'Wave',
    color: 'bg-blue-500',
    icon: 'W',
    instructions: 'Confirmez le paiement dans votre application Wave'
  },
  {
    id: 'free_money',
    name: 'Free Money',
    color: 'bg-green-500',
    icon: 'FM',
    instructions: 'Validez le paiement via votre compte Free Money'
  },
  {
    id: 'mtn_momo',
    name: 'MTN Mobile Money',
    color: 'bg-yellow-500',
    icon: 'MTN',
    instructions: 'Approuvez la transaction sur votre téléphone MTN'
  }
];

const Paiement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateSubscriptionAfterPayment } = useSubscription();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('orange_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [transactionId, setTransactionId] = useState<string | null>(null);

  // Récupérer le plan depuis la navigation
  const plan = location.state?.plan;
  const billingCycle = location.state?.billingCycle || 'monthly';

  useEffect(() => {
    if (!plan) {
      navigate('/tarifs');
    }
  }, [plan, navigate]);

  if (!plan) {
    return null;
  }

  const getPrice = () => {
    return billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Format sénégalais: 77, 78, 76, 70, 75, 33
    const cleanPhone = phone.replace(/\s/g, '').replace('+221', '');
    return /^(77|78|76|70|75|33)\d{7}$/.test(cleanPhone);
  };

  const initiatePayDunyaPayment = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: "Numéro invalide",
        description: "Veuillez entrer un numéro de téléphone valide (ex: 77 123 45 67)",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('pending');

    try {
      // Simuler l'appel à PayDunya
      // En production, vous ferez un vrai appel à votre backend qui communiquera avec PayDunya

      const paymentData = {
        amount: getPrice(),
        description: `Abonnement ${plan.name} - ${billingCycle === 'yearly' ? 'Annuel' : 'Mensuel'}`,
        phone: phoneNumber.replace(/\s/g, ''),
        paymentMethod: selectedMethod,
        currency: 'XOF'
      };

      console.log('Initiation paiement PayDunya:', paymentData);

      // Simulation d'un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simulation de réponse PayDunya
      // En production, vous recevrez un vrai token de transaction
      const mockTransactionId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setTransactionId(mockTransactionId);

      // Simulation de succès (80% de chance)
      const isSuccess = Math.random() > 0.2;

      if (isSuccess) {
        // Mettre à jour l'abonnement dans Supabase
        const result = await updateSubscriptionAfterPayment(
          plan.id,
          billingCycle,
          {
            transactionId: mockTransactionId,
            paymentMethod: selectedMethod,
            amount: getPrice()
          }
        );

        if (result.success) {
          setPaymentStatus('success');
          toast({
            title: "Paiement réussi !",
            description: `Votre abonnement ${plan.name} est maintenant actif`,
          });
        } else {
          throw new Error(result.message);
        }
      } else {
        throw new Error('Paiement refusé par l\'opérateur');
      }
    } catch (error: any) {
      console.error('Erreur paiement:', error);
      setPaymentStatus('failed');
      toast({
        title: "Échec du paiement",
        description: error.message || "Une erreur est survenue lors du paiement",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedMethodInfo = paymentMethods.find(m => m.id === selectedMethod);

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen">
        <Sidebar />
        <div className="ml-0 lg:ml-64 p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-screen">
          <div className="glass-morphism p-8 rounded-2xl max-w-md w-full text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Paiement réussi !</h2>
            <p className="text-purple-200 mb-6">
              Votre abonnement <span className="text-white font-semibold">{plan.name}</span> est maintenant actif.
            </p>
            {transactionId && (
              <p className="text-sm text-purple-300 mb-6">
                Transaction: {transactionId}
              </p>
            )}
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
  }

  return (
    <div className="min-h-screen">
      <Sidebar />

      <div className="ml-0 lg:ml-64 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/tarifs')}
            className="text-purple-200 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux tarifs
          </Button>
          <h1 className="text-3xl font-bold text-white">Finaliser votre paiement</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
          {/* Formulaire de paiement */}
          <div className="glass-morphism p-6 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-6">Mode de paiement</h2>

            {/* Sélection du moyen de paiement */}
            <RadioGroup
              value={selectedMethod}
              onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
              className="space-y-3 mb-6"
            >
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedMethod === method.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <RadioGroupItem value={method.id} id={method.id} className="border-white" />
                  <div className={`w-10 h-10 ${method.color} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                    {method.icon}
                  </div>
                  <Label htmlFor={method.id} className="text-white cursor-pointer flex-1">
                    {method.name}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {/* Numéro de téléphone */}
            <div className="mb-6">
              <Label className="text-white mb-2 block">Numéro de téléphone</Label>
              <div className="flex">
                <div className="bg-white/10 border border-white/20 border-r-0 rounded-l-lg px-4 flex items-center text-white">
                  +221
                </div>
                <Input
                  type="tel"
                  placeholder="77 123 45 67"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="bg-white/10 border-white/20 text-white rounded-l-none"
                  disabled={isProcessing}
                />
              </div>
              <p className="text-purple-300 text-sm mt-2">
                {selectedMethodInfo?.instructions}
              </p>
            </div>

            {/* Message d'erreur si paiement échoué */}
            {paymentStatus === 'failed' && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                <div>
                  <p className="text-red-400 font-medium">Paiement échoué</p>
                  <p className="text-red-300 text-sm">Veuillez réessayer ou choisir un autre moyen de paiement.</p>
                </div>
              </div>
            )}

            {/* Bouton de paiement */}
            <Button
              onClick={initiatePayDunyaPayment}
              disabled={isProcessing || !phoneNumber}
              className="w-full py-6 text-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-105 transition-transform"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <Smartphone className="w-5 h-5 mr-2" />
                  Payer {formatCurrency(getPrice())}
                </>
              )}
            </Button>

            {/* Sécurité */}
            <div className="mt-6 flex items-center justify-center text-purple-300 text-sm">
              <Shield className="w-4 h-4 mr-2" />
              Paiement sécurisé via PayDunya
            </div>
          </div>

          {/* Récapitulatif */}
          <div className="glass-morphism p-6 rounded-2xl h-fit">
            <h2 className="text-xl font-semibold text-white mb-6">Récapitulatif</h2>

            <div className="space-y-4">
              {/* Plan sélectionné */}
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <div>
                  <p className="text-white font-medium">{plan.name}</p>
                  <p className="text-purple-300 text-sm">
                    Abonnement {billingCycle === 'yearly' ? 'annuel' : 'mensuel'}
                  </p>
                </div>
                <p className="text-white font-bold">{formatCurrency(getPrice())}</p>
              </div>

              {/* Détails */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-purple-300">Sous-total</span>
                  <span className="text-white">{formatCurrency(getPrice())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-purple-300">TVA (0%)</span>
                  <span className="text-white">0 F CFA</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <span className="text-white font-semibold">Total</span>
                <span className="text-2xl font-bold text-green-400">{formatCurrency(getPrice())}</span>
              </div>

              {/* Avantages */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <h4 className="text-white font-medium mb-3">Ce que vous obtenez :</h4>
                <ul className="space-y-2">
                  {plan.features.slice(0, 4).map((feature: string, index: number) => (
                    <li key={index} className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                      <span className="text-purple-200">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Période d'essai / Garantie */}
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <p className="text-green-400 font-medium">Satisfait ou remboursé</p>
                    <p className="text-green-300 text-sm">14 jours pour changer d'avis</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Paiement;
