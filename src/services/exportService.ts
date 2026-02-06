import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Invoice } from '../hooks/useInvoices';
import { ClientLegacy } from '../hooks/useClients';
import { Transaction } from '../hooks/useTransactions';

// Types pour jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: { finalY: number };
  }
}

// Formater les montants en XOF
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(amount);
};

// Formater les dates
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// ============================================
// EXPORT PDF - FACTURE INDIVIDUELLE
// ============================================
export const exportInvoiceToPDF = (
  invoice: Invoice,
  professionalProfile: any,
  userProfile: any
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // En-tête avec logo/nom de l'entreprise
  doc.setFontSize(24);
  doc.setTextColor(100, 50, 150);
  doc.text(professionalProfile?.nomEntreprise || 'Mon Entreprise', 20, 25);

  // Sous-titre
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(professionalProfile?.secteurActivite || '', 20, 32);

  // Type de document (FACTURE ou DEVIS)
  doc.setFontSize(28);
  doc.setTextColor(50, 50, 50);
  const docType = invoice.type === 'facture' ? 'FACTURE' : 'DEVIS';
  doc.text(docType, pageWidth - 20, 25, { align: 'right' });

  // Numéro
  doc.setFontSize(12);
  doc.text(`N° ${invoice.number}`, pageWidth - 20, 35, { align: 'right' });

  // Ligne de séparation
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 45, pageWidth - 20, 45);

  // Informations de l'émetteur (gauche)
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('DE:', 20, 55);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.text(userProfile?.nom || 'Votre nom', 20, 62);
  doc.setFontSize(9);
  doc.text(professionalProfile?.adresse || '', 20, 68);
  doc.text(`${professionalProfile?.codePostal || ''} ${professionalProfile?.ville || ''}`, 20, 74);
  doc.text(professionalProfile?.telephone || '', 20, 80);
  doc.text(professionalProfile?.emailPro || '', 20, 86);

  // SIRET / NINEA
  if (professionalProfile?.siret) {
    doc.text(`NINEA: ${professionalProfile.siret}`, 20, 92);
  }

  // Informations du client (droite)
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('POUR:', pageWidth - 80, 55);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.text(invoice.clientName, pageWidth - 80, 62);

  // Dates
  doc.setFontSize(10);
  doc.text(`Date: ${formatDate(invoice.date)}`, pageWidth - 80, 75);
  if (invoice.dueDate) {
    doc.text(`Échéance: ${formatDate(invoice.dueDate)}`, pageWidth - 80, 82);
  }

  // Titre du projet
  doc.setFontSize(12);
  doc.setTextColor(100, 50, 150);
  doc.text(`Objet: ${invoice.title}`, 20, 110);

  // Tableau des articles
  const tableData = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unitPrice),
    formatCurrency(item.total)
  ]);

  autoTable(doc, {
    startY: 120,
    head: [['Description', 'Qté', 'Prix unitaire', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [100, 50, 150],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 5
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' }
    }
  });

  // Totaux
  const finalY = doc.lastAutoTable.finalY + 10;

  // Sous-total
  doc.setFontSize(10);
  doc.text('Sous-total HT:', pageWidth - 80, finalY);
  doc.text(formatCurrency(invoice.subtotal), pageWidth - 20, finalY, { align: 'right' });

  // TVA
  doc.text(`TVA (${invoice.taxRate}%):`, pageWidth - 80, finalY + 7);
  doc.text(formatCurrency(invoice.taxAmount), pageWidth - 20, finalY + 7, { align: 'right' });

  // Total TTC
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 50, 150);
  doc.text('TOTAL TTC:', pageWidth - 80, finalY + 20);
  doc.text(formatCurrency(invoice.total), pageWidth - 20, finalY + 20, { align: 'right' });

  // Conditions de paiement
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const paymentNote = invoice.type === 'facture'
    ? 'Paiement attendu sous 30 jours. Merci pour votre confiance.'
    : 'Ce devis est valable 30 jours. Merci de votre confiance.';
  doc.text(paymentNote, 20, finalY + 40);

  // Notes
  if (invoice.notes) {
    doc.text(`Notes: ${invoice.notes}`, 20, finalY + 50);
  }

  // Pied de page
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `${professionalProfile?.nomEntreprise || ''} - ${professionalProfile?.formeJuridique || ''} - NINEA: ${professionalProfile?.siret || 'N/A'}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  // Sauvegarder
  doc.save(`${invoice.type}_${invoice.number}.pdf`);
};

// ============================================
// EXPORT PDF - RAPPORT FINANCIER
// ============================================
export const exportFinancialReportToPDF = (
  transactions: Transaction[],
  invoices: Invoice[],
  period: string,
  professionalProfile: any
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Titre
  doc.setFontSize(22);
  doc.setTextColor(100, 50, 150);
  doc.text('RAPPORT FINANCIER', pageWidth / 2, 25, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(professionalProfile?.nomEntreprise || 'Mon Entreprise', pageWidth / 2, 35, { align: 'center' });
  doc.text(`Période: ${period}`, pageWidth / 2, 42, { align: 'center' });

  // Calculs
  const totalRecettes = transactions
    .filter(t => t.type === 'recette')
    .reduce((sum, t) => sum + t.montant, 0);

  const totalDepenses = transactions
    .filter(t => t.type === 'depense')
    .reduce((sum, t) => sum + t.montant, 0);

  const benefice = totalRecettes - totalDepenses;

  const facturesPaid = invoices.filter(i => i.status === 'Payé');
  const facturesEnAttente = invoices.filter(i => i.status === 'Envoyé');

  // Résumé financier
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Résumé Financier', 20, 60);

  doc.setDrawColor(200, 200, 200);
  doc.line(20, 63, pageWidth - 20, 63);

  // Tableau résumé
  autoTable(doc, {
    startY: 70,
    head: [['Indicateur', 'Montant']],
    body: [
      ['Total Recettes', formatCurrency(totalRecettes)],
      ['Total Dépenses', formatCurrency(totalDepenses)],
      ['Bénéfice Net', formatCurrency(benefice)],
      ['Factures Payées', `${facturesPaid.length} (${formatCurrency(facturesPaid.reduce((s, f) => s + f.total, 0))})`],
      ['Factures En Attente', `${facturesEnAttente.length} (${formatCurrency(facturesEnAttente.reduce((s, f) => s + f.total, 0))})`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [100, 50, 150] },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 70, halign: 'right' }
    }
  });

  // Détail des transactions
  const finalY = doc.lastAutoTable.finalY + 20;

  doc.setFontSize(14);
  doc.text('Détail des Transactions', 20, finalY);
  doc.line(20, finalY + 3, pageWidth - 20, finalY + 3);

  const transactionData = transactions.slice(0, 20).map(t => [
    formatDate(t.date),
    t.description,
    t.categorie,
    t.type === 'recette' ? formatCurrency(t.montant) : '',
    t.type === 'depense' ? formatCurrency(t.montant) : ''
  ]);

  autoTable(doc, {
    startY: finalY + 10,
    head: [['Date', 'Description', 'Catégorie', 'Recette', 'Dépense']],
    body: transactionData,
    theme: 'striped',
    headStyles: { fillColor: [100, 50, 150] },
    styles: { fontSize: 8 }
  });

  // Date de génération
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  doc.save(`rapport_financier_${period.replace(/\s/g, '_')}.pdf`);
};

// ============================================
// EXPORT EXCEL - CLIENTS
// ============================================
export const exportClientsToExcel = (clients: ClientLegacy[]): void => {
  const data = clients.map(client => ({
    'Nom': client.name,
    'Email': client.email,
    'Téléphone': client.phone,
    'Entreprise': client.company,
    'Adresse': client.address,
    'Ville': client.city,
    'Type': client.type,
    'Statut': client.status,
    'Nombre de Projets': client.projects,
    'CA Total (XOF)': client.totalRevenue,
    'Notes': client.notes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');

  // Ajuster la largeur des colonnes
  const colWidths = [
    { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 25 },
    { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 10 },
    { wch: 15 }, { wch: 15 }, { wch: 30 }
  ];
  worksheet['!cols'] = colWidths;

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `clients_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// ============================================
// EXPORT EXCEL - PROJETS
// ============================================
export const exportProjectsToExcel = (projects: any[]): void => {
  const data = projects.map(project => ({
    'Nom du Projet': project.name,
    'Client': project.clientName,
    'Description': project.description || '',
    'Statut': project.status,
    'Priorité': project.priority,
    'Budget (XOF)': project.budget,
    'Dépensé (XOF)': project.spent,
    'Progression (%)': project.progress,
    'Date Échéance': formatDate(project.deadline),
    'Date Création': project.createdAt ? formatDate(project.createdAt) : ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Projets');

  worksheet['!cols'] = [
    { wch: 30 }, { wch: 25 }, { wch: 40 }, { wch: 12 },
    { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
    { wch: 15 }, { wch: 15 }
  ];

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `projets_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// ============================================
// EXPORT EXCEL - FACTURES
// ============================================
export const exportInvoicesToExcel = (invoices: Invoice[]): void => {
  const data = invoices.map(invoice => ({
    'Numéro': invoice.number,
    'Type': invoice.type === 'facture' ? 'Facture' : 'Devis',
    'Titre': invoice.title,
    'Client': invoice.clientName,
    'Statut': invoice.status,
    'Date': formatDate(invoice.date),
    'Échéance': invoice.dueDate ? formatDate(invoice.dueDate) : '',
    'Sous-total HT (XOF)': invoice.subtotal,
    'TVA (%)': invoice.taxRate,
    'Montant TVA (XOF)': invoice.taxAmount,
    'Total TTC (XOF)': invoice.total,
    'Notes': invoice.notes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Factures');

  worksheet['!cols'] = [
    { wch: 15 }, { wch: 10 }, { wch: 30 }, { wch: 25 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
    { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 30 }
  ];

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `factures_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// ============================================
// EXPORT EXCEL - TRANSACTIONS
// ============================================
export const exportTransactionsToExcel = (transactions: Transaction[]): void => {
  const data = transactions.map(t => ({
    'Date': formatDate(t.date),
    'Description': t.description,
    'Catégorie': t.categorie,
    'Type': t.type === 'recette' ? 'Recette' : 'Dépense',
    'Montant (XOF)': t.montant,
    'N° Facture': t.facture || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

  worksheet['!cols'] = [
    { wch: 12 }, { wch: 40 }, { wch: 20 },
    { wch: 10 }, { wch: 15 }, { wch: 15 }
  ];

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// ============================================
// EXPORT CSV - GÉNÉRIQUE
// ============================================
export const exportToCSV = (data: any[], filename: string): void => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `${filename}.csv`);
};

// ============================================
// EXPORT EXCEL - RAPPORT COMPLET
// ============================================
export const exportFullReportToExcel = (
  clients: ClientLegacy[],
  projects: any[],
  invoices: Invoice[],
  transactions: Transaction[]
): void => {
  const workbook = XLSX.utils.book_new();

  // Feuille Résumé
  const summaryData = [
    { 'Indicateur': 'Nombre de Clients', 'Valeur': clients.length },
    { 'Indicateur': 'Clients Actifs', 'Valeur': clients.filter(c => c.status === 'Actif').length },
    { 'Indicateur': 'Nombre de Projets', 'Valeur': projects.length },
    { 'Indicateur': 'Projets en Cours', 'Valeur': projects.filter(p => p.status === 'En cours').length },
    { 'Indicateur': 'Nombre de Factures', 'Valeur': invoices.filter(i => i.type === 'facture').length },
    { 'Indicateur': 'Nombre de Devis', 'Valeur': invoices.filter(i => i.type === 'devis').length },
    { 'Indicateur': 'Total Recettes (XOF)', 'Valeur': transactions.filter(t => t.type === 'recette').reduce((s, t) => s + t.montant, 0) },
    { 'Indicateur': 'Total Dépenses (XOF)', 'Valeur': transactions.filter(t => t.type === 'depense').reduce((s, t) => s + t.montant, 0) },
    { 'Indicateur': 'CA Clients (XOF)', 'Valeur': clients.reduce((s, c) => s + c.totalRevenue, 0) }
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé');

  // Feuille Clients
  const clientsData = clients.map(c => ({
    'Nom': c.name,
    'Email': c.email,
    'Téléphone': c.phone,
    'Entreprise': c.company,
    'Statut': c.status,
    'Projets': c.projects,
    'CA (XOF)': c.totalRevenue
  }));
  const clientsSheet = XLSX.utils.json_to_sheet(clientsData);
  XLSX.utils.book_append_sheet(workbook, clientsSheet, 'Clients');

  // Feuille Projets
  const projectsData = projects.map(p => ({
    'Nom': p.name,
    'Client': p.clientName,
    'Statut': p.status,
    'Budget (XOF)': p.budget,
    'Progression': `${p.progress}%`
  }));
  const projectsSheet = XLSX.utils.json_to_sheet(projectsData);
  XLSX.utils.book_append_sheet(workbook, projectsSheet, 'Projets');

  // Feuille Factures
  const invoicesData = invoices.map(i => ({
    'Numéro': i.number,
    'Type': i.type,
    'Client': i.clientName,
    'Statut': i.status,
    'Total (XOF)': i.total
  }));
  const invoicesSheet = XLSX.utils.json_to_sheet(invoicesData);
  XLSX.utils.book_append_sheet(workbook, invoicesSheet, 'Factures');

  // Feuille Transactions
  const transactionsData = transactions.map(t => ({
    'Date': formatDate(t.date),
    'Description': t.description,
    'Type': t.type,
    'Montant (XOF)': t.montant
  }));
  const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData);
  XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `rapport_complet_${new Date().toISOString().split('T')[0]}.xlsx`);
};
