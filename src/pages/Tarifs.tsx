import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, Zap, Building2, ArrowRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { useSubscription } from '../hooks/useSubscription';

const Tarifs = () => {
  const navigate = useNavigate();
  const { plans, subscription, loading } = useSubscription();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPrice = (plan: any) => {
    return billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
  };

  const getMonthlyEquivalent = (plan: any) => {
    if (billingCycle === 'yearly') {
      return Math.round(plan.priceYearly / 12);
    }
    return plan.priceMonthly;
  };

  const getSavings = (plan: any) => {
    const yearlyTotal = plan.priceYearly;
    const monthlyTotal = plan.priceMonthly * 12;
    return monthlyTotal - yearlyTotal;
  };

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'free':
        return <Zap className="w-8 h-8" />;
      case 'pro':
        return <Crown className="w-8 h-8" />;
      case 'business':
        return <Building2 className="w-8 h-8" />;
      default:
        return <Zap className="w-8 h-8" />;
    }
  };

  const getPlanGradient = (slug: string) => {
    switch (slug) {
      case 'free':
        return 'from-gray-500 to-gray-600';
      case 'pro':
        return 'from-purple-500 to-blue-500';
      case 'business':
        return 'from-amber-500 to-orange-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const isCurrentPlan = (planSlug: string) => {
    return subscription?.plan?.slug === planSlug;
  };

  const handleSelectPlan = (plan: any) => {
    if (plan.slug === 'free' || isCurrentPlan(plan.slug)) return;

    navigate('/paiement', {
      state: {
        plan,
        billingCycle
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Sidebar />
        <div className="ml-0 lg:ml-64 p-8 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar />

      <div className="ml-0 lg:ml-64 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-purple-200 text-lg max-w-2xl mx-auto mb-8">
            Développez votre activité freelance avec les outils adaptés à vos besoins
          </p>

          {/* Toggle mensuel/annuel */}
          <div className="flex items-center justify-center space-x-4">
            <Label className={`text-lg ${billingCycle === 'monthly' ? 'text-white' : 'text-purple-300'}`}>
              Mensuel
            </Label>
            <Switch
              checked={billingCycle === 'yearly'}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
            />
            <Label className={`text-lg ${billingCycle === 'yearly' ? 'text-white' : 'text-purple-300'}`}>
              Annuel
            </Label>
            {billingCycle === 'yearly' && (
              <Badge className="bg-green-500 text-white ml-2">
                -16% d'économie
              </Badge>
            )}
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`glass-morphism rounded-2xl p-6 relative ${
                plan.slug === 'pro' ? 'ring-2 ring-purple-500 scale-105' : ''
              }`}
            >
              {plan.slug === 'pro' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1">
                    Populaire
                  </Badge>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${getPlanGradient(plan.slug)} text-white mb-4`}>
                  {getPlanIcon(plan.slug)}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>

                {/* Prix */}
                <div className="mb-2">
                  {plan.slug === 'free' ? (
                    <div className="text-4xl font-bold text-white">Gratuit</div>
                  ) : (
                    <>
                      <div className="text-4xl font-bold text-white">
                        {formatCurrency(getMonthlyEquivalent(plan))}
                        <span className="text-lg text-purple-200">/mois</span>
                      </div>
                      {billingCycle === 'yearly' && (
                        <div className="text-sm text-green-400 mt-1">
                          Économisez {formatCurrency(getSavings(plan))}/an
                        </div>
                      )}
                    </>
                  )}
                </div>

                {billingCycle === 'yearly' && plan.slug !== 'free' && (
                  <div className="text-purple-300 text-sm">
                    Facturé {formatCurrency(getPrice(plan))}/an
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-white">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                onClick={() => handleSelectPlan(plan)}
                disabled={isCurrentPlan(plan.slug)}
                className={`w-full py-6 text-lg ${
                  isCurrentPlan(plan.slug)
                    ? 'bg-gray-600 cursor-not-allowed'
                    : plan.slug === 'free'
                    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    : `bg-gradient-to-r ${getPlanGradient(plan.slug)} hover:scale-105 transition-transform`
                }`}
              >
                {isCurrentPlan(plan.slug) ? (
                  'Plan actuel'
                ) : plan.slug === 'free' ? (
                  'Commencer gratuitement'
                ) : (
                  <>
                    Choisir {plan.name}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Moyens de paiement */}
        <div className="mt-16 text-center">
          <h3 className="text-xl font-semibold text-white mb-6">Moyens de paiement acceptés</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="glass-morphism px-6 py-3 rounded-lg flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs">OM</div>
              <span className="text-white">Orange Money</span>
            </div>
            <div className="glass-morphism px-6 py-3 rounded-lg flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">W</div>
              <span className="text-white">Wave</span>
            </div>
            <div className="glass-morphism px-6 py-3 rounded-lg flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs">FM</div>
              <span className="text-white">Free Money</span>
            </div>
            <div className="glass-morphism px-6 py-3 rounded-lg flex items-center space-x-2">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xs">MTN</div>
              <span className="text-white">MTN MoMo</span>
            </div>
          </div>
          <p className="text-purple-300 mt-4 text-sm">
            Paiements sécurisés via PayDunya
          </p>
        </div>

        {/* FAQ rapide */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Questions fréquentes</h3>
          <div className="space-y-4">
            <div className="glass-morphism p-4 rounded-xl">
              <h4 className="text-white font-semibold mb-2">Puis-je changer de plan à tout moment ?</h4>
              <p className="text-purple-200">Oui, vous pouvez passer à un plan supérieur à tout moment. La différence sera calculée au prorata.</p>
            </div>
            <div className="glass-morphism p-4 rounded-xl">
              <h4 className="text-white font-semibold mb-2">Comment fonctionne l'annulation ?</h4>
              <p className="text-purple-200">Vous pouvez annuler à tout moment. Votre abonnement restera actif jusqu'à la fin de la période payée.</p>
            </div>
            <div className="glass-morphism p-4 rounded-xl">
              <h4 className="text-white font-semibold mb-2">J'ai une clé de licence, comment l'utiliser ?</h4>
              <p className="text-purple-200">Rendez-vous dans Paramètres &gt; Sécurité & Licence pour activer votre clé.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tarifs;
