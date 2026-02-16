import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useTrash, TrashItemType } from '@/hooks/useTrash';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Users,
  FolderOpen,
  FileText,
  Calculator,
  Key,
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────

const typeConfig: Record<TrashItemType, { label: string; icon: React.ElementType; color: string }> = {
  client: { label: 'Client', icon: Users, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  project: { label: 'Projet', icon: FolderOpen, color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  invoice: { label: 'Facture', icon: FileText, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  transaction: { label: 'Transaction', icon: Calculator, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  license: { label: 'Licence', icon: Key, color: 'bg-red-500/20 text-red-300 border-red-500/30' },
};

const ALL_TYPES: TrashItemType[] = ['client', 'project', 'invoice', 'transaction', 'license'];

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
};

// ── Page ─────────────────────────────────────────────────────

const Corbeille: React.FC = () => {
  const { items, loading, fetchTrashItems, restoreItem, permanentDelete, emptyTrash } = useTrash();
  const { toast } = useToast();
  const [filter, setFilter] = useState<TrashItemType | 'all'>('all');

  useEffect(() => {
    fetchTrashItems();
  }, [fetchTrashItems]);

  const filteredItems = filter === 'all' ? items : items.filter((i) => i.type === filter);

  const handleRestore = async (type: TrashItemType, id: string, name: string) => {
    try {
      await restoreItem(type, id);
      toast({ title: 'Restaure', description: `"${name}" a ete restaure.` });
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de restaurer cet element.', variant: 'destructive' });
    }
  };

  const handlePermanentDelete = async (type: TrashItemType, id: string, name: string) => {
    if (!window.confirm(`Supprimer definitivement "${name}" ?\nCette action est irreversible.`)) return;
    try {
      await permanentDelete(type, id);
      toast({ title: 'Supprime', description: `"${name}" a ete supprime definitivement.` });
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de supprimer cet element.', variant: 'destructive' });
    }
  };

  const handleEmptyTrash = async () => {
    if (!window.confirm('Vider toute la corbeille ?\nTous les elements seront supprimes definitivement. Cette action est irreversible.')) return;
    try {
      await emptyTrash();
      toast({ title: 'Corbeille videe', description: 'Tous les elements ont ete supprimes definitivement.' });
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de vider la corbeille.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Sidebar />
      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trash2 className="w-6 h-6 text-red-400" />
              Corbeille
              {items.length > 0 && (
                <Badge className="ml-2 bg-red-500/20 text-red-300 border-red-500/30">
                  {items.length}
                </Badge>
              )}
            </h2>
            <p className="text-white/50 text-sm mt-1">
              Elements supprimes — restaurez ou supprimez definitivement
            </p>
          </div>

          {items.length > 0 && (
            <Button
              size="sm"
              onClick={handleEmptyTrash}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Vider la corbeille
            </Button>
          )}
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-white/15 text-white' : 'border-white/10 text-white/60 hover:text-white hover:bg-white/10'}
          >
            Tout ({items.length})
          </Button>
          {ALL_TYPES.map((type) => {
            const count = items.filter((i) => i.type === type).length;
            if (count === 0) return null;
            const config = typeConfig[type];
            return (
              <Button
                key={type}
                variant={filter === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(type)}
                className={filter === type ? 'bg-white/15 text-white' : 'border-white/10 text-white/60 hover:text-white hover:bg-white/10'}
              >
                <config.icon className="w-3.5 h-3.5 mr-1.5" />
                {config.label} ({count})
              </Button>
            );
          })}
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
              <p className="text-white/50 text-sm">Chargement de la corbeille...</p>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="glass-morphism border-white/10">
            <CardContent className="py-16">
              <div className="text-center">
                <Trash2 className="w-16 h-16 mx-auto text-white/20 mb-4" />
                <p className="text-white/40 text-lg font-medium">La corbeille est vide</p>
                <p className="text-white/30 text-sm mt-1">Les elements supprimes apparaitront ici</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const config = typeConfig[item.type];
              const Icon = config.icon;

              return (
                <Card key={`${item.type}-${item.id}`} className="glass-morphism border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Icone type */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white/60" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${config.color}`}>
                            {config.label}
                          </span>
                          <span className="text-white/30 text-xs">
                            {formatDate(item.deleted_at)}
                          </span>
                        </div>
                        <p className="text-white font-medium text-sm truncate">{item.name}</p>
                        {item.details && (
                          <p className="text-white/40 text-xs truncate">{item.details}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestore(item.type, item.id, item.name)}
                          className="text-green-400/70 hover:text-green-400 hover:bg-green-500/10"
                          title="Restaurer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span className="hidden sm:inline ml-1.5 text-xs">Restaurer</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePermanentDelete(item.type, item.id, item.name)}
                          className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10"
                          title="Supprimer definitivement"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline ml-1.5 text-xs">Supprimer</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Avertissement */}
        {items.length > 0 && (
          <div className="mt-6 flex items-start gap-3 p-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 text-sm font-medium">Attention</p>
              <p className="text-amber-300/60 text-xs mt-0.5">
                Les elements dans la corbeille peuvent etre restaures. La suppression definitive est irreversible.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Corbeille;
