import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Clock, CheckCircle, AlertCircle, X, Paperclip, Send, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authService } from '@/lib/auth-service';
import { staffService } from '@/lib/staff-service';

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'hr' | 'finance' | 'inventory' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdBy: string;
  createdByName: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  attachments: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  replies: {
    id: string;
    message: string;
    sentBy: string;
    sentByName: string;
    sentAt: string;
    isStaff: boolean;
  }[];
}

interface CreateTicketData {
  title: string;
  description: string;
  category: 'technical' | 'hr' | 'finance' | 'inventory' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export default function SupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [isTicketDetailOpen, setIsTicketDetailOpen] = useState(false);
  const [newReply, setNewReply] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [createTicketForm, setCreateTicketForm] = useState<CreateTicketData>({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium'
  });

  const user = authService.getCurrentUser();
  const canManageTickets = authService.hasPermission('manage_team');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = () => {
    try {
      // Load tickets from localStorage (in production, this would be from API)
      const storedTickets = localStorage.getItem('hisaabb_support_tickets');
      if (storedTickets) {
        const allTickets = JSON.parse(storedTickets);
        
        // Filter tickets based on user permissions
        let userTickets;
        if (canManageTickets) {
          // Managers see all tickets
          userTickets = allTickets;
        } else {
          // Staff only see their own tickets
          userTickets = allTickets.filter((ticket: SupportTicket) => ticket.createdBy === user?.id);
        }
        
        setTickets(userTickets);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  };

  const saveTickets = (updatedTickets: SupportTicket[]) => {
    try {
      localStorage.setItem('hisaabb_support_tickets', JSON.stringify(updatedTickets));
      setTickets(updatedTickets);
    } catch (error) {
      console.error('Error saving tickets:', error);
    }
  };

  const generateId = (): string => {
    return `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!createTicketForm.title.trim() || !createTicketForm.description.trim()) {
        setError('Title and description are required');
        return;
      }

      const newTicket: SupportTicket = {
        id: generateId(),
        title: createTicketForm.title,
        description: createTicketForm.description,
        category: createTicketForm.category,
        priority: createTicketForm.priority,
        status: 'open',
        createdBy: user!.id,
        createdByName: user!.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments: [],
        replies: []
      };

      // Load existing tickets and add new one
      const storedTickets = localStorage.getItem('hisaabb_support_tickets');
      const existingTickets = storedTickets ? JSON.parse(storedTickets) : [];
      const updatedTickets = [...existingTickets, newTicket];
      
      saveTickets(updatedTickets);
      setIsCreateTicketOpen(false);
      resetCreateTicketForm();
      loadTickets();

    } catch (error) {
      setError('Failed to create ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: SupportTicket['status']) => {
    try {
      const storedTickets = localStorage.getItem('hisaabb_support_tickets');
      if (!storedTickets) return;

      const allTickets = JSON.parse(storedTickets);
      const updatedTickets = allTickets.map((ticket: SupportTicket) => {
        if (ticket.id === ticketId) {
          return {
            ...ticket,
            status,
            updatedAt: new Date().toISOString(),
            ...(status === 'resolved' && { resolvedAt: new Date().toISOString() })
          };
        }
        return ticket;
      });

      localStorage.setItem('hisaabb_support_tickets', JSON.stringify(updatedTickets));
      loadTickets();

      // Update selected ticket if it's the one being updated
      if (selectedTicket && selectedTicket.id === ticketId) {
        const updatedTicket = updatedTickets.find((t: SupportTicket) => t.id === ticketId);
        setSelectedTicket(updatedTicket);
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleAddReply = async (ticketId: string) => {
    if (!newReply.trim()) return;

    try {
      const storedTickets = localStorage.getItem('hisaabb_support_tickets');
      if (!storedTickets) return;

      const allTickets = JSON.parse(storedTickets);
      const updatedTickets = allTickets.map((ticket: SupportTicket) => {
        if (ticket.id === ticketId) {
          const newReplyObj = {
            id: generateId(),
            message: newReply.trim(),
            sentBy: user!.id,
            sentByName: user!.name,
            sentAt: new Date().toISOString(),
            isStaff: !canManageTickets
          };

          return {
            ...ticket,
            replies: [...ticket.replies, newReplyObj],
            updatedAt: new Date().toISOString(),
            status: ticket.status === 'open' ? 'in_progress' : ticket.status
          };
        }
        return ticket;
      });

      localStorage.setItem('hisaabb_support_tickets', JSON.stringify(updatedTickets));
      setNewReply('');
      loadTickets();

      // Update selected ticket
      if (selectedTicket && selectedTicket.id === ticketId) {
        const updatedTicket = updatedTickets.find((t: SupportTicket) => t.id === ticketId);
        setSelectedTicket(updatedTicket);
      }
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const resetCreateTicketForm = () => {
    setCreateTicketForm({
      title: '',
      description: '',
      category: 'general',
      priority: 'medium'
    });
    setError('');
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return variants[status as keyof typeof variants] || variants.open;
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
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'open':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <X className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const getTicketStats = () => {
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length
    };
  };

  const ticketStats = getTicketStats();

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>Please log in to access support tickets.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600">Submit and track support requests</p>
        </div>
        
        <Dialog open={isCreateTicketOpen} onOpenChange={setIsCreateTicketOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetCreateTicketForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              {error && (
                <Alert>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={createTicketForm.title}
                  onChange={(e) => setCreateTicketForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={createTicketForm.category} 
                    onValueChange={(value: any) => setCreateTicketForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select 
                    value={createTicketForm.priority} 
                    onValueChange={(value: any) => setCreateTicketForm(prev => ({ ...prev, priority: value }))}
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
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={createTicketForm.description}
                  onChange={(e) => setCreateTicketForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the issue..."
                  rows={4}
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateTicketOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Ticket'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Ticket Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{ticketStats.total}</div>
            <div className="text-sm text-gray-600">Total Tickets</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{ticketStats.open}</div>
            <div className="text-sm text-gray-600">Open</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{ticketStats.inProgress}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{ticketStats.resolved}</div>
            <div className="text-sm text-gray-600">Resolved</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="technical">Technical</SelectItem>
            <SelectItem value="hr">HR</SelectItem>
            <SelectItem value="finance">Finance</SelectItem>
            <SelectItem value="inventory">Inventory</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.map((ticket) => (
          <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer" 
                onClick={() => { setSelectedTicket(ticket); setIsTicketDetailOpen(true); }}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(ticket.status)}
                    <h3 className="font-semibold">{ticket.title}</h3>
                    <Badge className={getPriorityBadge(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                    <Badge className={getStatusBadge(ticket.status)}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 text-sm line-clamp-2">{ticket.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>By: {ticket.createdByName}</span>
                    <span>Created: {formatDateTime(ticket.createdAt)}</span>
                    <span>Category: {ticket.category}</span>
                    {ticket.replies.length > 0 && (
                      <span className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {ticket.replies.length} replies
                      </span>
                    )}
                  </div>
                </div>

                {canManageTickets && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateTicketStatus(ticket.id, 'in_progress');
                      }}
                    >
                      In Progress
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateTicketStatus(ticket.id, 'resolved');
                      }}
                    >
                      Resolve
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTickets.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No support tickets found</h3>
          <p className="text-gray-500">Create your first support ticket to get help</p>
        </div>
      )}

      {/* Ticket Detail Dialog */}
      <Dialog open={isTicketDetailOpen} onOpenChange={setIsTicketDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  {getStatusIcon(selectedTicket.status)}
                  <span>{selectedTicket.title}</span>
                  <Badge className={getPriorityBadge(selectedTicket.priority)}>
                    {selectedTicket.priority}
                  </Badge>
                  <Badge className={getStatusBadge(selectedTicket.status)}>
                    {selectedTicket.status.replace('_', ' ')}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedTicket.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Created by:</span>
                    <span className="ml-2 font-medium">{selectedTicket.createdByName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <span className="ml-2 font-medium capitalize">{selectedTicket.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2">{formatDateTime(selectedTicket.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last updated:</span>
                    <span className="ml-2">{formatDateTime(selectedTicket.updatedAt)}</span>
                  </div>
                </div>

                {/* Replies */}
                <div>
                  <h4 className="font-medium mb-2">Conversation</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedTicket.replies.map((reply) => (
                      <div key={reply.id} className={`p-3 rounded ${reply.isStaff ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{reply.sentByName}</span>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(reply.sentAt)}
                          </span>
                        </div>
                        <p className="text-sm">{reply.message}</p>
                      </div>
                    ))}
                  </div>
                  
                  {(selectedTicket.status === 'open' || selectedTicket.status === 'in_progress') && (
                    <div className="mt-3 flex space-x-2">
                      <Input
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        placeholder="Type your reply..."
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleAddReply(selectedTicket.id)}
                        disabled={!newReply.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {canManageTickets && (
                  <div className="flex space-x-2 pt-4 border-t">
                    <Button
                      onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'in_progress')}
                      disabled={selectedTicket.status === 'in_progress'}
                    >
                      Mark In Progress
                    </Button>
                    <Button
                      onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'resolved')}
                      disabled={selectedTicket.status === 'resolved'}
                    >
                      Mark Resolved
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'closed')}
                      disabled={selectedTicket.status === 'closed'}
                    >
                      Close Ticket
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
