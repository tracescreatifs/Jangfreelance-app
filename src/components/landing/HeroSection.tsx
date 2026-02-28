import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Users, FileText, Wallet } from 'lucide-react';

const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-blue-500/15 rounded-full blur-[120px] animate-float-delayed" />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-cyan-500/10 rounded-full blur-[100px] animate-float-slow" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Disponible maintenant
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Gérez votre activité freelance{' '}
              <span className="gradient-text">en toute simplicité</span>
            </h1>

            <p className="text-lg sm:text-xl text-white/60 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              Factures, projets, clients, paiements Wave & Orange Money.
              L'outil tout-en-un conçu pour les freelances au Sénégal et en Côte d'Ivoire.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold px-8 py-4 rounded-full text-lg hover:opacity-90 transition-all animate-pulse-glow"
              >
                Commencer gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                onClick={() => document.getElementById('fonctionnalites')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center gap-2 text-white/70 hover:text-white font-medium px-8 py-4 rounded-full border border-white/20 hover:border-white/40 transition-all"
              >
                Découvrir les fonctionnalités
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-12 justify-center lg:justify-start">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">10+</p>
                <p className="text-sm text-white/50">Fonctionnalités</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">100%</p>
                <p className="text-sm text-white/50">Gratuit au démarrage</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">PWA</p>
                <p className="text-sm text-white/50">Mobile & Desktop</p>
              </div>
            </div>
          </div>

          {/* Right: Dashboard mockup */}
          <div className="relative hidden lg:block">
            <div className="relative">
              {/* Glow behind the card */}
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl blur-xl" />

              {/* Main card */}
              <div className="relative landing-glass rounded-2xl p-6 space-y-4">
                {/* Header bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">J</div>
                    <span className="text-white font-semibold">Dashboard</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                    <div className="w-3 h-3 rounded-full bg-green-400/60" />
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-white/50">Revenus</span>
                    </div>
                    <p className="text-xl font-bold text-white">2.4M</p>
                    <p className="text-xs text-green-400">+12% ce mois</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-white/50">Factures</span>
                    </div>
                    <p className="text-xl font-bold text-white">48</p>
                    <p className="text-xs text-green-400">8 ce mois</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs text-white/50">Clients</span>
                    </div>
                    <p className="text-xl font-bold text-white">24</p>
                    <p className="text-xs text-white/40">actifs</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-orange-400" />
                      <span className="text-xs text-white/50">Projets</span>
                    </div>
                    <p className="text-xl font-bold text-white">12</p>
                    <p className="text-xs text-white/40">en cours</p>
                  </div>
                </div>

                {/* Mini chart placeholder */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-xs text-white/50 mb-3">Revenus mensuels (FCFA)</p>
                  <div className="flex items-end gap-1.5 h-20">
                    {[40, 55, 35, 65, 50, 75, 60, 80, 70, 90, 85, 95].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-purple-500/60 to-blue-500/60 rounded-sm"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-white/30">
                    <span>Jan</span>
                    <span>Juin</span>
                    <span>Déc</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
