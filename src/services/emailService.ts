// Service d'envoi d'emails via Resend
// Note: Les appels doivent passer par une Edge Function Supabase pour la sécurité

export interface EmailData {
  to: string;
  toName: string;
  subject: string;
  message: string;
  documentType?: 'facture' | 'devis';
  documentNumber?: string;
  amount?: number;
  dueDate?: string;
  fromName?: string;
  fromEmail?: string;
}

export interface InvoiceEmailData {
  clientEmail: string;
  clientName: string;
  invoiceNumber: string;
  invoiceType: 'facture' | 'devis';
  amount: number;
  dueDate: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  professionalName: string;
  professionalEmail: string;
  professionalPhone?: string;
  companyName?: string;
  customMessage?: string;
}

// Template HTML pour les emails de facture/devis
const generateInvoiceEmailHTML = (data: InvoiceEmailData): string => {
  const typeLabel = data.invoiceType === 'facture' ? 'Facture' : 'Devis';
  const formattedAmount = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(data.amount);

  const itemsHTML = data.items?.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${new Intl.NumberFormat('fr-FR').format(item.unitPrice)} XOF</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${new Intl.NumberFormat('fr-FR').format(item.total)} XOF</td>
    </tr>
  `).join('') || '';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${typeLabel} ${data.invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">${data.companyName || 'Jang'}</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${typeLabel} N° ${data.invoiceNumber}</p>
    </div>

    <!-- Content -->
    <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Bonjour <strong>${data.clientName}</strong>,
      </p>

      ${data.customMessage ? `
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        ${data.customMessage}
      </p>
      ` : `
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Veuillez trouver ci-dessous les détails de ${data.invoiceType === 'facture' ? 'votre facture' : 'notre devis'}.
      </p>
      `}

      <!-- Invoice Summary Box -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 25px 0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
          <div>
            <p style="color: #64748b; margin: 0; font-size: 14px;">Numéro</p>
            <p style="color: #1e293b; margin: 5px 0 0 0; font-weight: 600;">${data.invoiceNumber}</p>
          </div>
          <div style="text-align: right;">
            <p style="color: #64748b; margin: 0; font-size: 14px;">Date d'échéance</p>
            <p style="color: #1e293b; margin: 5px 0 0 0; font-weight: 600;">${new Date(data.dueDate).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px;">
          <p style="color: #64748b; margin: 0; font-size: 14px;">Montant total</p>
          <p style="color: #8b5cf6; margin: 5px 0 0 0; font-size: 28px; font-weight: 700;">${formattedAmount}</p>
        </div>
      </div>

      ${data.items && data.items.length > 0 ? `
      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 12px; text-align: left; color: #64748b; font-weight: 600; font-size: 14px;">Description</th>
            <th style="padding: 12px; text-align: center; color: #64748b; font-weight: 600; font-size: 14px;">Qté</th>
            <th style="padding: 12px; text-align: right; color: #64748b; font-weight: 600; font-size: 14px;">Prix unit.</th>
            <th style="padding: 12px; text-align: right; color: #64748b; font-weight: 600; font-size: 14px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
      ` : ''}

      <!-- Contact Info -->
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #64748b; font-size: 14px; margin: 0;">
          Pour toute question, n'hésitez pas à nous contacter :
        </p>
        <p style="color: #374151; font-size: 14px; margin: 10px 0 0 0;">
          <strong>${data.professionalName}</strong><br>
          ${data.professionalEmail}
          ${data.professionalPhone ? `<br>${data.professionalPhone}` : ''}
        </p>
      </div>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 25px;">
        Cordialement,<br>
        <strong>${data.professionalName}</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">
        Cet email a été envoyé via <strong>Jang</strong> - Gestion freelance simplifiée
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

// Template HTML pour les rappels de paiement
const generateReminderEmailHTML = (data: InvoiceEmailData): string => {
  const formattedAmount = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(data.amount);

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rappel - Facture ${data.invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">Rappel de paiement</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Facture N° ${data.invoiceNumber}</p>
    </div>

    <!-- Content -->
    <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Bonjour <strong>${data.clientName}</strong>,
      </p>

      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Nous vous rappelons que la facture <strong>N° ${data.invoiceNumber}</strong> d'un montant de <strong>${formattedAmount}</strong> est arrivée à échéance le <strong>${new Date(data.dueDate).toLocaleDateString('fr-FR')}</strong>.
      </p>

      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 25px 0;">
        <p style="color: #92400e; margin: 0; font-size: 16px;">
          Merci de bien vouloir procéder au règlement dans les meilleurs délais.
        </p>
      </div>

      <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
        Si vous avez déjà effectué le paiement, veuillez ignorer ce message. En cas de question, n'hésitez pas à nous contacter.
      </p>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 25px;">
        Cordialement,<br>
        <strong>${data.professionalName}</strong><br>
        ${data.professionalEmail}
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">
        Cet email a été envoyé via <strong>Jang</strong>
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

// Fonction d'envoi via Supabase Edge Function
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  fromName: string = 'Jang'
): Promise<{ success: boolean; message: string }> => {
  try {
    const url = `${SUPABASE_URL}/functions/v1/send-email`;
    console.log('[emailService] Sending email to:', to, 'subject:', subject);
    console.log('[emailService] URL:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        fromName
      })
    });

    console.log('[emailService] Response status:', response.status);
    const result = await response.json();
    console.log('[emailService] Response body:', result);

    if (!response.ok) {
      throw new Error(result.error || 'Erreur lors de l\'envoi');
    }

    return { success: true, message: 'Email envoyé avec succès' };
  } catch (error) {
    console.error('[emailService] Erreur envoi email:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de l\'envoi de l\'email'
    };
  }
};

// Envoyer une facture ou un devis par email
export const sendInvoiceEmail = async (data: InvoiceEmailData): Promise<{ success: boolean; message: string }> => {
  const typeLabel = data.invoiceType === 'facture' ? 'Facture' : 'Devis';
  const subject = `${typeLabel} N° ${data.invoiceNumber} - ${data.companyName || 'Jang'}`;
  const html = generateInvoiceEmailHTML(data);

  return sendEmail(data.clientEmail, subject, html, data.companyName || data.professionalName);
};

// Envoyer un rappel de paiement
export const sendReminderEmail = async (data: InvoiceEmailData): Promise<{ success: boolean; message: string }> => {
  const subject = `Rappel - Facture N° ${data.invoiceNumber} en attente`;
  const html = generateReminderEmailHTML(data);

  return sendEmail(data.clientEmail, subject, html, data.companyName || data.professionalName);
};

// Envoyer un email personnalisé
export const sendCustomEmail = async (
  to: string,
  toName: string,
  subject: string,
  message: string,
  fromName: string
): Promise<{ success: boolean; message: string }> => {
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Bonjour <strong>${toName}</strong>,
      </p>

      <div style="color: #374151; font-size: 16px; line-height: 1.8; white-space: pre-line;">
        ${message}
      </div>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 25px;">
        Cordialement,<br>
        <strong>${fromName}</strong>
      </p>
    </div>

    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">Envoyé via <strong>Jang</strong></p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail(to, subject, html, fromName);
};

// Envoyer un email commercial (admin)
export const sendCommercialEmail = async (
  to: string,
  toName: string,
  subject: string,
  message: string,
  senderName: string = 'Jang'
): Promise<{ success: boolean; message: string }> => {
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">Jang</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">Gestion freelance simplifiée</p>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Bonjour <strong>${toName}</strong>,
      </p>
      <div style="color: #374151; font-size: 16px; line-height: 1.8; white-space: pre-line;">
        ${message}
      </div>
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 25px;">
        L'équipe <strong>${senderName}</strong>
      </p>
    </div>
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">Envoyé via <strong>Jang</strong> - Gestion freelance</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail(to, subject, html, senderName);
};

// Template HTML pour l'email de bienvenue
const generateWelcomeEmailHTML = (fullName: string): string => {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur Jang</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
      <div style="display: inline-block; width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 16px; line-height: 60px; margin-bottom: 15px;">
        <span style="color: white; font-size: 28px; font-weight: bold;">J</span>
      </div>
      <h1 style="color: white; margin: 0; font-size: 28px;">Bienvenue sur Jang !</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">Gestion freelance simplifiée</p>
    </div>

    <!-- Content -->
    <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Bonjour <strong>${fullName}</strong>,
      </p>

      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Votre compte Jang a été créé avec succès. Nous sommes ravis de vous compter parmi nous !
      </p>

      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Jang est votre outil tout-en-un pour gérer votre activité de freelance. Voici ce que vous pouvez faire :
      </p>

      <!-- Features Box -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 25px 0;">
        <div style="margin-bottom: 15px;">
          <span style="color: #8b5cf6; font-weight: 600;">📋 Projets</span>
          <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">Gérez vos projets, suivez leur avancement et respectez vos délais.</p>
        </div>
        <div style="margin-bottom: 15px;">
          <span style="color: #8b5cf6; font-weight: 600;">📄 Factures & Devis</span>
          <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">Créez et envoyez des factures et devis professionnels en quelques clics.</p>
        </div>
        <div style="margin-bottom: 15px;">
          <span style="color: #8b5cf6; font-weight: 600;">👥 Clients</span>
          <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">Centralisez les informations de vos clients et suivez vos relations.</p>
        </div>
        <div>
          <span style="color: #8b5cf6; font-weight: 600;">💰 Comptabilité</span>
          <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">Suivez vos revenus, dépenses et gardez une vision claire de vos finances.</p>
        </div>
      </div>

      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Connectez-vous dès maintenant et commencez à organiser votre activité !
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://jangfreelance.vercel.app" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 12px; font-size: 16px; font-weight: 600;">
          Accéder à Jang
        </a>
      </div>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 25px;">
        À bientôt,<br>
        <strong>L'équipe Jang</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">
        <strong>Jang</strong> - Gestion freelance simplifiée
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

// Envoyer un email de bienvenue après inscription
export const sendWelcomeEmail = async (
  email: string,
  fullName: string
): Promise<{ success: boolean; message: string }> => {
  const subject = 'Bienvenue sur Jang ! 🎉';
  const html = generateWelcomeEmailHTML(fullName);

  return sendEmail(email, subject, html, 'Jang');
};
