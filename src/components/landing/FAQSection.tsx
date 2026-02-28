import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { useInView } from '../../hooks/useInView';

const faqItems = [
  {
    question: 'Jang est-il vraiment gratuit ?',
    answer:
      'Oui ! Le plan Starter est 100% gratuit avec jusqu\'à 3 projets actifs et 5 clients. Vous pouvez créer des factures, devis et utiliser le timer sans aucun engagement. Le plan Pro débloque les fonctionnalités avancées comme les projets illimités, la comptabilité et les exports.',
  },
  {
    question: 'Quels moyens de paiement acceptez-vous ?',
    answer:
      'Nous acceptons Wave, Orange Money et YAS pour le paiement de l\'abonnement Pro. Ces moyens de paiement sont intégrés via PayDunya pour une expérience fluide et sécurisée, adaptée à l\'Afrique de l\'Ouest.',
  },
  {
    question: 'Puis-je changer de plan à tout moment ?',
    answer:
      'Absolument ! Vous pouvez passer du plan Starter au plan Pro à tout moment. Si vous êtes sur le plan annuel, vous bénéficiez d\'une réduction de 17%. Votre historique et vos données sont toujours conservés.',
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer:
      'Oui, la sécurité est notre priorité. Vos données sont hébergées sur Supabase avec chiffrement SSL, authentification sécurisée et sauvegardes régulières. Nous ne partageons jamais vos données avec des tiers.',
  },
  {
    question: 'Jang fonctionne-t-il sur mobile ?',
    answer:
      'Oui ! Jang est une Progressive Web App (PWA) installable sur votre téléphone comme une application native. Elle fonctionne sur Android, iPhone, tablette et ordinateur avec une interface responsive optimisée.',
  },
  {
    question: 'Puis-je annuler mon abonnement ?',
    answer:
      'Oui, vous pouvez annuler votre abonnement Pro à tout moment depuis les paramètres. Vous garderez l\'accès aux fonctionnalités Pro jusqu\'à la fin de votre période de facturation, puis vous passerez automatiquement au plan Starter.',
  },
];

const FAQSection: React.FC = () => {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <section id="faq" className="relative py-20 sm:py-28">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-purple-400 font-semibold text-sm uppercase tracking-wider mb-3">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Questions fréquentes
          </h2>
          <p className="text-lg text-white/50">
            Tout ce que vous devez savoir sur Jang.
          </p>
        </div>

        {/* Accordion */}
        <div
          ref={ref}
          className={`animate-on-scroll ${isInView ? 'in-view' : ''}`}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="landing-glass rounded-xl px-6 border-none"
              >
                <AccordionTrigger className="text-left text-white hover:no-underline py-5 text-base font-medium">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-white/50 text-sm leading-relaxed pb-5">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
