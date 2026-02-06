import React from 'react';
import { Download, Mail, Phone, Globe, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { useProfessionalProfile } from '../hooks/useProfessionalProfile';
import { useUserProfile } from '../hooks/useUserProfile';
import { exportInvoiceToPDF } from '../services/exportService';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  number: string;
  type: 'devis' | 'facture';
  title: string;
  subtitle?: string;
  clientName: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  createdAt: string;
  dueDate: string;
  fiscalRegime: string;
}

interface InvoicePDFProps {
  invoice: Invoice;
  onDownload?: () => void;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, onDownload }) => {
  const { profile: proProfile } = useProfessionalProfile();
  const { profile: userProfile } = useUserProfile();

  const handleDownloadPDF = () => {
    // Transformer les données pour le service d'export
    const invoiceForExport = {
      ...invoice,
      date: invoice.createdAt,
      notes: ''
    };

    const professionalProfile = {
      nomEntreprise: proProfile.nomCommercial || 'Mon Entreprise',
      secteurActivite: proProfile.secteurActivite || '',
      adresse: proProfile.adresseRue || '',
      codePostal: '',
      ville: proProfile.adresseVille || '',
      telephone: proProfile.telephoneBureau || '',
      emailPro: proProfile.emailProfessionnel || '',
      siret: proProfile.ninea || '',
      formeJuridique: proProfile.formeJuridique || ''
    };

    const userProfileForExport = {
      nom: `${userProfile.prenom || ''} ${userProfile.nom || ''}`.trim() || 'Votre nom'
    };

    exportInvoiceToPDF(invoiceForExport as any, professionalProfile, userProfileForExport);

    if (onDownload) {
      onDownload();
    }
  };

  const professionalInfo = {
    nomCommercial: proProfile.nomCommercial || 'Mon Entreprise',
    nomComplet: `${userProfile.prenom} ${userProfile.nom}`.trim() || 'Votre Nom',
    emailProfessionnel: proProfile.emailProfessionnel || userProfile.email || '',
    telephoneBureau: proProfile.telephoneBureau || userProfile.telephone || '',
    adresseComplete: [proProfile.adresseRue, proProfile.adresseVille, proProfile.adressePays]
      .filter(Boolean).join(', ') || '',
    siteWeb: proProfile.siteWeb || '',
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const fiscalRegimes: Record<string, { rate: number; name: string }> = {
    'BRS': { rate: 5, name: 'BRS 5%' },
    'TVA': { rate: 18, name: 'TVA 18%' },
    'Exoneré': { rate: 0, name: 'Exonéré' }
  };

  return (
    <div className="glass-morphism p-6 sm:p-8 rounded-2xl max-w-4xl mx-auto">
      {/* Header - entreprise et document côte à côte */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 pb-4 border-b border-white/20">
        {/* Informations entreprise */}
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold">{professionalInfo.nomCommercial}</h1>
          <div className="opacity-80 text-sm space-y-1">
            <p className="font-medium">{professionalInfo.nomComplet}</p>
            {professionalInfo.emailProfessionnel && (
              <div className="flex items-center"><Mail className="w-4 h-4 mr-2 opacity-70" /><span className="opacity-70">{professionalInfo.emailProfessionnel}</span></div>
            )}
            {professionalInfo.telephoneBureau && (
              <div className="flex items-center"><Phone className="w-4 h-4 mr-2 opacity-70" /><span className="opacity-70">{professionalInfo.telephoneBureau}</span></div>
            )}
            {professionalInfo.siteWeb && (
              <div className="flex items-center"><Globe className="w-4 h-4 mr-2 opacity-70" /><span className="opacity-70">{professionalInfo.siteWeb}</span></div>
            )}
            {professionalInfo.adresseComplete && (
              <div className="flex items-center"><MapPin className="w-4 h-4 mr-2 opacity-70" /><span className="opacity-70">{professionalInfo.adresseComplete}</span></div>
            )}
          </div>
        </div>

        {/* Informations document */}
        <div className="text-right space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold opacity-80">
            {invoice.type.toUpperCase()} N° {invoice.number}
          </h2>
          <div className="opacity-70 text-sm space-y-0.5">
            <p>Date: {new Date(invoice.createdAt).toLocaleDateString('fr-FR')}</p>
            {invoice.dueDate && <p>Échéance: {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</p>}
          </div>

          {/* Mentions légales */}
          <div className="text-xs opacity-60 mt-4 pt-2 border-t border-white/10">
            <p>Régime: {proProfile.formeJuridique || 'Non renseigné'}</p>
            <p>Secteur: {proProfile.secteurActivite || 'Non renseigné'}</p>
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div className="mb-6">
        <h3 className="text-base font-bold mb-2">
          {invoice.type === 'facture' ? 'Facturé à:' : 'Client:'}
        </h3>
        <div className="bg-white/5 p-3 rounded-lg">
          <p className="font-medium">{invoice.clientName}</p>
        </div>
      </div>

      {/* Invoice Title */}
      <div className="mb-6 bg-white/5 p-4 rounded-lg">
        <h2 className="text-lg sm:text-xl font-bold mb-1">{invoice.title}</h2>
        {invoice.subtitle && <p className="opacity-70">{invoice.subtitle}</p>}
      </div>

      {/* Items Table */}
      <div className="mb-6">
        <div className="bg-white/5 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-white/10">
                <tr>
                  <th className="text-left py-3 px-4 opacity-70 font-medium text-sm">Description</th>
                  <th className="text-center py-3 px-2 opacity-70 font-medium text-sm">Qté</th>
                  <th className="text-right py-3 px-4 opacity-70 font-medium text-sm">Prix unitaire</th>
                  <th className="text-right py-3 px-4 opacity-70 font-medium text-sm">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={item.id} className={`border-b border-white/10 ${index % 2 === 0 ? 'bg-white/5' : ''}`}>
                    <td className="py-3 px-4 text-sm">{item.description}</td>
                    <td className="py-3 px-2 text-center text-sm">{item.quantity}</td>
                    <td className="py-3 px-4 text-right text-sm">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 px-4 text-right font-medium text-sm">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="bg-white/10 p-4 rounded-lg w-full sm:w-80 border border-white/20">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="opacity-70">Sous-total HT:</span>
              <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="opacity-70">{fiscalRegimes[invoice.fiscalRegime]?.name || invoice.fiscalRegime || 'Taxe'}:</span>
              <span className="font-medium">{formatCurrency(invoice.taxAmount)}</span>
            </div>
            <div className="border-t border-white/20 pt-2">
              <div className="flex justify-between">
                <span className="font-bold text-lg">Total TTC:</span>
                <span className="font-bold text-lg">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/20 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-bold mb-2">Conditions de paiement:</h4>
            <div className="opacity-70 space-y-1">
              <p>• Paiement à 30 jours</p>
              <p>• Retard: pénalités 3%/mois</p>
              <p>• Escompte 2% si paiement à 8 jours</p>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-2">Contact:</h4>
            <div className="opacity-70 space-y-1">
              {professionalInfo.emailProfessionnel && <p>{professionalInfo.emailProfessionnel}</p>}
              {professionalInfo.telephoneBureau && <p>{professionalInfo.telephoneBureau}</p>}
              {professionalInfo.siteWeb && <p>{professionalInfo.siteWeb}</p>}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 text-center">
          <p className="opacity-60 text-sm">
            Merci de votre confiance - {professionalInfo.nomCommercial}
          </p>
        </div>
      </div>

      {/* Download Button */}
      <div className="flex justify-center mt-6">
        <Button
          onClick={handleDownloadPDF}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-105 transition-transform"
        >
          <Download className="w-5 h-5 mr-2" />
          Télécharger PDF
        </Button>
      </div>
    </div>
  );
};

export default InvoicePDF;
