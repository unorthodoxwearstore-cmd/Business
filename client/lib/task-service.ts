import { TaskAssignment } from '@/shared/types';
import { authService } from '@/lib/auth-service';
import { staffService } from '@/lib/staff-service';
import { notificationService } from '@/lib/notification-service';

interface CreateTaskData {
  title: string;
  description: string;
  assignedTo: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  estimatedHours?: number;
  category: 'sales' | 'inventory' | 'customer_service' | 'admin' | 'delivery' | 'production' | 'other';
  branchId?: string;
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
  checkList?: {
    text: string;
    completed: boolean;
  }[];
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  status?: 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
}

class TaskService {
  private readonly TASKS_KEY = 'hisaabb_tasks_data';
  
  private tasksDatabase = new Map<string, TaskAssignment>();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const tasksData = localStorage.getItem(this.TASKS_KEY);
      if (tasksData) {
        const tasks = JSON.parse(tasksData);
        tasks.forEach((task: TaskAssignment) => {
          this.tasksDatabase.set(task.id, task);
        });
      }
    } catch (error) {
      console.error('Error loading tasks data from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.TASKS_KEY, JSON.stringify(Array.from(this.tasksDatabase.values())));
    } catch (error) {
      console.error('Error saving tasks data to storage:', error);
    }
  }

  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateTaskStatus(): void {
    // Check for overdue tasks
    const now = new Date();
    for (const task of this.tasksDatabase.values()) {
      if (task.status === 'assigned' || task.status === 'in_progress') {
        const dueDate = new Date(task.dueDate);
        if (dueDate < now && task.status !== 'overdue') {
          const updatedTask: TaskAssignment = {
            ...task,
            status: 'overdue',
            updatedAt: new Date().toISOString()
          };
          this.tasksDatabase.set(task.id, updatedTask);
        }
      }
    }
    this.saveToStorage();
  }

  async createTask(taskData: CreateTaskData): Promise<{ success: boolean; task?: TaskAssignment; message: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user || !authService.hasPermission('assignTasksOrRoutes')) {
        return { success: false, message: 'Permission denied to create tasks' };
      }

      // Validation
      if (!taskData.title.trim()) {
        return { success: false, message: 'Task title is required' };
      }

      if (!taskData.description.trim()) {
        return { success: false, message: 'Task description is required' };
      }

      if (taskData.assignedTo.length === 0) {
        return { success: false, message: 'At least one assignee is required' };
      }

      if (!taskData.dueDate) {
        return { success: false, message: 'Due date is required' };
      }

      // Validate assignees exist
      for (const staffId of taskData.assignedTo) {
        const staff = staffService.getStaffById(staffId);
        if (!staff) {
          return { success: false, message: `Invalid staff member: ${staffId}` };
        }
      }

      const taskId = this.generateId();
      const now = new Date().toISOString();

      const task: TaskAssignment = {
        id: taskId,
        title: taskData.title,
        description: taskData.description,
        assignedTo: taskData.assignedTo,
        assignedBy: user.id,
        businessId: user.businessId,
        branchId: taskData.branchId,
        priority: taskData.priority,
        status: 'assigned',
        dueDate: taskData.dueDate,
        estimatedHours: taskData.estimatedHours,
        category: taskData.category,
        attachments: taskData.attachments || [],
        checkList: taskData.checkList?.map((item, index) => ({
          id: `checklist_${index}`,
          text: item.text,
          completed: false
        })) || [],
        comments: [],
        createdAt: now,
        updatedAt: now
      };

      this.tasksDatabase.set(taskId, task);
      this.saveToStorage();

      // Send notifications to assignees
      const assigneeNames = taskData.assignedTo.map(id => {
        const staff = staffService.getStaffById(id);
        return staff ? staff.name : 'Unknown';
      }).join(', ');

      notificationService.success('Task Created', `Task "${taskData.title}" assigned to ${assigneeNames}`);
      
      return { success: true, task, message: 'Task created successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to create task' };
    }
  }

  async updateTask(taskId: string, updates: UpdateTaskData): Promise<{ success: boolean; task?: TaskAssignment; message: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      const task = this.tasksDatabase.get(taskId);
      if (!task) {
        return { success: false, message: 'Task not found' };
      }

      if (task.businessId !== user.businessId) {
        return { success: false, message: 'Task not found' };
      }

      // Check permissions - only assignees, assigners, and managers can update
      const canUpdate = task.assignedTo.includes(user.id) || 
                       task.assignedBy === user.id || 
                       authService.hasPermission('assignTasksOrRoutes');

      if (!canUpdate) {
        return { success: false, message: 'Permission denied to update this task' };
      }

      const updatedTask: TaskAssignment = {
        ...task,
        ...updates,
        id: taskId,
        updatedAt: new Date().toISOString()
      };

      // If marking as completed, set completion time
      if (updates.status === 'completed' && task.status !== 'completed') {
        updatedTask.completedAt = new Date().toISOString();
      }

      this.tasksDatabase.set(taskId, updatedTask);
      this.saveToStorage();

      // Notify relevant parties about status changes
      if (updates.status && updates.status !== task.status) {
        const statusMessage = this.getStatusChangeMessage(updates.status);
        notificationService.info('Task Updated', `Task "${task.title}" ${statusMessage}`);
      }

      return { success: true, task: updatedTask, message: 'Task updated successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to update task' };
    }
  }

  async addComment(taskId: string, comment: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      const task = this.tasksDatabase.get(taskId);
      if (!task) {
        return { success: false, message: 'Task not found' };
      }

      if (task.businessId !== user.businessId) {
        return { success: false, message: 'Task not found' };
      }

      // Check if user can comment (assignees, assigner, managers)
      const canComment = task.assignedTo.includes(user.id) || 
                        task.assignedBy === user.id || 
                        authService.hasPermission('assignTasksOrRoutes');

      if (!canComment) {
        return { success: false, message: 'Permission denied to comment on this task' };
      }

      if (!comment.trim()) {
        return { success: false, message: 'Comment cannot be empty' };
      }

      const newComment = {
        id: this.generateId(),
        staffId: user.id,
        staffName: user.name,
        comment: comment.trim(),
        timestamp: new Date().toISOString()
      };

      const updatedTask: TaskAssignment = {
        ...task,
        comments: [...task.comments, newComment],
        updatedAt: new Date().toISOString()
      };

      this.tasksDatabase.set(taskId, updatedTask);
      this.saveToStorage();

      return { success: true, message: 'Comment added successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to add comment' };
    }
  }

  async updateChecklistItem(taskId: string, checklistItemId: string, completed: boolean): Promise<{ success: boolean; message: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      const task = this.tasksDatabase.get(taskId);
      if (!task) {
        return { success: false, message: 'Task not found' };
      }

      // Only assignees can update checklist items
      if (!task.assignedTo.includes(user.id)) {
        return { success: false, message: 'Permission denied' };
      }

      const updatedCheckList = task.checkList?.map(item => 
        item.id === checklistItemId ? { ...item, completed } : item
      ) || [];

      const updatedTask: TaskAssignment = {
        ...task,
        checkList: updatedCheckList,
        updatedAt: new Date().toISOString()
      };

      // Check if all checklist items are completed and auto-update task status
      const allCompleted = updatedCheckList.length > 0 && updatedCheckList.every(item => item.completed);
      if (allCompleted && task.status !== 'completed') {
        updatedTask.status = 'completed';
        updatedTask.completedAt = new Date().toISOString();
      }

      this.tasksDatabase.set(taskId, updatedTask);
      this.saveToStorage();

      return { success: true, message: 'Checklist updated successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to update checklist' };
    }
  }

  async deleteTask(taskId: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user || !authService.hasPermission('assignTasksOrRoutes')) {
        return { success: false, message: 'Permission denied to delete tasks' };
      }

      const task = this.tasksDatabase.get(taskId);
      if (!task) {
        return { success: false, message: 'Task not found' };
      }

      if (task.businessId !== user.businessId) {
        return { success: false, message: 'Task not found' };
      }

      // Only task creator or managers can delete
      if (task.assignedBy !== user.id && !authService.hasPermission('manage_team')) {
        return { success: false, message: 'Permission denied to delete this task' };
      }

      this.tasksDatabase.delete(taskId);
      this.saveToStorage();

      notificationService.info('Task Deleted', `Task "${task.title}" has been deleted`);
      return { success: true, message: 'Task deleted successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to delete task' };
    }
  }

  getTasks(filters?: {
    assignedTo?: string;
    assignedBy?: string;
    status?: string;
    priority?: string;
    category?: string;
    branchId?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
  }): TaskAssignment[] {
    const user = authService.getCurrentUser();
    if (!user) return [];

    this.updateTaskStatus(); // Update overdue tasks

    let tasks = Array.from(this.tasksDatabase.values())
      .filter(task => task.businessId === user.businessId);

    // If user is not manager, only show tasks assigned to them or created by them
    if (!authService.hasPermission('assignTasksOrRoutes')) {
      tasks = tasks.filter(task => 
        task.assignedTo.includes(user.id) || task.assignedBy === user.id
      );
    }

    // Apply filters
    if (filters) {
      if (filters.assignedTo) {
        tasks = tasks.filter(task => task.assignedTo.includes(filters.assignedTo!));
      }
      if (filters.assignedBy) {
        tasks = tasks.filter(task => task.assignedBy === filters.assignedBy);
      }
      if (filters.status) {
        tasks = tasks.filter(task => task.status === filters.status);
      }
      if (filters.priority) {
        tasks = tasks.filter(task => task.priority === filters.priority);
      }
      if (filters.category) {
        tasks = tasks.filter(task => task.category === filters.category);
      }
      if (filters.branchId) {
        tasks = tasks.filter(task => task.branchId === filters.branchId);
      }
      if (filters.dueDateFrom) {
        tasks = tasks.filter(task => task.dueDate >= filters.dueDateFrom!);
      }
      if (filters.dueDateTo) {
        tasks = tasks.filter(task => task.dueDate <= filters.dueDateTo!);
      }
    }

    return tasks.sort((a, b) => {
      // Sort by priority first (urgent > high > medium > low)
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by due date
      return a.dueDate.localeCompare(b.dueDate);
    });
  }

  getTaskById(taskId: string): TaskAssignment | null {
    const user = authService.getCurrentUser();
    if (!user) return null;

    const task = this.tasksDatabase.get(taskId);
    if (!task || task.businessId !== user.businessId) {
      return null;
    }

    // Check if user has permission to view this task
    const canView = task.assignedTo.includes(user.id) || 
                   task.assignedBy === user.id || 
                   authService.hasPermission('assignTasksOrRoutes');

    return canView ? task : null;
  }

  getTaskStats(staffId?: string): {
    total: number;
    assigned: number;
    inProgress: number;
    completed: number;
    overdue: number;
    byPriority: Record<string, number>;
    byCategory: Record<string, number>;
  } {
    const user = authService.getCurrentUser();
    if (!user) {
      return {
        total: 0, assigned: 0, inProgress: 0, completed: 0, overdue: 0,
        byPriority: {}, byCategory: {}
      };
    }

    this.updateTaskStatus(); // Update overdue tasks

    let tasks = Array.from(this.tasksDatabase.values())
      .filter(task => task.businessId === user.businessId);

    if (staffId) {
      tasks = tasks.filter(task => task.assignedTo.includes(staffId));
    } else if (!authService.hasPermission('assignTasksOrRoutes')) {
      // Show only user's own tasks
      tasks = tasks.filter(task => task.assignedTo.includes(user.id));
    }

    const stats = {
      total: tasks.length,
      assigned: tasks.filter(t => t.status === 'assigned').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => t.status === 'overdue').length,
      byPriority: {} as Record<string, number>,
      byCategory: {} as Record<string, number>
    };

    // Count by priority
    tasks.forEach(task => {
      stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
    });

    // Count by category
    tasks.forEach(task => {
      stats.byCategory[task.category] = (stats.byCategory[task.category] || 0) + 1;
    });

    return stats;
  }

  getMyTasks(): TaskAssignment[] {
    const user = authService.getCurrentUser();
    if (!user) return [];

    return this.getTasks({ assignedTo: user.id });
  }

  getOverdueTasks(): TaskAssignment[] {
    this.updateTaskStatus();
    return this.getTasks({ status: 'overdue' });
  }

  private getStatusChangeMessage(status: string): string {
    const messages = {
      assigned: 'has been assigned',
      in_progress: 'is now in progress',
      completed: 'has been completed',
      cancelled: 'has been cancelled',
      overdue: 'is now overdue'
    };
    return messages[status as keyof typeof messages] || 'status updated';
  }

  // Get task categories available for the business type
  getTaskCategories(): { value: string; label: string }[] {
    const user = authService.getCurrentUser();
    if (!user) return [];

    const allCategories = [
      { value: 'sales', label: 'Sales' },
      { value: 'inventory', label: 'Inventory' },
      { value: 'customer_service', label: 'Customer Service' },
      { value: 'admin', label: 'Administration' },
      { value: 'delivery', label: 'Delivery' },
      { value: 'other', label: 'Other' }
    ];

    // Add production category for manufacturers
    if (user.businessType === 'manufacturer') {
      allCategories.splice(-1, 0, { value: 'production', label: 'Production' });
    }

    return allCategories;
  }
}

export const taskService = new TaskService();
export type { TaskAssignment, CreateTaskData, UpdateTaskData };
