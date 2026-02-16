import React, { useState, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { useAdmin } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { sendCustomEmail } from '@/services/emailService';
import { Mail, Send, Users, Filter } from 'lucide-react';

// ─── Email Templates ──────────────────────────────────────────

interface EmailTemplate {
  label: string;
  subject: string;
  message: string;
}

const emailTemplates: EmailTemplate[] = [
  {
    label: 'Renouvellement',
    subject: 'Votre abonnement Jang arrive bientot a expiration',
    message: `Nous vous informons que votre abonnement Jang arrive bientot a expiration.

Pour continuer a profiter de toutes les fonctionnalites sans interruption, nous vous invitons a renouveler votre abonnement des maintenant.

Rendez-vous sur votre espace personnel pour effectuer le renouvellement.

Merci de votre confiance !`,
  },
  {
    label: 'Offre promo',
    subject: 'Offre exclusive Jang - Profitez de -20% sur votre abonnement',
    message: `Bonne nouvelle ! Nous avons une offre speciale pour vous.

Beneficiez de 20% de reduction sur votre prochain abonnement Jang en utilisant le code PROMO20 lors de votre paiement.

Cette offre est valable pour une duree limitee, n'attendez pas pour en profiter !

A bientot sur Jang.`,
  },
  {
    label: 'Nouvelle fonctionnalite',
    subject: 'Decouvrez les nouvelles fonctionnalites de Jang',
    message: `Nous sommes ravis de vous annoncer de nouvelles fonctionnalites sur Jang !

Voici ce qui est nouveau :
- Tableau de bord ameliore avec de nouvelles statistiques
- Export de donnees en plusieurs formats
- Amelioration des performances globales

Connectez-vous des maintenant pour decouvrir ces nouveautes.

L'equipe Jang`,
  },
];

// ─── Audience Options ─────────────────────────────────────────

type AudienceType = 'all' | 'starter' | 'pro' | 'enterprise' | 'manual';

const audienceOptions: { value: AudienceType; label: string }[] = [
  { value: 'all', label: 'Tous les utilisateurs' },
  { value: 'starter', label: 'Plan Starter' },
  { value: 'pro', label: 'Plan Pro' },
  { value: 'enterprise', label: 'Plan Enterprise' },
  { value: 'manual', label: 'Selection manuelle' },
];

// ─── Loading Spinner ──────────────────────────────────────────

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      <p className="text-white/50 text-sm">Chargement...</p>
    </div>
  </div>
);

// ─── Admin Emails Page ────────────────────────────────────────

const AdminEmails: React.FC = () => {
  const { users, loading } = useAdmin();
  const { toast } = useToast();

  // Form state
  const [audience, setAudience] = useState<AudienceType>('all');
  const [manualSelected, setManualSelected] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Filter recipients based on audience selection
  const recipients = useMemo(() => {
    switch (audience) {
      case 'all':
        return users.filter((u) => u.email);
      case 'starter':
        return users.filter(
          (u) =>
            u.email &&
            u.plan_name?.toLowerCase().includes('starter')
        );
      case 'pro':
        return users.filter(
          (u) =>
            u.email &&
            u.plan_name?.toLowerCase().includes('pro')
        );
      case 'enterprise':
        return users.filter(
          (u) =>
            u.email &&
            u.plan_name?.toLowerCase().includes('enterprise')
        );
      case 'manual':
        return users.filter((u) => u.email && manualSelected.has(u.id));
      default:
        return [];
    }
  }, [audience, users, manualSelected]);

  // Toggle manual selection
  const toggleManualUser = (userId: string) => {
    setManualSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  // Apply template
  const applyTemplate = (template: EmailTemplate) => {
    setSubject(template.subject);
    setMessage(template.message);
  };

  // Send emails
  const handleSend = async () => {
    if (!subject.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir un sujet.',
        variant: 'destructive',
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir un message.',
        variant: 'destructive',
      });
      return;
    }

    if (recipients.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Aucun destinataire selectionne.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);

    let successCount = 0;
    let errorCount = 0;

    try {
      for (const user of recipients) {
        try {
          const result = await sendCustomEmail(
            user.email,
            user.full_name || user.email,
            subject,
            message,
            'Jang Admin'
          );

          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }
      }

      if (errorCount === 0) {
        toast({
          title: 'Succes',
          description: `${successCount} email(s) envoye(s) avec succes.`,
        });
        // Reset form
        setSubject('');
        setMessage('');
      } else {
        toast({
          title: 'Envoi partiel',
          description: `${successCount} envoye(s), ${errorCount} echoue(s).`,
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.warn('AdminEmails: send error:', err);
      toast({
        title: 'Erreur',
        description: "Erreur lors de l'envoi des emails.",
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Page Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Mail className="w-6 h-6 text-purple-400" />
          Emails
        </h2>
        <p className="text-white/50 text-sm mt-1">
          Envoyez des emails aux utilisateurs de la plateforme
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Email Form */}
        <div className="lg:col-span-2">
          <Card className="glass-morphism border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-purple-400" />
                Composer un email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Destinataires
                  </div>
                </label>
                <Select
                  value={audience}
                  onValueChange={(v) => setAudience(v as AudienceType)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Selectionner les destinataires" />
                  </SelectTrigger>
                  <SelectContent>
                    {audienceOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {audience !== 'manual' && (
                  <p className="text-xs text-white/40 mt-1">
                    {recipients.length} destinataire(s)
                  </p>
                )}
              </div>

              {/* Manual user selection */}
              {audience === 'manual' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-white/70">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Selection manuelle
                      </div>
                    </label>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      {manualSelected.size} selectionne(s)
                    </Badge>
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-2 space-y-1">
                    {users
                      .filter((u) => u.email)
                      .map((user) => (
                        <label
                          key={user.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={manualSelected.has(user.id)}
                            onCheckedChange={() => toggleManualUser(user.id)}
                            className="border-white/30 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                              {user.full_name || 'Sans nom'}
                            </p>
                            <p className="text-xs text-white/40 truncate">
                              {user.email}
                            </p>
                          </div>
                          {user.plan_name && (
                            <span className="text-xs text-white/30">
                              {user.plan_name}
                            </span>
                          )}
                        </label>
                      ))}
                    {users.filter((u) => u.email).length === 0 && (
                      <p className="text-white/40 text-sm text-center py-4">
                        Aucun utilisateur disponible.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Sujet
                </label>
                <Input
                  type="text"
                  placeholder="Objet de l'email"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Message
                </label>
                <Textarea
                  placeholder="Redigez votre message ici..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={10}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[200px]"
                />
              </div>

              {/* Send button */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-white/40">
                  {recipients.length} destinataire(s)
                </p>
                <Button
                  onClick={handleSend}
                  disabled={sending || recipients.length === 0}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Envoyer
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Templates sidebar */}
        <div>
          <Card className="glass-morphism border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-400" />
                Templates rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {emailTemplates.map((template) => (
                <button
                  key={template.label}
                  onClick={() => applyTemplate(template)}
                  className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all duration-200 group"
                >
                  <p className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
                    {template.label}
                  </p>
                  <p className="text-xs text-white/40 mt-1 line-clamp-2">
                    {template.subject}
                  </p>
                </button>
              ))}

              <div className="pt-3 border-t border-white/10">
                <p className="text-xs text-white/30 leading-relaxed">
                  Cliquez sur un template pour pre-remplir le sujet et le message.
                  Vous pouvez ensuite personnaliser le contenu avant l'envoi.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stats card */}
          <Card className="glass-morphism border-white/10 mt-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-sm font-medium text-white">
                  Utilisateurs
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Total</span>
                  <span className="text-white font-medium">
                    {users.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Avec email</span>
                  <span className="text-white font-medium">
                    {users.filter((u) => u.email).length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Destinataires actuels</span>
                  <span className="text-purple-300 font-medium">
                    {recipients.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminEmails;
