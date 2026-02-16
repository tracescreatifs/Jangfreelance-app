import React from 'react';
import { Download, Mail, Phone, Globe, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { useProfessionalProfile } from '../hooks/useProfessionalProfile';
import { useUserProfile } from '../hooks/useUserProfile';
import { useFiscalConfig } from '../hooks/useFiscalConfig';
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
  const { config: fiscalConfig } = useFiscalConfig();

  const handleDownloadPDF = () => {
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
      siret: fiscalConfig.ninea || '',
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
    ninea: fiscalConfig.ninea || '',
    formeJuridique: proProfile.formeJuridique || '',
    secteurActivite: proProfile.secteurActivite || '',
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-white text-gray-900 p-6 sm:p-10 rounded-xl max-w-4xl mx-auto shadow-lg">

      {/* ---- EN-TÊTE ---- */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-200">
        {/* Entreprise */}
        <div className="flex items-center gap-4">
          {proProfile.logoUrl && (
            <img
              src={proProfile.logoUrl}
              alt="Logo"
              className="w-16 h-16 object-contain rounded"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{professionalInfo.nomCommercial}</h1>
            {professionalInfo.secteurActivite && (
              <p className="text-sm text-gray-400 mt-1">{professionalInfo.secteurActivite}</p>
            )}
          </div>
        </div>

        {/* Type + Numéro */}
        <div className="text-right">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            {invoice.type === 'facture' ? 'FACTURE' : 'DEVIS'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">N° {invoice.number}</p>
        </div>
      </div>

      {/* ---- ÉMETTEUR / CLIENT ---- */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Émetteur */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">De</p>
          <p className="font-semibold text-gray-900">{professionalInfo.nomComplet}</p>
          <div className="text-sm text-gray-500 mt-1 space-y-0.5">
            {professionalInfo.emailProfessionnel && (
              <p>{professionalInfo.emailProfessionnel}</p>
            )}
            {professionalInfo.telephoneBureau && (
              <p>{professionalInfo.telephoneBureau}</p>
            )}
            {professionalInfo.adresseComplete && (
              <p>{professionalInfo.adresseComplete}</p>
            )}
            {professionalInfo.ninea && (
              <p className="text-gray-400">NINEA: {professionalInfo.ninea}</p>
            )}
          </div>
        </div>

        {/* Client */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pour</p>
          <p className="font-semibold text-gray-900">{invoice.clientName}</p>
          <div className="text-sm text-gray-500 mt-2 space-y-0.5">
            <p>Date: {new Date(invoice.createdAt).toLocaleDateString('fr-FR')}</p>
            {invoice.dueDate && (
              <p>Échéance: {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</p>
            )}
          </div>
        </div>
      </div>

      {/* ---- OBJET ---- */}
      <div className="mb-6">
        <p className="text-sm">
          <span className="font-bold text-gray-900">Objet : </span>
          <span className="text-gray-700">{invoice.title}</span>
        </p>
        {invoice.subtitle && (
          <p className="text-sm text-gray-500 mt-1">{invoice.subtitle}</p>
        )}
      </div>

      {/* ---- TABLEAU ---- */}
      <div className="mb-8 rounded-lg overflow-hidden border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="text-left py-3 px-4 text-sm font-medium">Description</th>
              <th className="text-center py-3 px-3 text-sm font-medium w-16">Qté</th>
              <th className="text-right py-3 px-4 text-sm font-medium w-32">Prix unitaire</th>
              <th className="text-right py-3 px-4 text-sm font-medium w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr
                key={item.id}
                className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
              >
                <td className="py-3 px-4 text-sm text-gray-800">{item.description}</td>
                <td className="py-3 px-3 text-center text-sm text-gray-600">{item.quantity}</td>
                <td className="py-3 px-4 text-right text-sm text-gray-600">{formatCurrency(item.unitPrice)}</td>
                <td className="py-3 px-4 text-right text-sm font-semibold text-gray-900">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---- TOTAUX ---- */}
      <div className="flex justify-end mb-8">
        <div className="w-72">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Sous-total HT</span>
              <span className="text-gray-800">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>{invoice.taxRate > 0 ? `TVA (${invoice.taxRate}%)` : 'TVA (0%)'}</span>
              <span className="text-gray-800">{formatCurrency(invoice.taxAmount)}</span>
            </div>
            <div className="border-t-2 border-gray-900 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-lg font-bold text-gray-900">TOTAL TTC</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- CONDITIONS ---- */}
      <div className="border-t border-gray-200 pt-6 mb-6">
        <div className="grid grid-cols-2 gap-6 text-xs text-gray-400">
          <div>
            <p className="font-bold text-gray-500 mb-1.5 uppercase tracking-wider text-[10px]">Conditions</p>
            {invoice.type === 'facture' ? (
              <>
                <p>• Paiement à 30 jours</p>
                <p>• Retard : pénalités 3%/mois</p>
                <p>• Escompte 2% si paiement à 8 jours</p>
              </>
            ) : (
              <>
                <p>• Devis valable 30 jours</p>
                <p>• Retourner signé avec mention "Bon pour accord"</p>
              </>
            )}
          </div>
          <div>
            <p className="font-bold text-gray-500 mb-1.5 uppercase tracking-wider text-[10px]">Contact</p>
            {professionalInfo.emailProfessionnel && <p>{professionalInfo.emailProfessionnel}</p>}
            {professionalInfo.telephoneBureau && <p>{professionalInfo.telephoneBureau}</p>}
            {professionalInfo.siteWeb && <p>{professionalInfo.siteWeb}</p>}
          </div>
        </div>
      </div>

      {/* ---- PIED DE PAGE ---- */}
      <div className="text-center border-t border-gray-100 pt-4">
        <p className="text-[10px] text-gray-300">
          {[professionalInfo.nomCommercial, professionalInfo.formeJuridique, professionalInfo.ninea ? `NINEA: ${professionalInfo.ninea}` : null]
            .filter(Boolean).join('  ·  ')}
        </p>
      </div>

      {/* ---- BOUTON TÉLÉCHARGER ---- */}
      <div className="flex justify-center mt-6">
        <Button
          onClick={handleDownloadPDF}
          className="bg-gray-900 text-white hover:bg-gray-800 hover:scale-105 transition-transform"
        >
          <Download className="w-5 h-5 mr-2" />
          Télécharger PDF
        </Button>
      </div>
    </div>
  );
};

export default InvoicePDF;
