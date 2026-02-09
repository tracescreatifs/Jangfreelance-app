import React, { useState } from 'react';
import {
  Briefcase, Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  Search, FolderPlus, X, Check, Package, DollarSign, Clock, RotateCcw
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '../components/ui/dialog';
import { useServices, type Service, type Category, type SubCategory } from '../hooks/useServices';
import { useToast } from '../hooks/use-toast';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(amount);
};

const Services = () => {
  const {
    categories, loading,
    addCategory, updateCategory, deleteCategory,
    addSubCategory, updateSubCategory, deleteSubCategory,
    addService, updateService, deleteService,
    getTotalServices, getTotalCategories, resetToDefaults,
  } = useServices();
  const { toast } = useToast();

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [expandedSubCategories, setExpandedSubCategories] = useState<string[]>([]);

  // Dialog states
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showSubCategoryDialog, setShowSubCategoryDialog] = useState(false);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Edit targets
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingSubCategoryId, setEditingSubCategoryId] = useState<string | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState<string>('');
  const [targetSubCategoryId, setTargetSubCategoryId] = useState<string>('');

  // Form data
  const [categoryName, setCategoryName] = useState('');
  const [subCategoryName, setSubCategoryName] = useState('');
  const [serviceForm, setServiceForm] = useState<Omit<Service, 'id'>>({
    name: '', price: 0, description: '', duration: '',
  });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Delete target
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string; catId?: string; subId?: string }>({ type: '', id: '', name: '' });

  // Toggle expand
  const toggleCategory = (id: string) => {
    setExpandedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleSubCategory = (id: string) => {
    setExpandedSubCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // Filter
  const filterServices = (services: Service[]) => {
    if (!searchQuery) return services;
    const q = searchQuery.toLowerCase();
    return services.filter(s =>
      s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    );
  };

  const hasMatchInCategory = (cat: Category) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (cat.name.toLowerCase().includes(q)) return true;
    return cat.subCategories.some(sc =>
      sc.name.toLowerCase().includes(q) || sc.services.some(s =>
        s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      )
    );
  };

  // === CATEGORY ACTIONS ===
  const openAddCategory = () => {
    setCategoryName('');
    setEditingCategoryId(null);
    setShowCategoryDialog(true);
  };

  const openEditCategory = (cat: Category) => {
    setCategoryName(cat.name);
    setEditingCategoryId(cat.id);
    setShowCategoryDialog(true);
  };

  const handleSaveCategory = () => {
    if (!categoryName.trim()) return;
    if (editingCategoryId) {
      updateCategory(editingCategoryId, categoryName.trim());
      toast({ title: 'Catégorie modifiée', description: `"${categoryName}" a été mise à jour` });
    } else {
      addCategory(categoryName.trim());
      toast({ title: 'Catégorie ajoutée', description: `"${categoryName}" a été créée` });
    }
    setShowCategoryDialog(false);
  };

  // === SUB-CATEGORY ACTIONS ===
  const openAddSubCategory = (catId: string) => {
    setSubCategoryName('');
    setTargetCategoryId(catId);
    setEditingSubCategoryId(null);
    setShowSubCategoryDialog(true);
  };

  const openEditSubCategory = (catId: string, sc: SubCategory) => {
    setSubCategoryName(sc.name);
    setTargetCategoryId(catId);
    setEditingSubCategoryId(sc.id);
    setShowSubCategoryDialog(true);
  };

  const handleSaveSubCategory = () => {
    if (!subCategoryName.trim()) return;
    if (editingSubCategoryId) {
      updateSubCategory(targetCategoryId, editingSubCategoryId, subCategoryName.trim());
      toast({ title: 'Sous-catégorie modifiée', description: `"${subCategoryName}" a été mise à jour` });
    } else {
      addSubCategory(targetCategoryId, subCategoryName.trim());
      toast({ title: 'Sous-catégorie ajoutée', description: `"${subCategoryName}" a été créée` });
    }
    setShowSubCategoryDialog(false);
  };

  // === SERVICE ACTIONS ===
  const openAddService = (catId: string, subId: string) => {
    setServiceForm({ name: '', price: 0, description: '', duration: '' });
    setTargetCategoryId(catId);
    setTargetSubCategoryId(subId);
    setEditingServiceId(null);
    setShowServiceDialog(true);
  };

  const openEditService = (catId: string, subId: string, service: Service) => {
    setServiceForm({ name: service.name, price: service.price, description: service.description, duration: service.duration || '' });
    setTargetCategoryId(catId);
    setTargetSubCategoryId(subId);
    setEditingServiceId(service.id);
    setShowServiceDialog(true);
  };

  const handleSaveService = () => {
    if (!serviceForm.name.trim()) return;
    if (editingServiceId) {
      updateService(targetCategoryId, targetSubCategoryId, editingServiceId, serviceForm);
      toast({ title: 'Service modifié', description: `"${serviceForm.name}" a été mis à jour` });
    } else {
      addService(targetCategoryId, targetSubCategoryId, serviceForm);
      toast({ title: 'Service ajouté', description: `"${serviceForm.name}" a été créé` });
    }
    setShowServiceDialog(false);
  };

  // === DELETE ACTIONS ===
  const openDelete = (type: string, id: string, name: string, catId?: string, subId?: string) => {
    setDeleteTarget({ type, id, name, catId, subId });
    setShowDeleteDialog(true);
  };

  const handleDelete = () => {
    const { type, id, catId, subId, name } = deleteTarget;
    if (type === 'category') {
      deleteCategory(id);
    } else if (type === 'subcategory' && catId) {
      deleteSubCategory(catId, id);
    } else if (type === 'service' && catId && subId) {
      deleteService(catId, subId, id);
    }
    toast({ title: 'Supprimé', description: `"${name}" a été supprimé` });
    setShowDeleteDialog(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Sidebar />
        <div className="ml-0 lg:ml-64 p-6 lg:p-8">
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-white/40 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="ml-0 lg:ml-64 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Briefcase className="w-8 h-8 text-white/70" />
              <div>
                <h1 className="text-3xl font-bold text-white">Mes Services</h1>
                <p className="text-white/50 text-sm">Gérez votre catalogue de services et tarifs</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={openAddCategory}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                Catégorie
              </Button>
              <Button
                onClick={() => {
                  resetToDefaults();
                  toast({ title: 'Réinitialisé', description: 'Le catalogue par défaut a été restauré' });
                }}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Défaut
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <Card className="glass-morphism border-white/10">
              <CardContent className="p-4 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-white/70" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{getTotalServices()}</p>
                  <p className="text-white/50 text-sm">Services</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-morphism border-white/10">
              <CardContent className="p-4 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white/70" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{getTotalCategories()}</p>
                  <p className="text-white/50 text-sm">Catégories</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-morphism border-white/10 col-span-2 md:col-span-1">
              <CardContent className="p-4 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white/70" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {categories.reduce((t, c) => t + c.subCategories.reduce((t2, sc) => t2 + sc.services.length, 0), 0) > 0
                      ? formatCurrency(
                          Math.round(
                            categories.reduce((t, c) =>
                              t + c.subCategories.reduce((t2, sc) =>
                                t2 + sc.services.reduce((t3, s) => t3 + s.price, 0), 0), 0
                            ) / Math.max(getTotalServices(), 1)
                          )
                        )
                      : '0 CFA'
                    }
                  </p>
                  <p className="text-white/50 text-sm">Prix moyen</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un service..."
                className="pl-10 bg-white/5 border-white/10 text-white placeholder-white/30"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-white/40 hover:text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Categories List */}
          <div className="space-y-4">
            {categories.filter(hasMatchInCategory).map((category) => (
              <Card key={category.id} className="glass-morphism border-white/10 overflow-hidden">
                {/* Category Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center space-x-3">
                    {expandedCategories.includes(category.id) ? (
                      <ChevronDown className="w-5 h-5 text-white/50" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-white/50" />
                    )}
                    <h2 className="text-lg font-semibold text-white">{category.name}</h2>
                    <Badge className="bg-white/10 text-white/60 border-0">
                      {category.subCategories.reduce((t, sc) => t + sc.services.length, 0)} services
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white/50 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                      onClick={() => openAddSubCategory(category.id)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white/50 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                      onClick={() => openEditCategory(category)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white/50 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                      onClick={() => openDelete('category', category.id, category.name)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Sub-categories */}
                {expandedCategories.includes(category.id) && (
                  <div className="border-t border-white/5">
                    {category.subCategories.map((subCategory) => (
                      <div key={subCategory.id} className="border-b border-white/5 last:border-0">
                        {/* Sub-category header */}
                        <div
                          className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-white/5 transition-colors"
                          onClick={() => toggleSubCategory(subCategory.id)}
                        >
                          <div className="flex items-center space-x-2">
                            {expandedSubCategories.includes(subCategory.id) ? (
                              <ChevronDown className="w-4 h-4 text-white/40" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-white/40" />
                            )}
                            <span className="text-white/80 font-medium">{subCategory.name}</span>
                            <Badge className="bg-white/5 text-white/40 border-0 text-xs">
                              {subCategory.services.length}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-white/40 hover:text-white hover:bg-white/10 h-7 w-7 p-0"
                              onClick={() => openAddService(category.id, subCategory.id)}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-white/40 hover:text-white hover:bg-white/10 h-7 w-7 p-0"
                              onClick={() => openEditSubCategory(category.id, subCategory)}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-white/40 hover:text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"
                              onClick={() => openDelete('subcategory', subCategory.id, subCategory.name, category.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Services */}
                        {expandedSubCategories.includes(subCategory.id) && (
                          <div className="px-6 pb-3">
                            <div className="space-y-2">
                              {filterServices(subCategory.services).map((service) => (
                                <div
                                  key={service.id}
                                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/8 transition-colors group"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-3">
                                      <h4 className="text-white font-medium truncate">{service.name}</h4>
                                      <span className="text-white/70 font-semibold whitespace-nowrap">
                                        {formatCurrency(service.price)}
                                      </span>
                                    </div>
                                    <p className="text-white/40 text-sm truncate mt-0.5">{service.description}</p>
                                    {service.duration && (
                                      <div className="flex items-center space-x-1 mt-1">
                                        <Clock className="w-3 h-3 text-white/30" />
                                        <span className="text-white/30 text-xs">{service.duration}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-3">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-white/40 hover:text-white hover:bg-white/10 h-7 w-7 p-0"
                                      onClick={() => openEditService(category.id, subCategory.id, service)}
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-white/40 hover:text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"
                                      onClick={() => openDelete('service', service.id, service.name, category.id, subCategory.id)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}

                              {filterServices(subCategory.services).length === 0 && (
                                <p className="text-white/30 text-sm text-center py-4">
                                  {searchQuery ? 'Aucun service trouvé' : 'Aucun service dans cette sous-catégorie'}
                                </p>
                              )}

                              {/* Quick add button */}
                              <button
                                onClick={() => openAddService(category.id, subCategory.id)}
                                className="w-full flex items-center justify-center space-x-2 p-2 rounded-lg border border-dashed border-white/10 text-white/30 hover:text-white/60 hover:border-white/20 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                                <span className="text-sm">Ajouter un service</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {category.subCategories.length === 0 && (
                      <div className="p-6 text-center">
                        <p className="text-white/30 mb-3">Aucune sous-catégorie</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                          onClick={() => openAddSubCategory(category.id)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Ajouter une sous-catégorie
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}

            {categories.length === 0 && (
              <div className="text-center py-16">
                <Briefcase className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-white/60 text-lg font-medium mb-2">Aucun service configuré</h3>
                <p className="text-white/30 mb-6">Commencez par créer une catégorie de services</p>
                <Button onClick={openAddCategory} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white">
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Créer une catégorie
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === DIALOGS === */}

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="glass-morphism border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingCategoryId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Les catégories regroupent vos services par domaine
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/80">Nom de la catégorie</Label>
              <Input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Ex: Design Graphique, Conseil..."
                className="bg-white/5 border-white/10 text-white placeholder-white/30"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveCategory()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)} className="border-white/20 text-white hover:bg-white/10">
              Annuler
            </Button>
            <Button onClick={handleSaveCategory} disabled={!categoryName.trim()} className="bg-white/15 hover:bg-white/25 text-white border border-white/20">
              {editingCategoryId ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sub-Category Dialog */}
      <Dialog open={showSubCategoryDialog} onOpenChange={setShowSubCategoryDialog}>
        <DialogContent className="glass-morphism border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingSubCategoryId ? 'Modifier la sous-catégorie' : 'Nouvelle sous-catégorie'}
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Organisez vos services en sous-catégories
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/80">Nom de la sous-catégorie</Label>
              <Input
                value={subCategoryName}
                onChange={(e) => setSubCategoryName(e.target.value)}
                placeholder="Ex: Identité Visuelle, Sites Web..."
                className="bg-white/5 border-white/10 text-white placeholder-white/30"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveSubCategory()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubCategoryDialog(false)} className="border-white/20 text-white hover:bg-white/10">
              Annuler
            </Button>
            <Button onClick={handleSaveSubCategory} disabled={!subCategoryName.trim()} className="bg-white/15 hover:bg-white/25 text-white border border-white/20">
              {editingSubCategoryId ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent className="glass-morphism border-white/20 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingServiceId ? 'Modifier le service' : 'Nouveau service'}
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Définissez les détails et le tarif de votre service
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/80">Nom du service *</Label>
              <Input
                value={serviceForm.name}
                onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Logo Premium, Site Vitrine..."
                className="bg-white/5 border-white/10 text-white placeholder-white/30"
              />
            </div>
            <div>
              <Label className="text-white/80">Description</Label>
              <Textarea
                value={serviceForm.description}
                onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez ce que comprend ce service..."
                className="bg-white/5 border-white/10 text-white placeholder-white/30 min-h-20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/80">Tarif (CFA) *</Label>
                <Input
                  type="number"
                  value={serviceForm.price || ''}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                  placeholder="75000"
                  className="bg-white/5 border-white/10 text-white placeholder-white/30"
                />
              </div>
              <div>
                <Label className="text-white/80">Durée estimée</Label>
                <Input
                  value={serviceForm.duration || ''}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="Ex: 3-5 jours"
                  className="bg-white/5 border-white/10 text-white placeholder-white/30"
                />
              </div>
            </div>
            {serviceForm.price > 0 && (
              <div className="bg-white/5 p-3 rounded-lg">
                <p className="text-white/60 text-sm">Tarif affiché : <span className="text-white font-semibold">{formatCurrency(serviceForm.price)}</span></p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowServiceDialog(false)} className="border-white/20 text-white hover:bg-white/10">
              Annuler
            </Button>
            <Button
              onClick={handleSaveService}
              disabled={!serviceForm.name.trim() || serviceForm.price <= 0}
              className="bg-white/15 hover:bg-white/25 text-white border border-white/20"
            >
              {editingServiceId ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="glass-morphism border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-white/50">
              Voulez-vous vraiment supprimer "{deleteTarget.name}" ?
              {deleteTarget.type === 'category' && ' Tous les sous-catégories et services associés seront également supprimés.'}
              {deleteTarget.type === 'subcategory' && ' Tous les services associés seront également supprimés.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="border-white/20 text-white hover:bg-white/10">
              Annuler
            </Button>
            <Button onClick={handleDelete} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30">
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Services;
