import React from 'react';
import { Star } from 'lucide-react';
import { useInView } from '../../hooks/useInView';

const testimonials = [
  {
    name: 'Aminata D.',
    role: 'Designer Graphique',
    location: 'Dakar, Sénégal',
    quote: 'Jang a complètement transformé la gestion de mon activité freelance. Les factures sont pro, le suivi des projets est clair, et les paiements Wave sont un vrai plus !',
    initials: 'AD',
    gradient: 'from-purple-500 to-indigo-500',
  },
  {
    name: 'Koffi M.',
    role: 'Développeur Web',
    location: 'Abidjan, Côte d\'Ivoire',
    quote: 'Enfin un outil pensé pour nous, les freelances en Afrique de l\'Ouest. Le NINEA, la TVA OHADA, Orange Money... tout est intégré. Je recommande à 100%.',
    initials: 'KM',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Fatou S.',
    role: 'Consultante Marketing',
    location: 'Dakar, Sénégal',
    quote: 'Je gagnais un temps fou grâce au timer et aux exports automatiques. Mon comptable adore les rapports générés par Jang. Simple, efficace, indispensable.',
    initials: 'FS',
    gradient: 'from-cyan-500 to-teal-500',
  },
];

const TestimonialsSection: React.FC = () => {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <section id="temoignages" className="relative py-20 sm:py-28">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-purple-400 font-semibold text-sm uppercase tracking-wider mb-3">
            Témoignages
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Ils nous font confiance
          </h2>
          <p className="text-lg text-white/50 max-w-xl mx-auto">
            Découvrez ce que nos utilisateurs disent de Jang.
          </p>
        </div>

        {/* Cards */}
        <div
          ref={ref}
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children ${isInView ? 'in-view' : ''}`}
        >
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="landing-glass rounded-2xl p-6 sm:p-8 flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-white/70 text-sm leading-relaxed flex-1 mb-6">
                "{t.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold text-sm`}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-white/40 text-xs">{t.role} · {t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
