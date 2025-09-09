import { UserRole } from '@shared/types';

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  contact: {
    phone: string;
    email?: string;
  };
  managerId?: string;
  managerName?: string;
  timezone?: string;
  taxIds?: {
    gstNumber?: string;
    panNumber?: string;
    cinNumber?: string;
  };
  defaultCurrency: string;
  status: 'active' | 'inactive';
  businessId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  
  // Analytics metadata
  totalStaff: number;
  totalSales: number;
  totalRevenue: number;
  lastSaleDate?: string;
  
  // UI preferences
  isFavorite: boolean;
  displayOrder: number;
}

export interface BranchAssignment {
  id: string;
  userId: string;
  branchId: string;
  role: UserRole;
  assignedAt: string;
  assignedBy: string;
  permissions: string[];
  isActive: boolean;
}

export interface BranchContext {
  currentBranchId: string | null; // null means "All Branches"
  availableBranches: Branch[];
  userAssignments: BranchAssignment[];
  canSwitchBranches: boolean;
  canViewAllBranches: boolean;
}

export interface UserBranchPreferences {
  userId: string;
  lastBranchId: string | null;
  favoriteBranchIds: string[];
  branchDisplayOrder: { [branchId: string]: number };
  updatedAt: string;
}

class BranchService {
  private readonly BRANCHES_KEY = 'insygth_branches';
  private readonly ASSIGNMENTS_KEY = 'insygth_branch_assignments';
  private readonly PREFERENCES_KEY = 'insygth_branch_preferences';
  private readonly CURRENT_BRANCH_KEY = 'insygth_current_branch';

  private currentBranchId: string | null = null;
  private contextChangeListeners: ((context: BranchContext) => void)[] = [];

  // Performance caching
  private branchCache: Map<string, Branch> = new Map();
  private contextCache: Map<string, BranchContext> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeService();
  }

  // Cache management
  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private setCacheExpiry(key: string): void {
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  private clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.branchCache.keys()) {
        if (key.includes(pattern)) {
          this.branchCache.delete(key);
          this.cacheExpiry.delete(key);
        }
      }
      for (const key of this.contextCache.keys()) {
        if (key.includes(pattern)) {
          this.contextCache.delete(key);
          this.cacheExpiry.delete(key);
        }
      }
    } else {
      this.branchCache.clear();
      this.contextCache.clear();
      this.cacheExpiry.clear();
    }
  }

  private initializeService() {
    // Load current branch from localStorage
    const savedBranchId = localStorage.getItem(this.CURRENT_BRANCH_KEY);
    this.currentBranchId = savedBranchId;
    
    // Initialize default branch if none exists
    this.ensureDefaultBranchExists();
  }

  private ensureDefaultBranchExists() {
    const branches = this.getAllBranches();
    if (branches.length === 0) {
      const defaultBranch: Branch = {
        id: 'default-branch',
        name: 'Main Branch',
        code: 'MAIN',
        address: '',
        contact: { phone: '' },
        defaultCurrency: 'INR',
        status: 'active',
        businessId: 'default-business',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        totalStaff: 0,
        totalSales: 0,
        totalRevenue: 0,
        isFavorite: true,
        displayOrder: 1
      };
      this.createBranch(defaultBranch);
      this.setCurrentBranch(defaultBranch.id);
    }
  }

  // Branch CRUD Operations
  getAllBranches(): Branch[] {
    try {
      const branchesStr = localStorage.getItem(this.BRANCHES_KEY);
      return branchesStr ? JSON.parse(branchesStr) : [];
    } catch (error) {
      console.error('Error loading branches:', error);
      return [];
    }
  }

  getBranchById(branchId: string): Branch | null {
    // Check cache first
    const cacheKey = `branch_${branchId}`;
    if (this.isCacheValid(cacheKey) && this.branchCache.has(cacheKey)) {
      return this.branchCache.get(cacheKey) || null;
    }

    const branches = this.getAllBranches();
    const branch = branches.find(branch => branch.id === branchId) || null;

    // Cache the result
    if (branch) {
      this.branchCache.set(cacheKey, branch);
      this.setCacheExpiry(cacheKey);
    }

    return branch;
  }

  getActiveBranches(): Branch[] {
    return this.getAllBranches().filter(branch => branch.status === 'active');
  }

  createBranch(branchData: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>): Branch {
    const branches = this.getAllBranches();
    const newBranch: Branch = {
      ...branchData,
      id: `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    branches.push(newBranch);
    localStorage.setItem(this.BRANCHES_KEY, JSON.stringify(branches));

    // Clear cache for branch-related data
    this.clearCache('branch');
    this.clearCache('context');

    this.notifyContextChange();
    return newBranch;
  }

  updateBranch(branchId: string, updates: Partial<Branch>): Branch | null {
    const branches = this.getAllBranches();
    const branchIndex = branches.findIndex(branch => branch.id === branchId);

    if (branchIndex === -1) return null;

    branches[branchIndex] = {
      ...branches[branchIndex],
      ...updates,
      id: branchId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(this.BRANCHES_KEY, JSON.stringify(branches));

    // Clear specific branch cache and related context
    this.branchCache.delete(`branch_${branchId}`);
    this.clearCache('context');

    this.notifyContextChange();
    return branches[branchIndex];
  }

  deleteBranch(branchId: string): boolean {
    const branches = this.getAllBranches();
    const filteredBranches = branches.filter(branch => branch.id !== branchId);
    
    if (filteredBranches.length === branches.length) return false;
    
    localStorage.setItem(this.BRANCHES_KEY, JSON.stringify(filteredBranches));
    
    // If current branch was deleted, switch to first available branch
    if (this.currentBranchId === branchId) {
      const firstBranch = filteredBranches.find(b => b.status === 'active');
      this.setCurrentBranch(firstBranch?.id || null);
    }
    
    this.notifyContextChange();
    return true;
  }

  // Branch Assignment Management
  getAllAssignments(): BranchAssignment[] {
    try {
      const assignmentsStr = localStorage.getItem(this.ASSIGNMENTS_KEY);
      return assignmentsStr ? JSON.parse(assignmentsStr) : [];
    } catch (error) {
      console.error('Error loading branch assignments:', error);
      return [];
    }
  }

  getUserAssignments(userId: string): BranchAssignment[] {
    return this.getAllAssignments().filter(assignment => 
      assignment.userId === userId && assignment.isActive
    );
  }

  getBranchAssignments(branchId: string): BranchAssignment[] {
    return this.getAllAssignments().filter(assignment => 
      assignment.branchId === branchId && assignment.isActive
    );
  }

  assignUserToBranch(userId: string, branchId: string, role: UserRole, permissions: string[], assignedBy: string): BranchAssignment {
    const assignments = this.getAllAssignments();
    const newAssignment: BranchAssignment = {
      id: `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      branchId,
      role,
      permissions,
      assignedAt: new Date().toISOString(),
      assignedBy,
      isActive: true
    };
    
    assignments.push(newAssignment);
    localStorage.setItem(this.ASSIGNMENTS_KEY, JSON.stringify(assignments));
    
    this.notifyContextChange();
    return newAssignment;
  }

  removeUserFromBranch(userId: string, branchId: string): boolean {
    const assignments = this.getAllAssignments();
    const updatedAssignments = assignments.map(assignment => 
      assignment.userId === userId && assignment.branchId === branchId
        ? { ...assignment, isActive: false }
        : assignment
    );
    
    localStorage.setItem(this.ASSIGNMENTS_KEY, JSON.stringify(updatedAssignments));
    this.notifyContextChange();
    return true;
  }

  // Branch Context Management
  getCurrentBranchId(): string | null {
    return this.currentBranchId;
  }

  setCurrentBranch(branchId: string | null): void {
    this.currentBranchId = branchId;
    
    if (branchId) {
      localStorage.setItem(this.CURRENT_BRANCH_KEY, branchId);
    } else {
      localStorage.removeItem(this.CURRENT_BRANCH_KEY);
    }
    
    // Update user preferences
    this.updateUserPreferences({ lastBranchId: branchId });
    this.notifyContextChange();
  }

  getCurrentBranch(): Branch | null {
    if (!this.currentBranchId) return null;
    return this.getBranchById(this.currentBranchId);
  }

  // User Preferences
  getUserPreferences(userId: string): UserBranchPreferences | null {
    try {
      const preferencesStr = localStorage.getItem(`${this.PREFERENCES_KEY}_${userId}`);
      return preferencesStr ? JSON.parse(preferencesStr) : null;
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return null;
    }
  }

  updateUserPreferences(updates: Partial<UserBranchPreferences>): void {
    const userId = 'current_user'; // TODO: Get from auth service
    const currentPrefs = this.getUserPreferences(userId) || {
      userId,
      lastBranchId: null,
      favoriteBranchIds: [],
      branchDisplayOrder: {},
      updatedAt: new Date().toISOString()
    };
    
    const updatedPrefs: UserBranchPreferences = {
      ...currentPrefs,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(`${this.PREFERENCES_KEY}_${userId}`, JSON.stringify(updatedPrefs));
  }

  toggleFavoriteBranch(branchId: string): void {
    const userId = 'current_user';
    const prefs = this.getUserPreferences(userId);
    const currentFavorites = prefs?.favoriteBranchIds || [];
    
    const newFavorites = currentFavorites.includes(branchId)
      ? currentFavorites.filter(id => id !== branchId)
      : [...currentFavorites, branchId];
    
    this.updateUserPreferences({ favoriteBranchIds: newFavorites });
    
    // Also update the branch's favorite status
    this.updateBranch(branchId, { isFavorite: newFavorites.includes(branchId) });
  }

  // Context and Permissions
  getBranchContext(userRole: UserRole, userId: string): BranchContext {
    // Check cache first
    const cacheKey = `context_${userRole}_${userId}_${this.currentBranchId}`;
    if (this.isCacheValid(cacheKey) && this.contextCache.has(cacheKey)) {
      return this.contextCache.get(cacheKey)!;
    }
    const allBranches = this.getActiveBranches();
    const userAssignments = this.getUserAssignments(userId);
    
    // Determine which branches user can access
    let availableBranches: Branch[];
    let canSwitchBranches: boolean;
    let canViewAllBranches: boolean;
    
    switch (userRole) {
      case 'owner':
        availableBranches = allBranches;
        canSwitchBranches = true;
        canViewAllBranches = true;
        break;
        
      case 'co_founder':
      case 'manager':
        const assignedBranchIds = userAssignments.map(a => a.branchId);
        availableBranches = allBranches.filter(branch => assignedBranchIds.includes(branch.id));
        canSwitchBranches = availableBranches.length > 1;
        canViewAllBranches = userRole === 'co_founder';
        break;
        
      default:
        // Staff roles - only assigned branches
        const staffBranchIds = userAssignments.map(a => a.branchId);
        availableBranches = allBranches.filter(branch => staffBranchIds.includes(branch.id));
        canSwitchBranches = false; // Most staff only see one branch
        canViewAllBranches = false;
        break;
    }
    
    const context: BranchContext = {
      currentBranchId: this.currentBranchId,
      availableBranches,
      userAssignments,
      canSwitchBranches,
      canViewAllBranches
    };

    // Cache the context (reuse the same cacheKey from above)
    this.contextCache.set(cacheKey, context);
    this.setCacheExpiry(cacheKey);

    return context;
  }

  // Analytics Helpers
  updateBranchAnalytics(branchId: string, updates: { salesCount?: number; revenue?: number; lastSaleDate?: string }): void {
    const branch = this.getBranchById(branchId);
    if (!branch) return;
    
    this.updateBranch(branchId, {
      totalSales: updates.salesCount ?? branch.totalSales,
      totalRevenue: updates.revenue ?? branch.totalRevenue,
      lastSaleDate: updates.lastSaleDate ?? branch.lastSaleDate
    });
  }

  // Search and Filtering
  searchBranches(query: string): Branch[] {
    const branches = this.getActiveBranches();
    const searchTerm = query.toLowerCase();
    
    return branches.filter(branch =>
      branch.name.toLowerCase().includes(searchTerm) ||
      branch.code.toLowerCase().includes(searchTerm) ||
      branch.address.toLowerCase().includes(searchTerm)
    );
  }

  getFavoriteBranches(userId: string): Branch[] {
    const prefs = this.getUserPreferences(userId);
    const favoriteIds = prefs?.favoriteBranchIds || [];
    const allBranches = this.getActiveBranches();
    
    return allBranches.filter(branch => favoriteIds.includes(branch.id));
  }

  // Context Change Notifications
  onContextChange(listener: (context: BranchContext) => void): () => void {
    this.contextChangeListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.contextChangeListeners.indexOf(listener);
      if (index > -1) {
        this.contextChangeListeners.splice(index, 1);
      }
    };
  }

  private notifyContextChange(): void {
    const context = this.getBranchContext('owner', 'current_user'); // TODO: Get actual user role
    this.contextChangeListeners.forEach(listener => listener(context));
  }

  // Utility Methods
  canUserAccessBranch(userId: string, branchId: string, userRole: UserRole): boolean {
    if (userRole === 'owner') return true;
    
    const assignments = this.getUserAssignments(userId);
    return assignments.some(assignment => assignment.branchId === branchId && assignment.isActive);
  }

  getBranchDisplayName(branchId: string | null): string {
    if (branchId === null) return 'All Branches';
    
    const branch = this.getBranchById(branchId);
    return branch ? `${branch.name} (${branch.code})` : 'Unknown Branch';
  }

  // Data Filtering by Branch
  filterDataByCurrentBranch<T extends { branchId?: string }>(data: T[]): T[] {
    if (this.currentBranchId === null) {
      // "All Branches" - return all data
      return data;
    }
    
    // Filter by current branch
    return data.filter(item => item.branchId === this.currentBranchId);
  }

  // Ensure data has branch context
  addBranchContext<T>(data: T): T & { branchId: string } {
    const currentBranch = this.getCurrentBranch();
    const branchId = currentBranch?.id || 'default-branch';

    // Validate that the current branch is active
    if (currentBranch && currentBranch.status !== 'active') {
      console.warn(`Warning: Adding data to inactive branch: ${currentBranch.name}`);
    }

    return {
      ...data,
      branchId
    };
  }

  // Validation helpers
  validateBranchOperation(branchId: string, operation: string): boolean {
    const branch = this.getBranchById(branchId);

    if (!branch) {
      console.error(`Cannot ${operation}: Branch ${branchId} not found`);
      return false;
    }

    if (branch.status !== 'active') {
      console.error(`Cannot ${operation}: Branch ${branch.name} is inactive`);
      return false;
    }

    return true;
  }

  // Cross-branch operation protection
  confirmCrossBranchOperation(fromBranch: string, toBranch: string, operation: string): boolean {
    if (fromBranch === toBranch) return true;

    const fromBranchData = this.getBranchById(fromBranch);
    const toBranchData = this.getBranchById(toBranch);

    if (!fromBranchData || !toBranchData) {
      console.error(`Cross-branch ${operation} failed: Invalid branch references`);
      return false;
    }

    // In a real implementation, this might show a confirmation dialog
    console.log(`Cross-branch ${operation}: ${fromBranchData.name} → ${toBranchData.name}`);
    return true;
  }
}

export const branchService = new BranchService();
