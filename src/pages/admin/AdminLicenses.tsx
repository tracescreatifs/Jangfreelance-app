import React, { useState, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { useAdmin } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Key, Copy, Gift, Trash2, RefreshCw } from 'lucide-react';
import { LicenseGenerator } from '@/utils/licenseGenerator';
import { supabase } from '@/lib/supabase';

// ─── Helpers ──────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
};

const truncateKey = (key: string, maxLen = 22) => {
  if (key.length <= maxLen) return key;
  return key.slice(0, maxLen) + '...';
};

const planBadgeColor = (planName: string) => {
  const lower = planName.toLowerCase();
  if (lower.includes('enterprise') || lower.includes('ent'))
    return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  if (lower.includes('pro'))
    return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
  return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
};

// ─── Loading Spinner ──────────────────────────────────────────

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      <p className="text-white/50 text-sm">Chargement des licences...</p>
    </div>
  </div>
);

// ─── Admin Licenses Page ──────────────────────────────────────

const AdminLicenses: React.FC = () => {
  const { licenses, plans, loading, fetchAllLicenses, deleteLicense } = useAdmin();
  const { toast } = useToast();

  // Generator form state
  const [showGenerator, setShowGenerator] = useState(false);
  const [genPlanId, setGenPlanId] = useState('');
  const [genQuantity, setGenQuantity] = useState(1);
  const [genDuration, setGenDuration] = useState(1);
  const [genClientName, setGenClientName] = useState('');
  const [generating, setGenerating] = useState(false);

  // Split licenses into stock (unused) and active (used)
  const stockLicenses = useMemo(
    () => licenses.filter((l) => l.is_used === false),
    [licenses]
  );

  const activeLicenses = useMemo(
    () => licenses.filter((l) => l.is_used === true),
    [licenses]
  );

  // ── Copy key to clipboard ───────────────────────────────────

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      toast({
        title: 'Copie',
        description: 'Cle de licence copiee dans le presse-papiers.',
      });
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de copier la cle.',
        variant: 'destructive',
      });
    }
  };

  // ── Delete a license key ───────────────────────────────────

  const handleDeleteLicense = async (licenseId: string, licenseKey: string) => {
    if (!window.confirm(`Supprimer la licence ${licenseKey} ?`)) return;

    try {
      await deleteLicense(licenseId);
      toast({
        title: 'Supprimee',
        description: 'Licence supprimee avec succes.',
      });
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la licence.',
        variant: 'destructive',
      });
    }
  };

  // ── Generate bulk licenses ──────────────────────────────────

  const handleGenerateLicenses = async () => {
    if (!genPlanId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez selectionner un plan.',
        variant: 'destructive',
      });
      return;
    }

    if (genQuantity < 1 || genQuantity > 100) {
      toast({
        title: 'Erreur',
        description: 'La quantite doit etre entre 1 et 100.',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);

    try {
      // Determine plan type from selected plan
      const selectedPlan = plans.find((p: any) => p.id === genPlanId);
      const planName = selectedPlan?.name?.toUpperCase() || 'PRO';

      let licenseType: 'STARTER' | 'PRO' | 'ENTERPRISE' = 'PRO';
      if (planName.includes('STARTER') || planName.includes('START')) {
        licenseType = 'STARTER';
      } else if (planName.includes('ENTERPRISE') || planName.includes('ENT')) {
        licenseType = 'ENTERPRISE';
      }

      // Generate keys
      const generatedLicenses = LicenseGenerator.generateBulkLicenses(
        licenseType,
        genQuantity,
        genDuration
      );

      // Insert into database
      const rows = generatedLicenses.map((lic) => ({
        key: lic.key,
        plan_id: genPlanId,
        duration_months: genDuration,
        is_used: false,
        created_at: new Date().toISOString(),
        client_name: genClientName.trim() || null,
      }));

      const { error } = await supabase.from('license_keys').insert(rows);

      if (error) {
        throw error;
      }

      toast({
        title: 'Succes',
        description: `${genQuantity} licence(s) generee(s) avec succes.`,
      });

      // Reset form
      setGenPlanId('');
      setGenQuantity(1);
      setGenDuration(1);
      setGenClientName('');
      setShowGenerator(false);

      // Refresh licenses
      await fetchAllLicenses();
    } catch (err: any) {
      console.warn('AdminLicenses: generation error:', err);
      toast({
        title: 'Erreur',
        description: err?.message || 'Erreur lors de la generation des licences.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Key className="w-6 h-6 text-purple-400" />
            Gestion des licences
          </h2>
          <p className="text-white/50 text-sm mt-1">
            Generez, suivez et gerez les cles de licence
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAllLicenses()}
            className="border-white/10 text-white/70 hover:text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Rafraichir
          </Button>
          <Button
            size="sm"
            onClick={() => setShowGenerator(!showGenerator)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Gift className="w-4 h-4 mr-2" />
            Generer des licences
          </Button>
        </div>
      </div>

      {/* Generator Form */}
      {showGenerator && (
        <Card className="glass-morphism border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-400" />
              Generer de nouvelles licences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Plan select */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Plan
                </label>
                <Select value={genPlanId} onValueChange={setGenPlanId}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Selectionner un plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan: any) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Quantite (1-100)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={genQuantity}
                  onChange={(e) =>
                    setGenQuantity(
                      Math.min(100, Math.max(1, parseInt(e.target.value) || 1))
                    )
                  }
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Duree
                </label>
                <Select
                  value={genDuration.toString()}
                  onValueChange={(v) => setGenDuration(parseInt(v))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Duree" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 mois</SelectItem>
                    <SelectItem value="3">3 mois</SelectItem>
                    <SelectItem value="6">6 mois</SelectItem>
                    <SelectItem value="12">12 mois</SelectItem>
                    <SelectItem value="24">24 mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Client name */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Client (optionnel)
                </label>
                <Input
                  type="text"
                  placeholder="Nom du client"
                  value={genClientName}
                  onChange={(e) => setGenClientName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleGenerateLicenses}
                disabled={generating}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generation...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Generer {genQuantity} licence(s)
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Licenses (unused) */}
      <Card className="glass-morphism border-white/10 mb-6">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-400" />
            Licences en stock
            <Badge className="ml-2 bg-blue-500/20 text-blue-300 border-blue-500/30">
              {stockLicenses.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stockLicenses.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-8">
              Aucune licence en stock. Generez-en de nouvelles.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/50">Cle</TableHead>
                    <TableHead className="text-white/50">Plan</TableHead>
                    <TableHead className="text-white/50 hidden sm:table-cell">
                      Duree
                    </TableHead>
                    <TableHead className="text-white/50 hidden md:table-cell">
                      Date creation
                    </TableHead>
                    <TableHead className="text-white/50 hidden lg:table-cell">
                      Client
                    </TableHead>
                    <TableHead className="text-white/50 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockLicenses.map((license) => (
                    <TableRow
                      key={license.id}
                      className="border-white/5 hover:bg-white/5"
                    >
                      <TableCell className="text-white font-mono text-sm">
                        <span className="hidden sm:inline">
                          {truncateKey(license.key)}
                        </span>
                        <span className="sm:hidden">
                          {truncateKey(license.key, 14)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${planBadgeColor(
                            license.plan_name
                          )}`}
                        >
                          {license.plan_name}
                        </span>
                      </TableCell>
                      <TableCell className="text-white/70 hidden sm:table-cell">
                        {license.duration_months} mois
                      </TableCell>
                      <TableCell className="text-white/50 text-sm hidden md:table-cell">
                        {formatDate(license.created_at)}
                      </TableCell>
                      <TableCell className="text-white/50 text-sm hidden lg:table-cell">
                        {license.client_name || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyKey(license.key)}
                            className="text-white/50 hover:text-white hover:bg-white/10"
                            title="Copier la cle"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLicense(license.id, license.key)}
                            className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10"
                            title="Supprimer la licence"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Licenses (used) */}
      <Card className="glass-morphism border-white/10">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-green-400" />
            Licences actives
            <Badge className="ml-2 bg-green-500/20 text-green-300 border-green-500/30">
              {activeLicenses.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeLicenses.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-8">
              Aucune licence active pour le moment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/50">Cle</TableHead>
                    <TableHead className="text-white/50 hidden sm:table-cell">
                      Utilisateur
                    </TableHead>
                    <TableHead className="text-white/50">Plan</TableHead>
                    <TableHead className="text-white/50 hidden md:table-cell">
                      Date activation
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeLicenses.map((license) => (
                    <TableRow
                      key={license.id}
                      className="border-white/5 hover:bg-white/5"
                    >
                      <TableCell className="text-white font-mono text-sm">
                        <span className="hidden sm:inline">
                          {truncateKey(license.key)}
                        </span>
                        <span className="sm:hidden">
                          {truncateKey(license.key, 14)}
                        </span>
                      </TableCell>
                      <TableCell className="text-white/70 hidden sm:table-cell">
                        {license.used_by || '—'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${planBadgeColor(
                            license.plan_name
                          )}`}
                        >
                          {license.plan_name}
                        </span>
                      </TableCell>
                      <TableCell className="text-white/50 text-sm hidden md:table-cell">
                        {license.used_at ? formatDate(license.used_at) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminLicenses;
