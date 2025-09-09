import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  ChefHat, 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Trash2,
  Calculator,
  Package,
  Factory,
  Layers,
  Copy,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Info,
  Play,
  Save,
  FileText,
  IndianRupee,
  Clock,
  User,
  Calendar
} from 'lucide-react';
import { usePermissions } from '@/lib/permissions';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/auth-service';
import { dataManager } from '@/lib/data-manager';
import BackButton from '@/components/BackButton';

interface RecipeIngredient {
  id: string;
  materialId: string;
  materialName: string;
  materialSku: string;
  quantityRequired: number;
  unitOfMeasure: string;
  unitCost: number; // Cost per unit from inventory
  totalCost: number; // quantityRequired * unitCost
  availableStock: number;
  isOptional: boolean;
  notes?: string;
  supplierName?: string;
  category?: string;
}

interface Recipe {
  id: string;
  productName: string;
  productSku: string;
  description: string;
  category: string;
  yieldQuantity: number; // How many units this recipe produces
  yieldUnit: string;
  ingredients: RecipeIngredient[];
  totalMaterialCost: number; // Sum of all ingredient costs
  laborCost: number;
  overheadCost: number;
  totalProductionCost: number; // Material + Labor + Overhead
  costPerUnit: number; // Total cost / yield quantity
  estimatedTimeMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'draft' | 'active' | 'archived';
  createdBy: string;
  createdDate: string;
  lastModified: string;
  lastUsedDate?: string;
  totalProduced: number; // Total units produced using this recipe
  notes?: string;
  tags: string[];
}

interface RawMaterial {
  id: string;
  name: string;
  sku: string;
  unitOfMeasure: string;
  currentStock: number;
  pricePerUnit: number;
  category: string;
  supplier: string;
  minimumStock: number;
  maximumStock: number;
  lastPurchaseDate?: string;
  expiryDate?: string;
  status: 'active' | 'low_stock' | 'out_of_stock' | 'expired';
  totalValue: number;
}

interface ProductionOrder {
  id: string;
  recipeId: string;
  recipeName: string;
  productName: string;
  quantityToProduce: number;
  quantityYielded: number;
  recipesNeeded: number;
  materialRequirements: MaterialRequirement[];
  costBreakdown: CostBreakdown;
  status: 'draft' | 'ready' | 'in_progress' | 'completed' | 'cancelled' | 'insufficient_materials';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration: number;
  actualDuration?: number;
  createdBy: string;
  createdDate: string;
  startedDate?: string;
  completedDate?: string;
  notes?: string;
}

interface MaterialRequirement {
  materialId: string;
  materialName: string;
  quantityNeeded: number;
  unitOfMeasure: string;
  availableStock: number;
  shortfall: number;
  unitCost: number;
  totalCost: number;
  isAvailable: boolean;
}

interface CostBreakdown {
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  costPerUnit: number;
}

// Raw materials and recipes will be loaded from the data management system

export default function RecipeManagement() {
  const permissions = usePermissions();
  const { toast } = useToast();
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [productionQuantity, setProductionQuantity] = useState(1);

  const currentUser = authService.getCurrentUser();

  // Load real data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);

    // Load raw materials from localStorage
    const savedMaterials = localStorage.getItem('hisaabb_raw_materials');
    const materialsData = savedMaterials ? JSON.parse(savedMaterials) : [];

    // Load recipes from localStorage
    const savedRecipes = localStorage.getItem('hisaabb_recipes');
    const recipesData = savedRecipes ? JSON.parse(savedRecipes) : [];

    // Load production orders from localStorage
    const savedOrders = localStorage.getItem('hisaabb_production_orders');
    const ordersData = savedOrders ? JSON.parse(savedOrders) : [];

    // Add initial sample data if none exists
    if (materialsData.length === 0) {
      const sampleMaterials = createSampleRawMaterials();
      setRawMaterials(sampleMaterials);
      localStorage.setItem('hisaabb_raw_materials', JSON.stringify(sampleMaterials));
    } else {
      setRawMaterials(materialsData);
    }

    if (recipesData.length === 0) {
      const sampleRecipes = createSampleRecipes(materialsData.length > 0 ? materialsData : createSampleRawMaterials());
      setRecipes(sampleRecipes);
      localStorage.setItem('hisaabb_recipes', JSON.stringify(sampleRecipes));
    } else {
      setRecipes(recipesData);
    }

    setProductionOrders(ordersData);
    setLoading(false);
  };

  const saveRecipes = (recipesData: Recipe[]) => {
    localStorage.setItem('hisaabb_recipes', JSON.stringify(recipesData));
  };

  const saveRawMaterials = (materialsData: RawMaterial[]) => {
    localStorage.setItem('hisaabb_raw_materials', JSON.stringify(materialsData));
  };

  const saveProductionOrders = (ordersData: ProductionOrder[]) => {
    localStorage.setItem('hisaabb_production_orders', JSON.stringify(ordersData));
  };

  // Create sample data functions
  const createSampleRawMaterials = (): RawMaterial[] => {
    return [
      {
        id: 'rm_001',
        name: 'Wheat Flour',
        sku: 'WHEAT_001',
        unitOfMeasure: 'kg',
        currentStock: 500,
        pricePerUnit: 45.50,
        category: 'Grains',
        supplier: 'Local Supplier',
        minimumStock: 50,
        maximumStock: 1000,
        status: 'active',
        totalValue: 22750
      },
      {
        id: 'rm_002',
        name: 'Sugar',
        sku: 'SUGAR_001',
        unitOfMeasure: 'kg',
        currentStock: 200,
        pricePerUnit: 50.00,
        category: 'Sweeteners',
        supplier: 'Local Supplier',
        minimumStock: 25,
        maximumStock: 500,
        status: 'active',
        totalValue: 10000
      },
      {
        id: 'rm_003',
        name: 'Cooking Oil',
        sku: 'OIL_001',
        unitOfMeasure: 'ltr',
        currentStock: 100,
        pricePerUnit: 120.00,
        category: 'Oils',
        supplier: 'Local Supplier',
        minimumStock: 10,
        maximumStock: 200,
        status: 'active',
        totalValue: 12000
      },
      {
        id: 'rm_004',
        name: 'Salt',
        sku: 'SALT_001',
        unitOfMeasure: 'kg',
        currentStock: 50,
        pricePerUnit: 25.00,
        category: 'Seasonings',
        supplier: 'Local Supplier',
        minimumStock: 5,
        maximumStock: 100,
        status: 'active',
        totalValue: 1250
      }
    ];
  };

  const createSampleRecipes = (materials: RawMaterial[]): Recipe[] => {
    if (!currentUser) return [];

    return [
      {
        id: 'recipe_001',
        productName: 'Wheat Bread',
        productSku: 'BREAD_001',
        description: 'Fresh wheat bread with natural ingredients',
        category: 'Bakery',
        yieldQuantity: 10,
        yieldUnit: 'loaves',
        ingredients: [
          {
            id: 'ing_001',
            materialId: 'rm_001',
            materialName: 'Wheat Flour',
            materialSku: 'WHEAT_001',
            quantityRequired: 5,
            unitOfMeasure: 'kg',
            unitCost: 45.50,
            totalCost: 227.50,
            availableStock: 500,
            isOptional: false,
            category: 'Grains'
          },
          {
            id: 'ing_002',
            materialId: 'rm_003',
            materialName: 'Cooking Oil',
            materialSku: 'OIL_001',
            quantityRequired: 0.5,
            unitOfMeasure: 'ltr',
            unitCost: 120.00,
            totalCost: 60.00,
            availableStock: 100,
            isOptional: false,
            category: 'Oils'
          },
          {
            id: 'ing_003',
            materialId: 'rm_004',
            materialName: 'Salt',
            materialSku: 'SALT_001',
            quantityRequired: 0.1,
            unitOfMeasure: 'kg',
            unitCost: 25.00,
            totalCost: 2.50,
            availableStock: 50,
            isOptional: false,
            category: 'Seasonings'
          }
        ],
        totalMaterialCost: 290.00,
        laborCost: 150.00,
        overheadCost: 50.00,
        totalProductionCost: 490.00,
        costPerUnit: 49.00,
        estimatedTimeMinutes: 180,
        difficulty: 'medium',
        status: 'active',
        createdBy: currentUser.id,
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        totalProduced: 0,
        tags: ['bakery', 'bread', 'daily']
      }
    ];
  };
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showCreateRecipe, setShowCreateRecipe] = useState(false);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ingredients' | 'costing' | 'production'>('overview');

  // New recipe form state
  const [newRecipe, setNewRecipe] = useState({
    productName: '',
    productSku: '',
    description: '',
    category: '',
    yieldQuantity: 1,
    yieldUnit: 'piece',
    laborCost: 0,
    overheadCost: 0,
    estimatedTimeMinutes: 0,
    difficulty: 'medium' as const,
    notes: '',
    tags: ''
  });

  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);

  if (!permissions.hasPermission('addEditDeleteProducts')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-500">You don't have permission to access recipe management.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.productSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || recipe.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = ['all', ...Array.from(new Set(recipes.map(r => r.category)))];
  const statuses = ['all', 'draft', 'active', 'archived'];

  const getStatusBadge = (status: Recipe['status']) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800', icon: Edit },
      active: { variant: 'default' as const, color: 'bg-green-100 text-green-800', icon: CheckCircle },
      archived: { variant: 'destructive' as const, color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };
    
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={`text-xs ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getDifficultyBadge = (difficulty: Recipe['difficulty']) => {
    const difficultyConfig = {
      easy: { color: 'bg-green-100 text-green-800' },
      medium: { color: 'bg-yellow-100 text-yellow-800' },
      hard: { color: 'bg-red-100 text-red-800' }
    };
    
    return (
      <Badge variant="outline" className={`text-xs ${difficultyConfig[difficulty].color}`}>
        {difficulty.toUpperCase()}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const addIngredientToRecipe = (materialId: string) => {
    const material = rawMaterials.find(m => m.id === materialId);
    if (!material) return;

    // Check if ingredient already exists
    const existingIngredient = recipeIngredients.find(ing => ing.materialId === materialId);
    if (existingIngredient) {
      toast({
        title: "Ingredient Already Added",
        description: "This ingredient is already in the recipe",
        variant: "destructive"
      });
      return;
    }

    const newIngredient: RecipeIngredient = {
      id: `ing-${Date.now()}`,
      materialId: material.id,
      materialName: material.name,
      materialSku: material.sku,
      quantityRequired: 1,
      unitOfMeasure: material.unitOfMeasure,
      unitCost: material.pricePerUnit,
      totalCost: material.pricePerUnit,
      availableStock: material.currentStock,
      isOptional: false,
      supplierName: material.supplier,
      category: material.category
    };

    setRecipeIngredients(prev => [...prev, newIngredient]);

    toast({
      title: "Ingredient Added",
      description: `${material.name} has been added to the recipe`,
    });
  };

  const updateIngredientQuantity = (ingredientId: string, quantity: number) => {
    setRecipeIngredients(prev => prev.map(ing => 
      ing.id === ingredientId 
        ? { ...ing, quantityRequired: quantity, totalCost: quantity * ing.unitCost }
        : ing
    ));
  };

  const removeIngredient = (ingredientId: string) => {
    setRecipeIngredients(prev => prev.filter(ing => ing.id !== ingredientId));
  };

  const calculateRecipeCosts = () => {
    const totalMaterialCost = recipeIngredients.reduce((sum, ing) => sum + ing.totalCost, 0);
    const totalProductionCost = totalMaterialCost + newRecipe.laborCost + newRecipe.overheadCost;
    const costPerUnit = totalProductionCost / newRecipe.yieldQuantity;

    return { totalMaterialCost, totalProductionCost, costPerUnit };
  };

  const canProduceQuantity = (recipe: Recipe, desiredQuantity: number) => {
    const unitsPerRecipe = recipe.yieldQuantity;
    const recipesNeeded = Math.ceil(desiredQuantity / unitsPerRecipe);

    const materialRequirements: MaterialRequirement[] = [];
    let totalMaterialCost = 0;

    for (const ingredient of recipe.ingredients) {
      const totalNeeded = ingredient.quantityRequired * recipesNeeded;
      const shortfall = Math.max(0, totalNeeded - ingredient.availableStock);
      const isAvailable = shortfall === 0 || ingredient.isOptional;

      materialRequirements.push({
        materialId: ingredient.materialId,
        materialName: ingredient.materialName,
        quantityNeeded: totalNeeded,
        unitOfMeasure: ingredient.unitOfMeasure,
        availableStock: ingredient.availableStock,
        shortfall,
        unitCost: ingredient.unitCost,
        totalCost: totalNeeded * ingredient.unitCost,
        isAvailable
      });

      totalMaterialCost += totalNeeded * ingredient.unitCost;
    }

    const canProduce = materialRequirements.every(req => req.isAvailable);
    const totalLaborCost = recipe.laborCost * recipesNeeded;
    const totalOverheadCost = recipe.overheadCost * recipesNeeded;
    const totalCost = totalMaterialCost + totalLaborCost + totalOverheadCost;

    return {
      canProduce,
      materialRequirements,
      recipesNeeded,
      costBreakdown: {
        materialCost: totalMaterialCost,
        laborCost: totalLaborCost,
        overheadCost: totalOverheadCost,
        totalCost,
        costPerUnit: totalCost / desiredQuantity
      }
    };
  };

  const createProductionOrder = (recipe: Recipe, quantity: number) => {
    if (!currentUser) return;

    const analysis = canProduceQuantity(recipe, quantity);

    if (!analysis.canProduce) {
      toast({
        title: "Insufficient Materials",
        description: "Not enough raw materials to fulfill this production order",
        variant: "destructive"
      });
      return;
    }

    const newOrder: ProductionOrder = {
      id: `po_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recipeId: recipe.id,
      recipeName: recipe.productName,
      productName: recipe.productName,
      quantityToProduce: quantity,
      quantityYielded: quantity,
      recipesNeeded: analysis.recipesNeeded,
      materialRequirements: analysis.materialRequirements,
      costBreakdown: analysis.costBreakdown,
      status: 'ready',
      priority: 'medium',
      estimatedDuration: recipe.estimatedTimeMinutes * analysis.recipesNeeded,
      createdBy: currentUser.id,
      createdDate: new Date().toISOString()
    };

    const updatedOrders = [...productionOrders, newOrder];
    setProductionOrders(updatedOrders);
    saveProductionOrders(updatedOrders);

    setShowProductionModal(false);

    toast({
      title: "Production Order Created",
      description: `Production order for ${quantity} ${recipe.yieldUnit} of ${recipe.productName} has been created`,
    });
  };

  const startProduction = (orderId: string) => {
    if (!currentUser) return;

    const order = productionOrders.find(o => o.id === orderId);
    if (!order || order.status !== 'ready') return;

    // Deduct materials from inventory
    const updatedMaterials = rawMaterials.map(material => {
      const requirement = order.materialRequirements.find(req => req.materialId === material.id);
      if (requirement && requirement.isAvailable) {
        const newStock = material.currentStock - requirement.quantityNeeded;
        const newStatus = newStock <= 0 ? 'out_of_stock' : newStock <= material.minimumStock ? 'low_stock' : 'active';
        return {
          ...material,
          currentStock: Math.max(0, newStock),
          status: newStatus,
          totalValue: Math.max(0, newStock) * material.pricePerUnit
        };
      }
      return material;
    });

    // Update production order status
    const updatedOrders = productionOrders.map(o =>
      o.id === orderId
        ? {
            ...o,
            status: 'in_progress' as const,
            startedDate: new Date().toISOString()
          }
        : o
    );

    setRawMaterials(updatedMaterials);
    setProductionOrders(updatedOrders);
    saveRawMaterials(updatedMaterials);
    saveProductionOrders(updatedOrders);

    // Update recipe usage statistics
    const recipe = recipes.find(r => r.id === order.recipeId);
    if (recipe) {
      const updatedRecipes = recipes.map(r =>
        r.id === order.recipeId
          ? {
              ...r,
              lastUsedDate: new Date().toISOString(),
              totalProduced: r.totalProduced + order.quantityToProduce
            }
          : r
      );
      setRecipes(updatedRecipes);
      saveRecipes(updatedRecipes);
    }

    // Simulate adding finished goods to inventory
    const existingProducts = localStorage.getItem('hisaabb_products');
    const productsData = existingProducts ? JSON.parse(existingProducts) : [];

    const existingProduct = productsData.find((p: any) => p.name === order.productName);
    if (existingProduct) {
      existingProduct.currentStock = (existingProduct.currentStock || 0) + order.quantityToProduce;
      existingProduct.totalValue = existingProduct.currentStock * (existingProduct.sellingPrice || 0);
    } else {
      const newProduct = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: order.productName,
        sku: recipe?.productSku || `PROD_${Date.now()}`,
        category: recipe?.category || 'Manufactured',
        sellingPrice: Math.round(order.costBreakdown.costPerUnit * 1.4), // 40% markup
        costPrice: order.costBreakdown.costPerUnit,
        currentStock: order.quantityToProduce,
        minimumStock: 10,
        unit: recipe?.yieldUnit || 'piece',
        totalValue: order.quantityToProduce * Math.round(order.costBreakdown.costPerUnit * 1.4),
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id,
        isManufactured: true,
        recipeId: order.recipeId
      };
      productsData.push(newProduct);
    }

    localStorage.setItem('hisaabb_products', JSON.stringify(productsData));

    toast({
      title: "Production Started",
      description: `Production of ${order.quantityToProduce} ${recipe?.yieldUnit} of ${order.productName} has started. Materials have been deducted from inventory.`,
    });
  };

  const completeProduction = (orderId: string) => {
    if (!currentUser) return;

    const updatedOrders = productionOrders.map(o =>
      o.id === orderId
        ? {
            ...o,
            status: 'completed' as const,
            completedDate: new Date().toISOString(),
            actualDuration: o.estimatedDuration // For simplicity, using estimated duration
          }
        : o
    );

    setProductionOrders(updatedOrders);
    saveProductionOrders(updatedOrders);

    toast({
      title: "Production Completed",
      description: "Production order has been marked as completed",
    });
  };

  const createRecipe = () => {
    if (!currentUser) return;

    // Validation
    if (!newRecipe.productName.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive"
      });
      return;
    }

    if (recipeIngredients.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one ingredient is required",
        variant: "destructive"
      });
      return;
    }

    const { totalMaterialCost, totalProductionCost, costPerUnit } = calculateRecipeCosts();

    const recipe: Recipe = {
      id: `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productName: newRecipe.productName,
      productSku: newRecipe.productSku || `SKU_${Date.now()}`,
      description: newRecipe.description,
      category: newRecipe.category,
      yieldQuantity: newRecipe.yieldQuantity,
      yieldUnit: newRecipe.yieldUnit,
      ingredients: recipeIngredients,
      totalMaterialCost,
      laborCost: newRecipe.laborCost,
      overheadCost: newRecipe.overheadCost,
      totalProductionCost,
      costPerUnit,
      estimatedTimeMinutes: newRecipe.estimatedTimeMinutes,
      difficulty: newRecipe.difficulty,
      status: 'active',
      createdBy: currentUser.id,
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      totalProduced: 0,
      notes: newRecipe.notes,
      tags: newRecipe.tags ? newRecipe.tags.split(',').map(tag => tag.trim()) : []
    };

    const updatedRecipes = [...recipes, recipe];
    setRecipes(updatedRecipes);
    saveRecipes(updatedRecipes);

    // Reset form
    setNewRecipe({
      productName: '',
      productSku: '',
      description: '',
      category: '',
      yieldQuantity: 1,
      yieldUnit: 'piece',
      laborCost: 0,
      overheadCost: 0,
      estimatedTimeMinutes: 0,
      difficulty: 'medium',
      notes: '',
      tags: ''
    });
    setRecipeIngredients([]);
    setShowCreateRecipe(false);

    toast({
      title: "Recipe Created",
      description: `Recipe for ${recipe.productName} has been created successfully`,
    });
  };

  const totalRecipes = recipes.length;
  const activeRecipes = recipes.filter(r => r.status === 'active').length;
  const totalProductsProduced = recipes.reduce((sum, r) => sum + r.totalProduced, 0);
  const avgCostPerUnit = recipes.length > 0 ? recipes.reduce((sum, r) => sum + r.costPerUnit, 0) / totalRecipes : 0;

  if (!permissions.hasPermission('create_product')) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <BackButton />
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-500">You don't have permission to access recipe management.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <BackButton />
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Loading recipe management...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <div className="mb-6">
        <BackButton />
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            Recipe Management
          </h1>
          <p className="text-gray-600 mt-1">Create product recipes with automated cost calculation and material tracking</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowCreateRecipe(true)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Recipe
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipes</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecipes}</div>
            <p className="text-xs text-muted-foreground">
              {activeRecipes} active recipes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Manufactured</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalProductsProduced}</div>
            <p className="text-xs text-muted-foreground">
              Total units produced
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Orders</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{productionOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              {productionOrders.filter(o => o.status === 'in_progress').length} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Raw Materials</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rawMaterials.length}</div>
            <p className="text-xs text-muted-foreground">
              {rawMaterials.filter(m => m.status === 'low_stock').length} low stock
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recipe List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Product Recipes</CardTitle>
              <CardDescription>Manage manufacturing recipes with automated cost calculation</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search recipes by product name or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.slice(1).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {status === 'all' ? 'All Status' : status.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recipe Cards */}
              <div className="space-y-4">
                {filteredRecipes.map((recipe) => (
                  <Card
                    key={recipe.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-orange-500 ${
                      selectedRecipe?.id === recipe.id ? 'ring-2 ring-orange-500' : ''
                    }`}
                    onClick={() => setSelectedRecipe(recipe)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{recipe.productName}</h4>
                          <p className="text-sm text-gray-500">SKU: {recipe.productSku} • Yields: {recipe.yieldQuantity} {recipe.yieldUnit}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(recipe.status)}
                          {getDifficultyBadge(recipe.difficulty)}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{recipe.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Ingredients:</span>
                          <span className="font-medium ml-1">{recipe.ingredients.length} items</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Material Cost:</span>
                          <span className="font-medium ml-1">{formatCurrency(recipe.totalMaterialCost)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Cost per Unit:</span>
                          <span className="font-bold ml-1 text-blue-600">{formatCurrency(recipe.costPerUnit)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Time:</span>
                          <span className="font-medium ml-1">{recipe.estimatedTimeMinutes} min</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-3 pt-3 border-t text-xs text-gray-500">
                        <span>Produced: {recipe.totalProduced} units</span>
                        <span>Last used: {recipe.lastUsedDate ? formatDate(recipe.lastUsedDate) : 'Never'}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredRecipes.length === 0 && (
                <div className="text-center py-12">
                  <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Start by creating your first product recipe.'
                    }
                  </p>
                  <Button onClick={() => setShowCreateRecipe(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Recipe
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recipe Details */}
        <div>
          {selectedRecipe ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Recipe Details
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowProductionModal(true)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Send to Production
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg">{selectedRecipe.productName}</h3>
                    <p className="text-gray-600">{selectedRecipe.productSku}</p>
                    <div className="flex gap-2 mt-2">
                      {getStatusBadge(selectedRecipe.status)}
                      {getDifficultyBadge(selectedRecipe.difficulty)}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Yield:</span>
                      <span className="font-medium">{selectedRecipe.yieldQuantity} {selectedRecipe.yieldUnit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ingredients:</span>
                      <span className="font-medium">{selectedRecipe.ingredients.length} items</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Material Cost:</span>
                      <span className="font-medium">{formatCurrency(selectedRecipe.totalMaterialCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Labor Cost:</span>
                      <span className="font-medium">{formatCurrency(selectedRecipe.laborCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Overhead Cost:</span>
                      <span className="font-medium">{formatCurrency(selectedRecipe.overheadCost)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between">
                      <span className="text-gray-900 font-medium">Total Cost:</span>
                      <span className="font-bold text-orange-600">{formatCurrency(selectedRecipe.totalProductionCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-900 font-medium">Cost per Unit:</span>
                      <span className="font-bold text-blue-600">{formatCurrency(selectedRecipe.costPerUnit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Estimated Time:</span>
                      <span className="font-medium">{selectedRecipe.estimatedTimeMinutes} minutes</span>
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 rounded">
                    <div className="flex items-center gap-2 text-green-700">
                      <Factory className="w-4 h-4" />
                      <span className="font-medium">Production Stats</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Total produced: {selectedRecipe.totalProduced} units
                    </p>
                    <p className="text-sm text-green-600">
                      Last used: {selectedRecipe.lastUsedDate ? formatDate(selectedRecipe.lastUsedDate) : 'Never'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Ingredients List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recipe Ingredients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedRecipe.ingredients.map((ingredient) => (
                      <div key={ingredient.id} className="flex justify-between items-start p-3 bg-gray-50 rounded">
                        <div className="flex-1">
                          <h5 className="font-medium text-sm">{ingredient.materialName}</h5>
                          <p className="text-xs text-gray-500">SKU: {ingredient.materialSku}</p>
                          <div className="text-xs text-gray-600 mt-1">
                            {ingredient.quantityRequired} {ingredient.unitOfMeasure} × {formatCurrency(ingredient.unitCost)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Available: {ingredient.availableStock} {ingredient.unitOfMeasure}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm">{formatCurrency(ingredient.totalCost)}</div>
                          {ingredient.isOptional && (
                            <Badge variant="outline" className="text-xs mt-1">Optional</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Recipe Details</h3>
                <p className="text-gray-500 text-sm">
                  Select a recipe from the list to view its details, ingredients, and production information.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Production Orders Section */}
      {productionOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Production Orders</CardTitle>
            <CardDescription>Manage production workflow and inventory automation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productionOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">{order.productName}</h4>
                      <p className="text-sm text-gray-600">
                        Quantity: {order.quantityToProduce} {recipes.find(r => r.id === order.recipeId)?.yieldUnit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={{
                        'draft': 'bg-gray-100 text-gray-800',
                        'ready': 'bg-blue-100 text-blue-800',
                        'in_progress': 'bg-yellow-100 text-yellow-800',
                        'completed': 'bg-green-100 text-green-800',
                        'cancelled': 'bg-red-100 text-red-800',
                        'insufficient_materials': 'bg-red-100 text-red-800'
                      }[order.status]}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={{
                        'low': 'text-gray-600',
                        'medium': 'text-blue-600',
                        'high': 'text-orange-600',
                        'urgent': 'text-red-600'
                      }[order.priority]}>
                        {order.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Material Cost:</span>
                      <div className="font-medium">{formatCurrency(order.costBreakdown.materialCost)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Cost:</span>
                      <div className="font-medium">{formatCurrency(order.costBreakdown.totalCost)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <div className="font-medium">{order.estimatedDuration} min</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <div className="font-medium">{formatDate(order.createdDate)}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {order.status === 'ready' && (
                      <Button
                        size="sm"
                        onClick={() => startProduction(order.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Production
                      </Button>
                    )}
                    {order.status === 'in_progress' && (
                      <Button
                        size="sm"
                        onClick={() => completeProduction(order.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Complete Production
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Recipe Modal */}
      {showCreateRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-6xl max-h-[95vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Create New Recipe
                <Button variant="ghost" size="sm" onClick={() => setShowCreateRecipe(false)}>
                  ×
                </Button>
              </CardTitle>
              <CardDescription>
                Create a new manufacturing recipe with ingredients and cost calculation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name *</Label>
                  <Input
                    id="productName"
                    value={newRecipe.productName}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, productName: e.target.value }))}
                    placeholder="Enter product name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productSku">Product SKU</Label>
                  <Input
                    id="productSku"
                    value={newRecipe.productSku}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, productSku: e.target.value }))}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={newRecipe.category}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., Bakery, Beverages"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yieldQuantity">Yield Quantity</Label>
                  <Input
                    id="yieldQuantity"
                    type="number"
                    value={newRecipe.yieldQuantity}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, yieldQuantity: parseInt(e.target.value) || 1 }))}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yieldUnit">Yield Unit</Label>
                  <Input
                    id="yieldUnit"
                    value={newRecipe.yieldUnit}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, yieldUnit: e.target.value }))}
                    placeholder="e.g., pieces, kg, liters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <select
                    id="difficulty"
                    value={newRecipe.difficulty}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="laborCost">Labor Cost (₹)</Label>
                  <Input
                    id="laborCost"
                    type="number"
                    value={newRecipe.laborCost}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, laborCost: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overheadCost">Overhead Cost (₹)</Label>
                  <Input
                    id="overheadCost"
                    type="number"
                    value={newRecipe.overheadCost}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, overheadCost: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
                  <Input
                    id="estimatedTime"
                    type="number"
                    value={newRecipe.estimatedTimeMinutes}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, estimatedTimeMinutes: parseInt(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={newRecipe.description}
                  onChange={(e) => setNewRecipe(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  placeholder="Describe the product and manufacturing process"
                />
              </div>

              {/* Ingredients Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Recipe Ingredients</h3>
                  <div className="flex gap-2">
                    <select
                      onChange={(e) => e.target.value && addIngredientToRecipe(e.target.value)}
                      value=""
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Add Raw Material</option>
                      {rawMaterials
                        .filter(material => !recipeIngredients.some(ing => ing.materialId === material.id))
                        .map(material => (
                          <option key={material.id} value={material.id}>
                            {material.name} ({material.currentStock} {material.unitOfMeasure})
                          </option>
                        ))
                      }
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {recipeIngredients.map((ingredient) => (
                    <div key={ingredient.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{ingredient.materialName}</h4>
                        <p className="text-sm text-gray-500">SKU: {ingredient.materialSku} • Available: {ingredient.availableStock} {ingredient.unitOfMeasure}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={ingredient.quantityRequired}
                          onChange={(e) => updateIngredientQuantity(ingredient.id, parseFloat(e.target.value) || 0)}
                          className="w-24"
                          min="0"
                          step="0.01"
                        />
                        <span className="text-sm text-gray-500">{ingredient.unitOfMeasure}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(ingredient.totalCost)}</div>
                        <div className="text-xs text-gray-500">{formatCurrency(ingredient.unitCost)}/{ingredient.unitOfMeasure}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIngredient(ingredient.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {recipeIngredients.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No ingredients added yet. Select raw materials from the dropdown above.</p>
                  </div>
                )}
              </div>

              {/* Cost Summary */}
              {recipeIngredients.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-3">Cost Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Material Cost:</span>
                      <div className="font-medium">{formatCurrency(calculateRecipeCosts().totalMaterialCost)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Labor Cost:</span>
                      <div className="font-medium">{formatCurrency(newRecipe.laborCost)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Overhead Cost:</span>
                      <div className="font-medium">{formatCurrency(newRecipe.overheadCost)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Cost:</span>
                      <div className="font-bold text-lg">{formatCurrency(calculateRecipeCosts().totalProductionCost)}</div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cost per {newRecipe.yieldUnit}:</span>
                      <span className="font-bold text-blue-600">{formatCurrency(calculateRecipeCosts().costPerUnit)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowCreateRecipe(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={createRecipe}
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={!newRecipe.productName.trim() || recipeIngredients.length === 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Create Recipe
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Send to Production Modal */}
      {showProductionModal && selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Send to Production
                <Button variant="ghost" size="sm" onClick={() => setShowProductionModal(false)}>
                  ×
                </Button>
              </CardTitle>
              <CardDescription>
                Calculate material requirements and production costs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-lg mb-2">{selectedRecipe.productName}</h3>
                <p className="text-gray-600">Recipe yields: {selectedRecipe.yieldQuantity} {selectedRecipe.yieldUnit} per run</p>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity to Produce</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="Enter quantity"
                  min="1"
                  value={productionQuantity}
                  onChange={(e) => setProductionQuantity(parseInt(e.target.value) || 1)}
                />
              </div>

              {(() => {
                const analysis = canProduceQuantity(selectedRecipe, productionQuantity);
                return (
                  <>
                    <div className={`p-4 rounded ${analysis.canProduce ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        {analysis.canProduce ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        )}
                        <h4 className={`font-medium ${analysis.canProduce ? 'text-green-800' : 'text-red-800'}`}>
                          {analysis.canProduce ? 'Production Feasible' : 'Insufficient Materials'}
                        </h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Recipes needed:</span>
                          <span className="font-medium">{analysis.recipesNeeded} runs</span>
                        </div>
                        <div className="font-medium text-gray-700">Material Requirements:</div>
                        {analysis.materialRequirements.map((req) => (
                          <div key={req.materialId} className={`flex justify-between items-center pl-4 ${!req.isAvailable ? 'text-red-600' : ''}`}>
                            <span>{req.materialName}:</span>
                            <div className="text-right">
                              <span className="font-medium">
                                {req.quantityNeeded} {req.unitOfMeasure}
                              </span>
                              <div className="text-xs">
                                Available: {req.availableStock} {req.unitOfMeasure}
                                {req.shortfall > 0 && (
                                  <span className="text-red-600 ml-2">Short: {req.shortfall}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded">
                      <h4 className="font-medium mb-3">Cost Breakdown</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Material Cost:</span>
                          <span className="font-medium">{formatCurrency(analysis.costBreakdown.materialCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Labor Cost:</span>
                          <span className="font-medium">{formatCurrency(analysis.costBreakdown.laborCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Overhead Cost:</span>
                          <span className="font-medium">{formatCurrency(analysis.costBreakdown.overheadCost)}</span>
                        </div>
                        <hr />
                        <div className="flex justify-between font-bold">
                          <span>Total Cost:</span>
                          <span className="text-blue-600">{formatCurrency(analysis.costBreakdown.totalCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cost per Unit:</span>
                          <span className="font-medium">{formatCurrency(analysis.costBreakdown.costPerUnit)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                        onClick={() => createProductionOrder(selectedRecipe, productionQuantity)}
                        disabled={!analysis.canProduce}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Create Production Order
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowProductionModal(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
