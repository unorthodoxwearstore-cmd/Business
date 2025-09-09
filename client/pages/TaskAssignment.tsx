import React, { useState, useEffect } from 'react';
import { Plus, Filter, Calendar, Clock, AlertCircle, CheckCircle, User, MessageSquare, Paperclip, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { taskService, TaskAssignment, CreateTaskData } from '@/lib/task-service';
import { staffService, StaffMember } from '@/lib/staff-service';
import { authService } from '@/lib/auth-service';

export default function TaskAssignment() {
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskAssignment | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignedTo: 'all',
    category: 'all'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [createTaskForm, setCreateTaskForm] = useState<CreateTaskData>({
    title: '',
    description: '',
    assignedTo: [],
    priority: 'medium',
    dueDate: '',
    estimatedHours: undefined,
    category: 'other',
    checkList: []
  });

  const user = authService.getCurrentUser();
  const canAssignTasks = authService.hasPermission('assignTasksOrRoutes');

  useEffect(() => {
    loadTasks();
    loadStaff();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [filters]);

  const loadTasks = () => {
    const filterParams = {
      ...(filters.status !== 'all' && { status: filters.status }),
      ...(filters.priority !== 'all' && { priority: filters.priority }),
      ...(filters.assignedTo !== 'all' && { assignedTo: filters.assignedTo }),
      ...(filters.category !== 'all' && { category: filters.category })
    };

    const taskList = taskService.getTasks(filterParams);
    setTasks(taskList);
  };

  const loadStaff = () => {
    const staffList = staffService.getStaffList();
    setStaff(staffList);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!createTaskForm.title.trim() || !createTaskForm.description.trim()) {
        setError('Title and description are required');
        return;
      }

      if (createTaskForm.assignedTo.length === 0) {
        setError('At least one assignee is required');
        return;
      }

      const result = await taskService.createTask(createTaskForm);
      
      if (result.success) {
        loadTasks();
        setIsCreateTaskOpen(false);
        resetCreateTaskForm();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    const result = await taskService.updateTask(taskId, { status: status as any });
    if (result.success) {
      loadTasks();
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(result.task!);
      }
    }
  };

  const handleAddComment = async (taskId: string) => {
    if (!newComment.trim()) return;

    const result = await taskService.addComment(taskId, newComment);
    if (result.success) {
      setNewComment('');
      // Reload task details
      const updatedTask = taskService.getTaskById(taskId);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    }
  };

  const handleUpdateChecklist = async (taskId: string, checklistItemId: string, completed: boolean) => {
    const result = await taskService.updateChecklistItem(taskId, checklistItemId, completed);
    if (result.success) {
      loadTasks();
      const updatedTask = taskService.getTaskById(taskId);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    }
  };

  const resetCreateTaskForm = () => {
    setCreateTaskForm({
      title: '',
      description: '',
      assignedTo: [],
      priority: 'medium',
      dueDate: '',
      estimatedHours: undefined,
      category: 'other',
      checkList: []
    });
    setError('');
  };

  const addChecklistItem = () => {
    setCreateTaskForm(prev => ({
      ...prev,
      checkList: [
        ...(prev.checkList || []),
        { text: '', completed: false }
      ]
    }));
  };

  const updateChecklistItem = (index: number, text: string) => {
    setCreateTaskForm(prev => ({
      ...prev,
      checkList: prev.checkList?.map((item, i) => 
        i === index ? { ...item, text } : item
      ) || []
    }));
  };

  const removeChecklistItem = (index: number) => {
    setCreateTaskForm(prev => ({
      ...prev,
      checkList: prev.checkList?.filter((_, i) => i !== index) || []
    }));
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
      overdue: 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || variants.assigned;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return variants[priority as keyof typeof variants] || variants.medium;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Calendar className="h-4 w-4 text-blue-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== 'completed';
  };

  const getTaskStats = () => {
    return taskService.getTaskStats();
  };

  const taskStats = getTaskStats();
  const taskCategories = taskService.getTaskCategories();

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>Please log in to access task management.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600">Assign, track, and manage team tasks</p>
        </div>
        
        {canAssignTasks && (
          <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetCreateTaskForm}>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4">
                {error && (
                  <Alert>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="title">Task Title *</Label>
                    <Input
                      id="title"
                      value={createTaskForm.title}
                      onChange={(e) => setCreateTaskForm(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={createTaskForm.description}
                      onChange={(e) => setCreateTaskForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select 
                      value={createTaskForm.priority} 
                      onValueChange={(value: any) => setCreateTaskForm(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={createTaskForm.category} 
                      onValueChange={(value: any) => setCreateTaskForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {taskCategories.map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dueDate">Due Date *</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={createTaskForm.dueDate}
                      onChange={(e) => setCreateTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="estimatedHours">Estimated Hours</Label>
                    <Input
                      id="estimatedHours"
                      type="number"
                      min="0"
                      step="0.5"
                      value={createTaskForm.estimatedHours || ''}
                      onChange={(e) => setCreateTaskForm(prev => ({ 
                        ...prev, 
                        estimatedHours: e.target.value ? parseFloat(e.target.value) : undefined 
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Assign To *</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                    {staff.map(staffMember => (
                      <label key={staffMember.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={createTaskForm.assignedTo.includes(staffMember.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setCreateTaskForm(prev => ({
                                ...prev,
                                assignedTo: [...prev.assignedTo, staffMember.id]
                              }));
                            } else {
                              setCreateTaskForm(prev => ({
                                ...prev,
                                assignedTo: prev.assignedTo.filter(id => id !== staffMember.id)
                              }));
                            }
                          }}
                        />
                        <span className="text-sm">{staffMember.name} - {staffMember.role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Checklist (Optional)</Label>
                    <Button type="button" size="sm" variant="outline" onClick={addChecklistItem}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {createTaskForm.checkList?.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={item.text}
                          onChange={(e) => updateChecklistItem(index, e.target.value)}
                          placeholder="Checklist item..."
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removeChecklistItem(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateTaskOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Task'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
            <div className="text-sm text-gray-600">Total Tasks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{taskStats.assigned}</div>
            <div className="text-sm text-gray-600">Assigned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{taskStats.inProgress}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            {canAssignTasks && (
              <Select value={filters.assignedTo} onValueChange={(value) => setFilters(prev => ({ ...prev, assignedTo: value }))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Assigned To" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staff.map(staffMember => (
                    <SelectItem key={staffMember.id} value={staffMember.id}>
                      {staffMember.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow cursor-pointer" 
                  onClick={() => { setSelectedTask(task); setIsTaskDetailOpen(true); }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(task.status)}
                      <h3 className="font-semibold">{task.title}</h3>
                      <Badge className={getPriorityBadge(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge className={getStatusBadge(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 text-sm">{task.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Due: {formatDate(task.dueDate)}</span>
                      <span>Category: {task.category.replace('_', ' ')}</span>
                      {task.estimatedHours && <span>Est: {task.estimatedHours}h</span>}
                    </div>

                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span className="text-sm">
                        {task.assignedTo.map(id => {
                          const staffMember = staff.find(s => s.id === id);
                          return staffMember?.name;
                        }).filter(Boolean).join(', ')}
                      </span>
                    </div>

                    {task.checkList && task.checkList.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">
                          {task.checkList.filter(item => item.completed).length}/{task.checkList.length} completed
                        </span>
                        <Progress 
                          value={(task.checkList.filter(item => item.completed).length / task.checkList.length) * 100} 
                          className="w-24 h-2" 
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2">
                    {task.assignedTo.includes(user.id) && task.status !== 'completed' && (
                      <Select 
                        value={task.status} 
                        onValueChange={(value) => handleUpdateTaskStatus(task.id, value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    
                    {isOverdue(task.dueDate, task.status) && (
                      <Badge className="bg-red-100 text-red-800">
                        Overdue
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="my-tasks" className="space-y-4">
          {tasks.filter(task => task.assignedTo.includes(user.id)).map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow cursor-pointer" 
                  onClick={() => { setSelectedTask(task); setIsTaskDetailOpen(true); }}>
              <CardContent className="p-4">
                {/* Same task card content as above */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(task.status)}
                      <h3 className="font-semibold">{task.title}</h3>
                      <Badge className={getPriorityBadge(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge className={getStatusBadge(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 text-sm">{task.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Due: {formatDate(task.dueDate)}</span>
                      <span>Category: {task.category.replace('_', ' ')}</span>
                      {task.estimatedHours && <span>Est: {task.estimatedHours}h</span>}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    {task.status !== 'completed' && (
                      <Select 
                        value={task.status} 
                        onValueChange={(value) => handleUpdateTaskStatus(task.id, value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          {tasks.filter(task => isOverdue(task.dueDate, task.status)).map((task) => (
            <Card key={task.id} className="border-red-200 hover:shadow-md transition-shadow cursor-pointer" 
                  onClick={() => { setSelectedTask(task); setIsTaskDetailOpen(true); }}>
              <CardContent className="p-4">
                {/* Same task card content with red styling */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <h3 className="font-semibold text-red-800">{task.title}</h3>
                      <Badge className={getPriorityBadge(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge className="bg-red-100 text-red-800">
                        Overdue
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 text-sm">{task.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-red-600">
                      <span>Due: {formatDate(task.dueDate)}</span>
                      <span>Category: {task.category.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500">
            {canAssignTasks ? 'Create your first task to get started' : 'No tasks have been assigned to you yet'}
          </p>
        </div>
      )}

      {/* Task Detail Dialog */}
      <Dialog open={isTaskDetailOpen} onOpenChange={setIsTaskDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  {getStatusIcon(selectedTask.status)}
                  <span>{selectedTask.title}</span>
                  <Badge className={getPriorityBadge(selectedTask.priority)}>
                    {selectedTask.priority}
                  </Badge>
                  <Badge className={getStatusBadge(selectedTask.status)}>
                    {selectedTask.status.replace('_', ' ')}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-gray-700">{selectedTask.description}</p>
                  </div>

                  {selectedTask.checkList && selectedTask.checkList.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Checklist</h4>
                      <div className="space-y-2">
                        {selectedTask.checkList.map((item) => (
                          <label key={item.id} className="flex items-center space-x-2">
                            <Checkbox
                              checked={item.completed}
                              onCheckedChange={(checked) => 
                                handleUpdateChecklist(selectedTask.id, item.id, !!checked)
                              }
                              disabled={!selectedTask.assignedTo.includes(user.id)}
                            />
                            <span className={item.completed ? 'line-through text-gray-500' : ''}>
                              {item.text}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium mb-2">Comments</h4>
                    <div className="space-y-3 max-h-40 overflow-y-auto">
                      {selectedTask.comments.map((comment) => (
                        <div key={comment.id} className="p-3 bg-gray-50 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{comment.staffName}</span>
                            <span className="text-xs text-gray-500">
                              {formatDateTime(comment.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm">{comment.comment}</p>
                        </div>
                      ))}
                    </div>
                    
                    {selectedTask.assignedTo.includes(user.id) || canAssignTasks ? (
                      <div className="mt-3 flex space-x-2">
                        <Input
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="flex-1"
                        />
                        <Button
                          onClick={() => handleAddComment(selectedTask.id)}
                          disabled={!newComment.trim()}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Task Details</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <Badge className={`ml-2 ${getStatusBadge(selectedTask.status)}`}>
                          {selectedTask.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-gray-500">Priority:</span>
                        <Badge className={`ml-2 ${getPriorityBadge(selectedTask.priority)}`}>
                          {selectedTask.priority}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-gray-500">Category:</span>
                        <span className="ml-2">{selectedTask.category.replace('_', ' ')}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Due Date:</span>
                        <span className={`ml-2 ${isOverdue(selectedTask.dueDate, selectedTask.status) ? 'text-red-600 font-medium' : ''}`}>
                          {formatDate(selectedTask.dueDate)}
                        </span>
                      </div>
                      {selectedTask.estimatedHours && (
                        <div>
                          <span className="text-gray-500">Estimated Hours:</span>
                          <span className="ml-2">{selectedTask.estimatedHours}h</span>
                        </div>
                      )}
                      {selectedTask.actualHours && (
                        <div>
                          <span className="text-gray-500">Actual Hours:</span>
                          <span className="ml-2">{selectedTask.actualHours}h</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <span className="ml-2">{formatDateTime(selectedTask.createdAt)}</span>
                      </div>
                      {selectedTask.completedAt && (
                        <div>
                          <span className="text-gray-500">Completed:</span>
                          <span className="ml-2">{formatDateTime(selectedTask.completedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Assigned To</h4>
                    <div className="space-y-1">
                      {selectedTask.assignedTo.map(id => {
                        const staffMember = staff.find(s => s.id === id);
                        return staffMember ? (
                          <div key={id} className="flex items-center space-x-2 text-sm">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs text-blue-600">
                                {staffMember.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span>{staffMember.name}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>

                  {selectedTask.assignedTo.includes(user.id) && selectedTask.status !== 'completed' && (
                    <div>
                      <h4 className="font-medium mb-2">Update Status</h4>
                      <Select 
                        value={selectedTask.status} 
                        onValueChange={(value) => handleUpdateTaskStatus(selectedTask.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
