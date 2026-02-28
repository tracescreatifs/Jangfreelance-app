import React from 'react';
import { Link } from 'react-router-dom';
import { APP_VERSION } from '../../lib/version';

const FooterSection: React.FC = () => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                J
              </div>
              <span className="text-xl font-bold text-white">Jang</span>
            </div>
            <p className="text-sm text-white/40 leading-relaxed max-w-xs">
              L'outil de gestion tout-en-un conçu pour les freelances au Sénégal et en Côte d'Ivoire.
              Factures, projets, clients et paiements mobile money.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  onClick={() => scrollTo('fonctionnalites')}
                  className="text-sm text-white/40 hover:text-white/80 transition-colors"
                >
                  Fonctionnalités
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('tarifs')}
                  className="text-sm text-white/40 hover:text-white/80 transition-colors"
                >
                  Tarifs
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('temoignages')}
                  className="text-sm text-white/40 hover:text-white/80 transition-colors"
                >
                  Témoignages
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('faq')}
                  className="text-sm text-white/40 hover:text-white/80 transition-colors"
                >
                  FAQ
                </button>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-sm text-white/40 hover:text-white/80 transition-colors"
                >
                  Connexion
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-sm text-white/40 hover:text-white/80 transition-colors"
                >
                  Inscription
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Contact
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="mailto:contact@jang.sn"
                  className="text-sm text-white/40 hover:text-white/80 transition-colors"
                >
                  contact@jang.sn
                </a>
              </li>
              <li className="text-sm text-white/40">
                Dakar, Sénégal
              </li>
            </ul>

            {/* Payment badges */}
            <div className="mt-6">
              <p className="text-xs text-white/20 mb-2">Paiements sécurisés</p>
              <div className="flex gap-2">
                <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-xs text-white/40">
                  Wave
                </span>
                <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-xs text-white/40">
                  Orange Money
                </span>
                <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-xs text-white/40">
                  YAS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/20">
            © {new Date().getFullYear()} Jang. Tous droits réservés.
          </p>
          <p className="text-xs text-white/20">
            Version {APP_VERSION}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
