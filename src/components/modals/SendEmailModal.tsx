import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Send, Mail, Loader2 } from 'lucide-react';
import { sendInvoiceEmail, sendReminderEmail, InvoiceEmailData } from '../../services/emailService';
import { useToast } from '../../hooks/use-toast';
import { useProfile } from '../../hooks/useProfile';

interface Invoice {
  id: string;
  number: string;
  type: 'devis' | 'facture';
  title: string;
  clientName: string;
  clientEmail?: string;
  total: number;
  dueDate: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

interface SendEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onEmailSent: (invoiceId: string) => void;
  mode?: 'invoice' | 'reminder';
}

const SendEmailModal: React.FC<SendEmailModalProps> = ({
  open,
  onOpenChange,
  invoice,
  onEmailSent,
  mode = 'invoice'
}) => {
  const { toast } = useToast();
  const { profile } = useProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [emailData, setEmailData] = useState({
    to_email: '',
    customMessage: ''
  });

  React.useEffect(() => {
    if (invoice) {
      setEmailData({
        to_email: invoice.clientEmail || '',
        customMessage: ''
      });
    }
  }, [invoice]);

  const handleSend = async () => {
    if (!invoice) return;

    if (!emailData.to_email) {
      toast({
        title: "Erreur",
        description: "Veuillez renseigner l'email du destinataire",
        variant: "destructive"
      });
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.to_email)) {
      toast({
        title: "Email invalide",
        description: "Veuillez entrer une adresse email valide",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    const emailPayload: InvoiceEmailData = {
      clientEmail: emailData.to_email,
      clientName: invoice.clientName,
      invoiceNumber: invoice.number,
      invoiceType: invoice.type,
      amount: invoice.total,
      dueDate: invoice.dueDate,
      items: invoice.items,
      professionalName: profile?.full_name || 'Votre freelance',
      professionalEmail: profile?.email || '',
      professionalPhone: profile?.phone || undefined,
      companyName: profile?.company_name || undefined,
      customMessage: emailData.customMessage || undefined
    };

    try {
      let result;

      if (mode === 'reminder') {
        result = await sendReminderEmail(emailPayload);
      } else {
        result = await sendInvoiceEmail(emailPayload);
      }

      if (result.success) {
        toast({
          title: mode === 'reminder' ? "Rappel envoyé" : "Email envoyé",
          description: `${invoice.type === 'facture' ? 'La facture' : 'Le devis'} a été envoyé${mode === 'reminder' ? ' (rappel)' : ''} à ${emailData.to_email}`
        });
        onEmailSent(invoice.id);
        onOpenChange(false);
      } else {
        toast({
          title: "Erreur d'envoi",
          description: result.message || "Impossible d'envoyer l'email. Vérifiez la configuration.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur envoi:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi",
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  const typeLabel = invoice?.type === 'facture' ? 'Facture' : 'Devis';
  const formattedAmount = invoice ? new Intl.NumberFormat('fr-FR').format(invoice.total) : '0';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] glass-morphism border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            {mode === 'reminder' ? 'Envoyer un rappel' : `Envoyer ${typeLabel.toLowerCase()}`}
          </DialogTitle>
        </DialogHeader>

        {invoice && (
          <div className="space-y-5">
            {/* Résumé du document */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-purple-200 text-sm">Document</p>
                  <p className="text-white font-semibold">{typeLabel} N° {invoice.number}</p>
                  <p className="text-white/70 text-sm mt-1">{invoice.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-purple-200 text-sm">Montant</p>
                  <p className="text-white font-bold text-lg">{formattedAmount} XOF</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10 flex justify-between">
                <span className="text-white/60 text-sm">Client: {invoice.clientName}</span>
                <span className="text-white/60 text-sm">
                  Échéance: {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>

            {/* Email destinataire */}
            <div>
              <Label className="text-white">Email du client *</Label>
              <Input
                type="email"
                value={emailData.to_email}
                onChange={(e) => setEmailData(prev => ({ ...prev, to_email: e.target.value }))}
                className="bg-white/10 border-white/20 text-white mt-1"
                placeholder="client@exemple.com"
              />
            </div>

            {/* Message personnalisé */}
            <div>
              <Label className="text-white">
                Message personnalisé <span className="text-white/50">(optionnel)</span>
              </Label>
              <Textarea
                value={emailData.customMessage}
                onChange={(e) => setEmailData(prev => ({ ...prev, customMessage: e.target.value }))}
                className="bg-white/10 border-white/20 text-white min-h-24 mt-1"
                placeholder={mode === 'reminder'
                  ? "Ajoutez un message au rappel..."
                  : "Ajoutez un message personnalisé à votre email..."
                }
                rows={4}
              />
            </div>

            {/* Info */}
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4 rounded-xl border border-purple-500/20">
              <p className="text-purple-200 text-sm">
                {mode === 'reminder' ? (
                  <>🔔 Un email de rappel professionnel sera envoyé au client avec les détails de la facture.</>
                ) : (
                  <>✨ Un email professionnel avec les détails complets du {typeLabel.toLowerCase()} sera envoyé au client.</>
                )}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSend}
                disabled={isLoading}
                className={mode === 'reminder'
                  ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  : "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {mode === 'reminder' ? 'Envoyer le rappel' : 'Envoyer'}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SendEmailModal;
