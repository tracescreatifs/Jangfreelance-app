import React, { useState, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { useAdmin, AdminUser } from '@/hooks/useAdmin';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Users, Search, Shield, UserCog, Ban, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminUsers: React.FC = () => {
  const {
    users,
    plans,
    loading,
    updateUserRole,
    revokeSubscription,
    grantFreeLicense,
  } = useAdmin();

  const { toast } = useToast();

  // ── Local state ──────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Dialog states
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState('');

  const [licenseDialogOpen, setLicenseDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('1');

  // ── Filtered users ───────────────────────────────────────
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        user.full_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === 'all' || user.role === roleFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.subscription_status === 'active') ||
        (statusFilter === 'cancelled' && user.subscription_status === 'cancelled') ||
        (statusFilter === 'none' && !user.subscription_status);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // ── Role badge styling ───────────────────────────────────
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      case 'staff':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30">
            <UserCog className="w-3 h-3 mr-1" />
            Staff
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30">
            User
          </Badge>
        );
    }
  };

  // ── Handlers ─────────────────────────────────────────────
  const handleOpenRoleDialog = (user: AdminUser) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;

    try {
      await updateUserRole(selectedUser.id, newRole);
      toast({
        title: 'Role mis a jour',
        description: `Le role de ${selectedUser.full_name || selectedUser.email} a ete change en "${newRole}".`,
      });
      setRoleDialogOpen(false);
      setSelectedUser(null);
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre a jour le role.',
        variant: 'destructive',
      });
    }
  };

  const handleRevokeSubscription = async (user: AdminUser) => {
    if (!confirm(`Voulez-vous vraiment revoquer l'abonnement de ${user.full_name || user.email} ?`)) {
      return;
    }

    try {
      await revokeSubscription(user.id);
      toast({
        title: 'Abonnement revoque',
        description: `L'abonnement de ${user.full_name || user.email} a ete revoque.`,
      });
    } catch {
      toast({
        title: 'Erreur',
        description: "Impossible de revoquer l'abonnement.",
        variant: 'destructive',
      });
    }
  };

  const handleOpenLicenseDialog = (user: AdminUser) => {
    setSelectedUser(user);
    setSelectedPlanId('');
    setSelectedDuration('1');
    setLicenseDialogOpen(true);
  };

  const handleGrantLicense = async () => {
    if (!selectedUser || !selectedPlanId || !selectedDuration) return;

    try {
      await grantFreeLicense(selectedUser.id, selectedPlanId, parseInt(selectedDuration, 10));
      toast({
        title: 'Licence offerte',
        description: `Une licence a ete offerte a ${selectedUser.full_name || selectedUser.email}.`,
      });
      setLicenseDialogOpen(false);
      setSelectedUser(null);
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'offrir la licence.',
        variant: 'destructive',
      });
    }
  };

  // ── Format date ──────────────────────────────────────────
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Gestion des utilisateurs</h2>
              <p className="text-sm text-white/50">
                {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''}
                {searchQuery || roleFilter !== 'all' || statusFilter !== 'all' ? ' (filtre actif)' : ''}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Rechercher par nom ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Filtrer par role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="cancelled">Annule</SelectItem>
              <SelectItem value="none">Sans abonnement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
          </div>
        ) : (
          /* Users Table */
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Liste des utilisateurs</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-white/60">Nom</TableHead>
                      <TableHead className="hidden sm:table-cell text-white/60">Email</TableHead>
                      <TableHead className="text-white/60">Role</TableHead>
                      <TableHead className="hidden sm:table-cell text-white/60">Plan actif</TableHead>
                      <TableHead className="hidden md:table-cell text-white/60">NINEA</TableHead>
                      <TableHead className="hidden md:table-cell text-white/60">RCCM</TableHead>
                      <TableHead className="hidden md:table-cell text-white/60">R\u00e9gime fiscal</TableHead>
                      <TableHead className="hidden md:table-cell text-white/60">Date inscription</TableHead>
                      <TableHead className="text-white/60 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow className="border-white/10">
                        <TableCell colSpan={9} className="text-center py-10 text-white/40">
                          Aucun utilisateur trouve.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                          <TableCell className="text-white font-medium">
                            <div>
                              <div>{user.full_name || '—'}</div>
                              <div className="text-xs text-white/40 sm:hidden">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-white/70">
                            {user.email}
                          </TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell className="hidden sm:table-cell text-white/70">
                            {user.plan_name ? (
                              <Badge
                                variant="outline"
                                className="border-green-500/30 text-green-400"
                              >
                                {user.plan_name}
                              </Badge>
                            ) : (
                              <span className="text-white/30">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-white/50 text-sm">
                            {user.ninea || <span className="text-white/20">—</span>}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-white/50 text-sm">
                            {user.rccm || <span className="text-white/20">—</span>}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-white/50 text-sm">
                            {user.regime_fiscal || <span className="text-white/20">—</span>}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-white/50 text-sm">
                            {formatDate(user.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenRoleDialog(user)}
                                className="text-white/60 hover:text-white hover:bg-white/10"
                                title="Changer role"
                              >
                                <UserCog className="w-4 h-4" />
                                <span className="hidden lg:inline ml-1">Role</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevokeSubscription(user)}
                                className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                                title="Revoquer abonnement"
                                disabled={!user.subscription_status || user.subscription_status === 'cancelled'}
                              >
                                <Ban className="w-4 h-4" />
                                <span className="hidden lg:inline ml-1">Revoquer</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenLicenseDialog(user)}
                                className="text-green-400/60 hover:text-green-400 hover:bg-green-500/10"
                                title="Offrir licence"
                              >
                                <Gift className="w-4 h-4" />
                                <span className="hidden lg:inline ml-1">Offrir</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Dialog: Changer role ──────────────────────────────── */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Changer le role</DialogTitle>
            <DialogDescription className="text-white/50">
              Modifier le role de {selectedUser?.full_name || selectedUser?.email || 'cet utilisateur'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm text-white/60">Nouveau role</label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Choisir un role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setRoleDialogOpen(false)}
                className="border-white/10 text-white/70 hover:bg-white/5"
              >
                Annuler
              </Button>
              <Button
                onClick={handleUpdateRole}
                disabled={!newRole || newRole === selectedUser?.role}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Confirmer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Offrir licence ────────────────────────────── */}
      <Dialog open={licenseDialogOpen} onOpenChange={setLicenseDialogOpen}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Offrir une licence</DialogTitle>
            <DialogDescription className="text-white/50">
              Offrir une licence gratuite a {selectedUser?.full_name || selectedUser?.email || 'cet utilisateur'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm text-white/60">Plan</label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Choisir un plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/60">Duree (mois)</label>
              <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Duree" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 mois</SelectItem>
                  <SelectItem value="3">3 mois</SelectItem>
                  <SelectItem value="6">6 mois</SelectItem>
                  <SelectItem value="12">12 mois</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setLicenseDialogOpen(false)}
                className="border-white/10 text-white/70 hover:bg-white/5"
              >
                Annuler
              </Button>
              <Button
                onClick={handleGrantLicense}
                disabled={!selectedPlanId}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Gift className="w-4 h-4 mr-1" />
                Offrir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUsers;
