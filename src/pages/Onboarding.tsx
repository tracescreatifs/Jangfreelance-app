import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Check, ArrowRight, ArrowLeft, User, Building2, Calculator } from 'lucide-react';

interface OnboardingData {
  prenom: string;
  nom: string;
  telephone: string;
  nomCommercial: string;
  secteurActivite: string;
  formeJuridique: string;
  paysExercice: string;
  regimeFiscal: string;
}

const steps = [
  { label: 'Profil', title: 'Profil Personnel', description: 'Vos informations de base pour commencer', icon: User },
  { label: 'Activit\u00e9', title: 'Votre Activit\u00e9', description: 'Parlez-nous de votre activit\u00e9 professionnelle', icon: Building2 },
  { label: 'Fiscalit\u00e9', title: 'Configuration Fiscale', description: 'Configurez votre r\u00e9gime fiscal', icon: Calculator },
];

const secteursActivite = [
  'Communication & Design',
  'D\u00e9veloppement web',
  'Consulting',
  'Formation',
  'Marketing digital',
  'Autre',
];

const formesJuridiques = [
  'Entreprise personnelle',
  'SARL',
  'SAS',
  'Auto-entrepreneur',
];

const paysOptions = [
  { code: 'SN', nom: 'S\u00e9n\u00e9gal' },
  { code: 'CI', nom: "C\u00f4te d'Ivoire" },
];

const regimesFiscaux: Record<string, { value: string; label: string }[]> = {
  SN: [
    { value: 'BRS', label: 'BRS 5% (Non-assujetti TVA, CA < 50M)' },
    { value: 'TVA', label: 'TVA 18% (CA > 50M)' },
    { value: 'Exonere', label: 'Exon\u00e9r\u00e9 (Startup / Exemption)' },
  ],
  CI: [
    { value: 'IMF', label: 'R\u00e9gime simplifi\u00e9 (IMF)' },
    { value: 'TVA_CI', label: 'R\u00e9gime normal (TVA 18%)' },
    { value: 'Exonere', label: 'Exon\u00e9r\u00e9' },
  ],
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, setOnboardingComplete } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    prenom: '',
    nom: '',
    telephone: '',
    nomCommercial: '',
    secteurActivite: '',
    formeJuridique: '',
    paysExercice: '',
    regimeFiscal: '',
  });

  // Pr\u00e9-remplir pr\u00e9nom/nom depuis full_name
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      const parts = user.user_metadata.full_name.trim().split(' ');
      if (parts.length >= 2) {
        setData(prev => ({
          ...prev,
          prenom: parts[0],
          nom: parts.slice(1).join(' '),
        }));
      } else if (parts.length === 1) {
        setData(prev => ({ ...prev, prenom: parts[0] }));
      }
    }
  }, [user]);

  const handleChange = (field: keyof OnboardingData, value: string) => {
    setData(prev => {
      const updated = { ...prev, [field]: value };
      // Reset r\u00e9gime fiscal si le pays change
      if (field === 'paysExercice') {
        updated.regimeFiscal = '';
      }
      return updated;
    });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return data.prenom.trim() !== '' && data.nom.trim() !== '' && data.telephone.trim() !== '';
      case 2:
        return data.nomCommercial.trim() !== '' && data.secteurActivite !== '' && data.formeJuridique !== '';
      case 3:
        return data.paysExercice !== '' && data.regimeFiscal !== '';
      default:
        return false;
    }
  };

  const saveStep1 = async () => {
    if (!user) return;
    const fullName = `${data.prenom} ${data.nom}`.trim();

    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      phone: data.telephone,
    }, { onConflict: 'id' });

    try {
      const stored = localStorage.getItem('jang_user_profile');
      const existing = stored ? JSON.parse(stored) : {};
      localStorage.setItem('jang_user_profile', JSON.stringify({
        ...existing,
        prenom: data.prenom,
        nom: data.nom,
        telephone: data.telephone,
        email: user.email || '',
      }));
    } catch { /* ignore */ }
  };

  const saveStep2 = async () => {
    if (!user) return;

    await supabase.from('profiles').upsert({
      id: user.id,
      company_name: data.nomCommercial,
    }, { onConflict: 'id' });

    try {
      const stored = localStorage.getItem('jang_professional_profile');
      const existing = stored ? JSON.parse(stored) : {};
      localStorage.setItem('jang_professional_profile', JSON.stringify({
        ...existing,
        nomCommercial: data.nomCommercial,
        formeJuridique: data.formeJuridique,
        secteurActivite: data.secteurActivite,
      }));
    } catch { /* ignore */ }
  };

  const saveStep3 = async () => {
    if (!user) return;

    await supabase.from('fiscal_config').upsert({
      user_id: user.id,
      pays_exercice: data.paysExercice,
      regime_fiscal: data.regimeFiscal,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    try {
      const stored = localStorage.getItem('jang_fiscal_config');
      const existing = stored ? JSON.parse(stored) : {};
      localStorage.setItem('jang_fiscal_config', JSON.stringify({
        ...existing,
        paysExercice: data.paysExercice,
        regimeFiscal: data.regimeFiscal,
      }));
    } catch { /* ignore */ }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSaving(true);
    try {
      if (currentStep === 1) await saveStep1();
      if (currentStep === 2) await saveStep2();
      if (currentStep === 3) {
        await saveStep3();
        await setOnboardingComplete();
        toast.success('Profil configur\u00e9 avec succ\u00e8s ! Bienvenue sur Jang.');
        navigate('/');
        return;
      }
      setCurrentStep(prev => prev + 1);
    } catch (err) {
      console.error('[Onboarding] Save error:', err);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSkip = async () => {
    await setOnboardingComplete();
    navigate('/');
  };

  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-white/80 text-sm">Pr\u00e9nom *</Label>
          <Input
            type="text"
            placeholder="Votre pr\u00e9nom"
            value={data.prenom}
            onChange={(e) => handleChange('prenom', e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-400 h-12"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white/80 text-sm">Nom *</Label>
          <Input
            type="text"
            placeholder="Votre nom"
            value={data.nom}
            onChange={(e) => handleChange('nom', e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-400 h-12"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80 text-sm">Email</Label>
        <Input
          type="email"
          value={user?.email || ''}
          disabled
          className="bg-white/5 border-white/10 text-white/50 h-12 cursor-not-allowed"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white/80 text-sm">T\u00e9l\u00e9phone *</Label>
        <Input
          type="tel"
          placeholder="+221 7X XXX XX XX"
          value={data.telephone}
          onChange={(e) => handleChange('telephone', e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-400 h-12"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-white/80 text-sm">Nom commercial *</Label>
        <Input
          type="text"
          placeholder="Nom de votre entreprise ou activit\u00e9"
          value={data.nomCommercial}
          onChange={(e) => handleChange('nomCommercial', e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-400 h-12"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white/80 text-sm">Secteur d'activit\u00e9 *</Label>
        <Select value={data.secteurActivite} onValueChange={(v) => handleChange('secteurActivite', v)}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white h-12">
            <SelectValue placeholder="S\u00e9lectionnez votre secteur" />
          </SelectTrigger>
          <SelectContent>
            {secteursActivite.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80 text-sm">Forme juridique *</Label>
        <Select value={data.formeJuridique} onValueChange={(v) => handleChange('formeJuridique', v)}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white h-12">
            <SelectValue placeholder="S\u00e9lectionnez votre forme juridique" />
          </SelectTrigger>
          <SelectContent>
            {formesJuridiques.map((f) => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-white/80 text-sm">Pays d'exercice *</Label>
        <Select value={data.paysExercice} onValueChange={(v) => handleChange('paysExercice', v)}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white h-12">
            <SelectValue placeholder="S\u00e9lectionnez votre pays" />
          </SelectTrigger>
          <SelectContent>
            {paysOptions.map((p) => (
              <SelectItem key={p.code} value={p.code}>{p.nom}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80 text-sm">R\u00e9gime fiscal *</Label>
        <Select
          value={data.regimeFiscal}
          onValueChange={(v) => handleChange('regimeFiscal', v)}
          disabled={!data.paysExercice}
        >
          <SelectTrigger className="bg-white/5 border-white/10 text-white h-12">
            <SelectValue placeholder={data.paysExercice ? 'S\u00e9lectionnez votre r\u00e9gime' : 'Choisissez d\'abord un pays'} />
          </SelectTrigger>
          <SelectContent>
            {(regimesFiscaux[data.paysExercice] || []).map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {data.paysExercice && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-white/60 text-sm">
            {data.paysExercice === 'SN'
              ? 'Au S\u00e9n\u00e9gal, le r\u00e9gime BRS (5%) s\'applique aux entreprises avec un CA < 50M CFA. Au-del\u00e0, le r\u00e9gime TVA (18%) s\'applique.'
              : "En C\u00f4te d'Ivoire, le r\u00e9gime simplifi\u00e9 (IMF) concerne les petites entreprises. Le r\u00e9gime normal inclut la TVA \u00e0 18%."}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 px-4 py-8">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 mb-4">
          <span className="text-2xl font-bold text-white">J</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Bienvenue sur Jang</h1>
        <p className="text-white/50 mt-1">Configurons votre espace en quelques \u00e9tapes</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md mb-8">
        <div className="flex items-center justify-between relative">
          {/* Connecting lines */}
          <div className="absolute top-5 left-0 right-0 flex items-center px-12">
            <div className={`flex-1 h-0.5 ${currentStep > 1 ? 'bg-green-500' : 'bg-white/10'}`} />
            <div className={`flex-1 h-0.5 ${currentStep > 2 ? 'bg-green-500' : 'bg-white/10'}`} />
          </div>

          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center relative z-10">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${index + 1 < currentStep
                  ? 'bg-green-500 text-white'
                  : index + 1 === currentStep
                    ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-white/10 text-white/40'
                }
              `}>
                {index + 1 < currentStep ? <Check className="w-5 h-5" /> : index + 1}
              </div>
              <span className={`text-xs mt-2 font-medium ${
                index + 1 <= currentStep ? 'text-white' : 'text-white/40'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
        {/* Step header */}
        <div className="flex items-center gap-3 mb-6">
          {(() => {
            const StepIcon = steps[currentStep - 1].icon;
            return <StepIcon className="w-6 h-6 text-purple-400" />;
          })()}
          <div>
            <h2 className="text-xl font-bold text-white">{steps[currentStep - 1].title}</h2>
            <p className="text-white/50 text-sm">{steps[currentStep - 1].description}</p>
          </div>
        </div>

        {/* Step content */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          {currentStep > 1 ? (
            <Button
              variant="outline"
              onClick={handleBack}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Pr\u00e9c\u00e9dent
            </Button>
          ) : (
            <div />
          )}
          <Button
            onClick={handleNext}
            disabled={isSaving}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium px-6"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : currentStep === 3 ? (
              <>
                Terminer
                <Check className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Suivant
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Skip link */}
        <div className="text-center mt-6">
          <button
            onClick={handleSkip}
            className="text-white/40 hover:text-white/60 text-sm transition"
          >
            Plus tard
          </button>
        </div>
      </div>

      {/* Step counter */}
      <p className="text-white/30 text-xs mt-6">\u00c9tape {currentStep} sur 3</p>
    </div>
  );
}
