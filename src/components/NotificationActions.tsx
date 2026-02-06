
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Send, Eye, PartyPopper, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from './ui/use-toast';

interface NotificationActionsProps {
  notificationId: string;
  clientName: string;
  projectName: string;
  onDismiss: () => void;
}

const NotificationActions: React.FC<NotificationActionsProps> = ({
  notificationId,
  clientName,
  projectName,
  onDismiss
}) => {
  const navigate = useNavigate();
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleRelance = () => {
    setIsEmailDialogOpen(true);
  };

  const handleVoirProjet = () => {
    // Naviguer vers la page du projet
    navigate(`/projets/${notificationId}`);
  };

  const handleFelicitations = () => {
    setShowCelebration(true);
    
    // Animation de célébration
    setTimeout(() => {
      setShowCelebration(false);
      onDismiss();
      toast({
        title: "🎉 Félicitations !",
        description: `Projet ${projectName} marqué comme célébré !`,
        variant: "default"
      });
    }, 2000);
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const emailData = {
      client: clientName,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
    };

    console.log('Envoi email de relance:', emailData);
    setIsEmailDialogOpen(false);
    toast({
      title: "Email envoyé",
      description: `Email de relance envoyé à ${clientName}`,
      variant: "default"
    });
  };

  return (
    <>
      <div className="flex space-x-2 mt-3">
        <Button 
          size="sm" 
          onClick={handleRelance}
          className="bg-orange-500 hover:bg-orange-600 text-xs"
        >
          <Send className="w-3 h-3 mr-1" />
          Relancer
        </Button>
        
        <Button 
          size="sm" 
          onClick={handleVoirProjet}
          className="bg-blue-500 hover:bg-blue-600 text-xs"
        >
          <Eye className="w-3 h-3 mr-1" />
          Voir Projet
        </Button>
        
        <Button 
          size="sm" 
          onClick={handleFelicitations}
          className="bg-green-500 hover:bg-green-600 text-xs"
        >
          <PartyPopper className="w-3 h-3 mr-1" />
          Félicitations
        </Button>
      </div>

      {/* Dialog de relance */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-lg glass-morphism border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Send className="w-5 h-5 mr-2" />
              Relancer {clientName}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendEmail} className="space-y-4">
            <div>
              <Label className="text-white">Objet</Label>
              <Input 
                name="subject"
                defaultValue={`Suivi du projet ${projectName}`}
                className="bg-white/10 border-white/20 text-white"
                required
              />
            </div>

            <div>
              <Label className="text-white">Message</Label>
              <Textarea 
                name="message"
                defaultValue={`Bonjour ${clientName},

J'espère que vous allez bien. Je me permets de vous recontacter concernant le projet "${projectName}".

Pouvons-nous faire le point sur l'avancement et les prochaines étapes ?

N'hésitez pas à me faire savoir vos disponibilités.

Cordialement,`}
                className="bg-white/10 border-white/20 text-white"
                rows={8}
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setIsEmailDialogOpen(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Annuler
              </Button>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-orange-500 to-red-500"
              >
                <Send className="w-4 h-4 mr-2" />
                Envoyer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Animation de célébration */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center animate-pulse">
            <div className="text-6xl mb-4">🎉</div>
            <div className="text-2xl font-bold text-white mb-2">Félicitations !</div>
            <div className="text-purple-200">Projet célébré avec succès</div>
            <div className="mt-4 flex justify-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationActions;
