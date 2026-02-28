import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Zap } from 'lucide-react';
import { useInView } from '../../hooks/useInView';

const PricingSection: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const { ref, isInView } = useInView({ threshold: 0.1 });

  const plans = [
    {
      name: 'Starter',
      description: 'Idéal pour démarrer votre activité freelance',
      price: 'Gratuit',
      period: '',
      popular: false,
      features: [
        { text: 'Jusqu\'à 3 projets actifs', included: true },
        { text: 'Jusqu\'à 5 clients', included: true },
        { text: 'Factures & Devis PDF', included: true },
        { text: 'Timer de base', included: true },
        { text: 'Dashboard simplifié', included: true },
        { text: 'Projets illimités', included: false },
        { text: 'Exports Excel & CSV', included: false },
        { text: 'Comptabilité avancée', included: false },
        { text: 'Support prioritaire', included: false },
      ],
      cta: 'Commencer gratuitement',
      ctaStyle: 'border border-white/20 text-white hover:bg-white/10',
    },
    {
      name: 'Pro',
      description: 'Pour les freelances qui veulent tout débloquer',
      price: isAnnual ? '49 000' : '4 900',
      period: isAnnual ? '/an' : '/mois',
      popular: true,
      features: [
        { text: 'Projets illimités', included: true },
        { text: 'Clients illimités', included: true },
        { text: 'Factures & Devis PDF', included: true },
        { text: 'Timer avancé', included: true },
        { text: 'Dashboard complet', included: true },
        { text: 'Exports Excel & CSV', included: true },
        { text: 'Comptabilité avancée', included: true },
        { text: 'Agenda & Suivi projet', included: true },
        { text: 'Support prioritaire', included: true },
      ],
      cta: 'Passer au Pro',
      ctaStyle: 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90',
    },
  ];

  return (
    <section id="tarifs" className="relative py-20 sm:py-28">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-purple-400 font-semibold text-sm uppercase tracking-wider mb-3">
            Tarifs
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Tarifs simples et transparents
          </h2>
          <p className="text-lg text-white/50 max-w-xl mx-auto mb-8">
            Commencez gratuitement, passez au Pro quand vous êtes prêt.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-white' : 'text-white/40'}`}>
              Mensuel
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                isAnnual ? 'bg-purple-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform duration-300 ${
                  isAnnual ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-white' : 'text-white/40'}`}>
              Annuel
            </span>
            {isAnnual && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full font-medium">
                -17%
              </span>
            )}
          </div>
        </div>

        {/* Plans */}
        <div
          ref={ref}
          className={`grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 animate-on-scroll ${isInView ? 'in-view' : ''}`}
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative landing-glass rounded-2xl p-6 sm:p-8 ${
                plan.popular ? 'border-purple-500/50 ring-1 ring-purple-500/20' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    <Zap className="w-3.5 h-3.5" />
                    Populaire
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-white/40">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-bold text-white">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-white/40 text-lg">
                      FCFA{plan.period}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li
                    key={feature.text}
                    className="flex items-center gap-3"
                  >
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-white/20 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${feature.included ? 'text-white/80' : 'text-white/30'}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className={`block text-center font-semibold py-3.5 rounded-full transition-all ${plan.ctaStyle}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Payment methods */}
        <div className="text-center mt-12">
          <p className="text-sm text-white/30 mb-4">Moyens de paiement acceptés</p>
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
              <span className="text-xl">🌊</span>
              <span className="text-sm text-white/60 font-medium">Wave</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
              <span className="text-xl">📱</span>
              <span className="text-sm text-white/60 font-medium">Orange Money</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
              <span className="text-xl">💳</span>
              <span className="text-sm text-white/60 font-medium">YAS</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
