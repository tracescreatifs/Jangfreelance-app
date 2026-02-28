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
// EXPORT PDF - FACTURE / DEVIS — DESIGN IDENTIQUE À L'APERÇU
// ============================================
export const exportInvoiceToPDF = (
  invoice: Invoice,
  professionalProfile: any,
  userProfile: any,
  logoDataUrl?: string
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // ---- COULEURS (identiques à l'aperçu plateforme) ----
  const black: [number, number, number] = [20, 20, 20];
  const darkGray: [number, number, number] = [60, 60, 60];
  const mediumGray: [number, number, number] = [120, 120, 120];
  const lightGray: [number, number, number] = [200, 200, 200];
  const tableHeaderBg: [number, number, number] = [20, 20, 20];
  const altRowBg: [number, number, number] = [249, 250, 251];

  // ---- EN-TÊTE ----
  let headerLeftX = margin;

  // Logo (si disponible)
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', margin, 14, 16, 16);
      headerLeftX = margin + 20;
    } catch {
      // Si le logo échoue, on continue sans
    }
  }

  // Nom entreprise
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.text(professionalProfile?.nomEntreprise || 'Mon Entreprise', headerLeftX, 24);

  // Secteur (sous le nom)
  if (professionalProfile?.secteurActivite) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mediumGray);
    doc.text(professionalProfile.secteurActivite, headerLeftX, 31);
  }

  // Type document (droite)
  const docType = invoice.type === 'facture' ? 'FACTURE' : 'DEVIS';
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.text(docType, pageWidth - margin, 24, { align: 'right' });

  // Numéro
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mediumGray);
  doc.text(`N\u00b0 ${invoice.number}`, pageWidth - margin, 32, { align: 'right' });

  // Ligne de s\u00e9paration
  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.8);
  doc.line(margin, 38, pageWidth - margin, 38);

  // ---- \u00c9METTEUR / CLIENT ----
  let yPos = 48;
  const rightColX = pageWidth / 2 + 10;

  // \u00c9metteur (gauche)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...mediumGray);
  doc.text('DE', margin, yPos);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.text(userProfile?.nom || 'Votre nom', margin, yPos + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  let emitterY = yPos + 14;
  if (professionalProfile?.emailPro) {
    doc.text(professionalProfile.emailPro, margin, emitterY);
    emitterY += 5;
  }
  if (professionalProfile?.telephone) {
    doc.text(professionalProfile.telephone, margin, emitterY);
    emitterY += 5;
  }
  if (professionalProfile?.adresse) {
    const fullAddr = [professionalProfile.adresse, professionalProfile.codePostal, professionalProfile.ville]
      .filter(Boolean).join(', ');
    doc.text(fullAddr, margin, emitterY);
    emitterY += 5;
  }
  if (professionalProfile?.siret) {
    doc.setTextColor(...mediumGray);
    doc.setFontSize(8);
    doc.text(`NINEA: ${professionalProfile.siret}`, margin, emitterY);
  }

  // Client (droite)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...mediumGray);
  doc.text('POUR', rightColX, yPos);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.text(invoice.clientName, rightColX, yPos + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.text(`Date: ${formatDate(invoice.date)}`, rightColX, yPos + 16);
  if (invoice.dueDate) {
    doc.text(`\u00c9ch\u00e9ance: ${formatDate(invoice.dueDate)}`, rightColX, yPos + 22);
  }

  // ---- OBJET ----
  yPos = 96;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.text('Objet :', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.text(invoice.title, margin + 19, yPos);
  if (invoice.subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(...mediumGray);
    doc.text(invoice.subtitle, margin, yPos + 6);
    yPos += 6;
  }

  // ---- TABLEAU DES PRESTATIONS (identique à l'aperçu) ----
  const tableData = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unitPrice),
    formatCurrency(item.total)
  ]);

  const tableWidth = pageWidth - margin * 2;

  autoTable(doc, {
    startY: yPos + 8,
    head: [['Description', 'Qté', 'Prix unitaire', 'Total']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: tableHeaderBg,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 5, bottom: 5, left: 6, right: 6 },
      halign: 'left',
      lineWidth: 0
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: { top: 5, bottom: 5, left: 6, right: 6 },
      textColor: [60, 60, 60],
      lineWidth: 0
    },
    alternateRowStyles: {
      fillColor: altRowBg
    },
    columnStyles: {
      0: { cellWidth: tableWidth * 0.46, halign: 'left', textColor: [40, 40, 40] },
      1: { cellWidth: tableWidth * 0.10, halign: 'center', textColor: [100, 100, 100] },
      2: { cellWidth: tableWidth * 0.22, halign: 'right', textColor: [100, 100, 100] },
      3: { cellWidth: tableWidth * 0.22, halign: 'right', fontStyle: 'bold', textColor: [20, 20, 20] }
    },
    styles: {
      lineWidth: 0,
      overflow: 'linebreak'
    },
    // Bordures horizontales subtiles entre les lignes (comme l'aperçu)
    didDrawCell: (data: any) => {
      // Ligne sous chaque ligne du body (sauf alternateRow qui a déjà un fond)
      if (data.section === 'body') {
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.3);
        doc.line(
          data.cell.x,
          data.cell.y + data.cell.height,
          data.cell.x + data.cell.width,
          data.cell.y + data.cell.height
        );
      }
    },
    // Bordure extérieure autour du tableau
    didDrawPage: (data: any) => {
      const table = data.table;
      if (table) {
        doc.setDrawColor(210, 210, 210);
        doc.setLineWidth(0.4);
        // Cadre extérieur
        doc.rect(
          margin,
          table.startY,
          tableWidth,
          table.finalY - table.startY
        );
      }
    },
    margin: { left: margin, right: margin }
  });

  // ---- TOTAUX ----
  const finalY = doc.lastAutoTable.finalY + 10;
  const totalsX = pageWidth - margin - 85;
  const totalsRight = pageWidth - margin;

  // Sous-total
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mediumGray);
  doc.text('Sous-total HT', totalsX, finalY);
  doc.setTextColor(...darkGray);
  doc.text(formatCurrency(invoice.subtotal), totalsRight, finalY, { align: 'right' });

  // Taxe
  const taxLabel = invoice.taxRate > 0 ? `TVA (${invoice.taxRate}%)` : 'TVA (0%)';
  doc.setTextColor(...mediumGray);
  doc.text(taxLabel, totalsX, finalY + 7);
  doc.setTextColor(...darkGray);
  doc.text(formatCurrency(invoice.taxAmount), totalsRight, finalY + 7, { align: 'right' });

  // Ligne s\u00e9paratrice
  doc.setDrawColor(...black);
  doc.setLineWidth(1);
  doc.line(totalsX - 5, finalY + 12, totalsRight, finalY + 12);

  // TOTAL TTC
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.text('TOTAL TTC', totalsX, finalY + 21);
  doc.text(formatCurrency(invoice.total), totalsRight, finalY + 21, { align: 'right' });

  // ---- CONDITIONS ----
  const conditionsY = finalY + 40;

  // Label "CONDITIONS"
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...mediumGray);
  doc.text('CONDITIONS', margin, conditionsY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mediumGray);

  if (invoice.type === 'facture') {
    doc.text('\u2022 Paiement \u00e0 30 jours', margin, conditionsY + 6);
    doc.text('\u2022 Retard : p\u00e9nalit\u00e9s 3%/mois', margin, conditionsY + 11);
    doc.text('\u2022 Escompte 2% si paiement \u00e0 8 jours', margin, conditionsY + 16);
  } else {
    doc.text('\u2022 Devis valable 30 jours', margin, conditionsY + 6);
    doc.text('\u2022 Retourner sign\u00e9 avec mention "Bon pour accord"', margin, conditionsY + 11);
  }

  // Contact (droite)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTACT', rightColX, conditionsY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  let contactY = conditionsY + 6;
  if (professionalProfile?.emailPro) {
    doc.text(professionalProfile.emailPro, rightColX, contactY);
    contactY += 5;
  }
  if (professionalProfile?.telephone) {
    doc.text(professionalProfile.telephone, rightColX, contactY);
    contactY += 5;
  }

  // Notes
  if (invoice.notes) {
    doc.setTextColor(...darkGray);
    doc.text(`Note : ${invoice.notes}`, margin, conditionsY + 24);
  }

  // ---- PIED DE PAGE ----
  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.3);
  doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mediumGray);

  const footerParts = [
    professionalProfile?.nomEntreprise,
    professionalProfile?.formeJuridique,
    professionalProfile?.siret ? `NINEA: ${professionalProfile.siret}` : null
  ].filter(Boolean).join('  \u00b7  ');

  doc.text(footerParts, pageWidth / 2, pageHeight - 10, { align: 'center' });

  // ---- SAUVEGARDE ----
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
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.text('RAPPORT FINANCIER', pageWidth / 2, 25, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
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
    headStyles: { fillColor: [20, 20, 20] },
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
    headStyles: { fillColor: [20, 20, 20] },
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
  const workbook = XLSX.utils.book_new();

  const colWidths = [
    { wch: 15 }, { wch: 30 }, { wch: 25 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
    { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 30 }
  ];

  const toRow = (invoice: Invoice) => ({
    'Numéro': invoice.number,
    'Titre': invoice.title,
    'Client': invoice.clientName,
    'Statut': invoice.status,
    'Date': formatDate(invoice.createdAt),
    'Échéance': invoice.dueDate ? formatDate(invoice.dueDate) : '',
    'Sous-total HT (XOF)': invoice.subtotal,
    'TVA (%)': invoice.taxRate,
    'Montant TVA (XOF)': invoice.taxAmount,
    'Total TTC (XOF)': invoice.total,
    'Notes': invoice.notes || ''
  });

  // Classeur 1 : Factures
  const factures = invoices.filter(i => i.type === 'facture');
  const facturesSheet = XLSX.utils.json_to_sheet(factures.map(toRow));
  facturesSheet['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(workbook, facturesSheet, 'Factures');

  // Classeur 2 : Devis
  const devis = invoices.filter(i => i.type === 'devis');
  const devisSheet = XLSX.utils.json_to_sheet(devis.map(toRow));
  devisSheet['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(workbook, devisSheet, 'Devis');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `factures_devis_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  const clientsData = clients.map(c => ({
    'Nom': c.name, 'Email': c.email, 'Téléphone': c.phone,
    'Entreprise': c.company, 'Statut': c.status, 'Projets': c.projects, 'CA (XOF)': c.totalRevenue
  }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(clientsData), 'Clients');

  const projectsData = projects.map(p => ({
    'Nom': p.name, 'Client': p.clientName, 'Statut': p.status,
    'Budget (XOF)': p.budget, 'Progression': `${p.progress}%`
  }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(projectsData), 'Projets');

  const facturesData = invoices.filter(i => i.type === 'facture').map(i => ({
    'Numéro': i.number, 'Client': i.clientName,
    'Statut': i.status, 'Total (XOF)': i.total
  }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(facturesData), 'Factures');

  const devisData = invoices.filter(i => i.type === 'devis').map(i => ({
    'Numéro': i.number, 'Client': i.clientName,
    'Statut': i.status, 'Total (XOF)': i.total
  }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(devisData), 'Devis');

  const transactionsData = transactions.map(t => ({
    'Date': formatDate(t.date), 'Description': t.description,
    'Type': t.type, 'Montant (XOF)': t.montant
  }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(transactionsData), 'Transactions');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `rapport_complet_${new Date().toISOString().split('T')[0]}.xlsx`);
};
