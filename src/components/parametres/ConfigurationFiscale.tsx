
import React, { useState, useEffect } from 'react';
import { Calculator, AlertTriangle, Check, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { useFiscalConfig } from '../../hooks/useFiscalConfig';
import { useToast } from '../../hooks/use-toast';

const ConfigurationFiscale = () => {
  const { config, loading, updateConfig } = useFiscalConfig();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(config);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFormData(config);
    setHasChanges(false);
  }, [config]);

  const pays = [
    { code: 'SN', nom: 'Sénégal', flag: '🇸🇳', seuilTVA: 50000000 },
    { code: 'CI', nom: 'Côte d\'Ivoire', flag: '🇨🇮', seuilTVA: 50000000 },
    { code: 'ML', nom: 'Mali', flag: '🇲🇱', seuilTVA: 50000000 },
    { code: 'BF', nom: 'Burkina Faso', flag: '🇧🇫', seuilTVA: 50000000 },
    { code: 'CM', nom: 'Cameroun', flag: '🇨🇲', seuilTVA: 50000000 },
  ];

  const regimesFiscaux = {
    'BRS': { taux: 5, nom: 'BRS 5%', description: '< 50M CFA' },
    'TVA': { taux: 18, nom: 'TVA 18%', description: '> 50M CFA' },
    'Exoneré': { taux: 0, nom: 'Exonéré', description: 'Début d\'activité' }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleCancel = () => {
    setFormData(config);
    setHasChanges(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getCurrentCountry = () => pays.find(p => p.nom === formData.paysExercice);
  const shouldShowTVAAlert = () => {
    const ca = parseInt(formData.caPrevisionnelAnnuel);
    const seuil = getCurrentCountry()?.seuilTVA || 50000000;
    return ca >= seuil && formData.regimeFiscal === 'BRS';
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateConfig(formData);
      toast({
        title: "Configuration sauvegardée",
        description: "Vos informations fiscales ont été mises à jour"
      });
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass-morphism p-8 rounded-2xl">
        <div className="flex items-center space-x-3 mb-8">
          <Calculator className="w-8 h-8 text-purple-300" />
          <h1 className="text-3xl font-bold text-white">Configuration Fiscale</h1>
        </div>

        {/* Juridiction fiscale */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            🌍 Juridiction Fiscale
          </h2>
          <div className="bg-white/5 p-6 rounded-xl space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label className="text-white font-medium">Pays d'exercice *</Label>
                <Select value={formData.paysExercice} onValueChange={(value) => handleInputChange('paysExercice', value)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {pays.map((p) => (
                      <SelectItem key={p.code} value={p.nom} className="text-white hover:bg-gray-700">
                        {p.flag} {p.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white font-medium">Régime fiscal *</Label>
                <Select value={formData.regimeFiscal} onValueChange={(value) => handleInputChange('regimeFiscal', value)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {Object.entries(regimesFiscaux).map(([key, regime]) => (
                      <SelectItem key={key} value={key} className="text-white hover:bg-gray-700">
                        {regime.nom} ({regime.description})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-white font-medium">CA prévisionnel annuel</Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  value={formData.caPrevisionnelAnnuel}
                  onChange={(e) => handleInputChange('caPrevisionnelAnnuel', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-purple-200"
                  placeholder="12000000"
                />
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500 whitespace-nowrap">
                  📊 Simulateur
                </Button>
              </div>
              <p className="text-purple-200 text-sm mt-1">
                Montant estimé: {formatCurrency(parseInt(formData.caPrevisionnelAnnuel) || 0)}
              </p>
            </div>

            {shouldShowTVAAlert() && (
              <Alert className="border-orange-500/50 bg-orange-500/10">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                <AlertDescription className="text-orange-200">
                  Attention ! Votre CA dépasse le seuil TVA de {formatCurrency(getCurrentCountry()?.seuilTVA || 50000000)}. 
                  Vous devriez passer au régime TVA 18%.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Identifiants fiscaux */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            🆔 Identifiants Fiscaux
          </h2>
          <div className="bg-white/5 p-6 rounded-xl space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label className="text-white font-medium">NINEA ({formData.paysExercice}) *</Label>
                <div className="flex space-x-2">
                  <Input
                    value={formData.ninea}
                    onChange={(e) => handleInputChange('ninea', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-purple-200"
                  />
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    <Check className="w-4 h-4 mr-1" />
                    Vérifier
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-white font-medium">RCCM (si société)</Label>
                <Input
                  value={formData.rccm}
                  onChange={(e) => handleInputChange('rccm', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-purple-200"
                />
              </div>

              <div className="lg:col-span-2">
                <Label className="text-white font-medium">Numéro TVA (si assujetti)</Label>
                <Input
                  value={formData.numeroTVA}
                  onChange={(e) => handleInputChange('numeroTVA', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-purple-200"
                  placeholder={formData.regimeFiscal === 'BRS' ? 'Non applicable - BRS 5%' : 'Numéro TVA'}
                  disabled={formData.regimeFiscal === 'BRS'}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Informations bancaires */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            🏦 Informations Bancaires
          </h2>
          <div className="bg-white/5 p-6 rounded-xl space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label className="text-white font-medium">Banque</Label>
                <Input
                  value={formData.banque}
                  onChange={(e) => handleInputChange('banque', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-purple-200"
                />
              </div>

              <div>
                <Label className="text-white font-medium">Code SWIFT</Label>
                <Input
                  value={formData.swift}
                  onChange={(e) => handleInputChange('swift', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-purple-200"
                />
              </div>

              <div className="lg:col-span-2">
                <Label className="text-white font-medium">IBAN</Label>
                <Input
                  value={formData.iban}
                  onChange={(e) => handleInputChange('iban', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-purple-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mentions légales auto-générées */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            📋 Mentions Légales Auto-générées
          </h2>
          <div className="bg-white/5 p-6 rounded-xl">
            <Alert className="border-blue-500/50 bg-blue-500/10">
              <Info className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-200">
                Ces mentions seront automatiquement ajoutées à vos factures et devis.
              </AlertDescription>
            </Alert>
            <div className="bg-white/10 p-4 rounded-lg mt-4 font-mono text-sm text-purple-200">
              <p>Entreprise personnelle - {regimesFiscaux[formData.regimeFiscal as keyof typeof regimesFiscaux].nom}</p>
              {formData.regimeFiscal === 'BRS' && <p>Non assujettie à la TVA - Art.356 CGI</p>}
              <p>NINEA: {formData.ninea}</p>
              {formData.rccm && <p>RCCM: {formData.rccm}</p>}
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={handleCancel}
            disabled={!hasChanges}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-105 transition-transform"
          >
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationFiscale;
