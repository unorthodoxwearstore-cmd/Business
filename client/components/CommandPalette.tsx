import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  Calculator,
  MessageCircle,
  Bell,
  Calendar,
  ArrowRight,
  Clock,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Command {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'recent';
  keywords: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);

  const commands: Command[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      description: 'Go to main dashboard',
      icon: <BarChart3 className="w-4 h-4" />,
      action: () => navigate('/dashboard'),
      category: 'navigation',
      keywords: ['dashboard', 'home', 'main']
    },
    {
      id: 'nav-inventory',
      title: 'Inventory Management',
      description: 'Manage products and stock',
      icon: <Package className="w-4 h-4" />,
      action: () => navigate('/dashboard/inventory'),
      category: 'navigation',
      keywords: ['inventory', 'products', 'stock']
    },
    {
      id: 'nav-batch-tracking',
      title: 'Batch & Expiry Tracking',
      description: 'Track inventory batches and expiry dates',
      icon: <Calendar className="w-4 h-4" />,
      action: () => navigate('/dashboard/inventory-batches'),
      category: 'navigation',
      keywords: ['batch', 'expiry', 'tracking']
    },
    {
      id: 'nav-staff',
      title: 'Staff Management',
      description: 'Manage team members',
      icon: <Users className="w-4 h-4" />,
      action: () => navigate('/dashboard/staff'),
      category: 'navigation',
      keywords: ['staff', 'team', 'employees']
    },
    {
      id: 'nav-whatsapp',
      title: 'WhatsApp Integration',
      description: 'Send invoices via WhatsApp',
      icon: <MessageCircle className="w-4 h-4" />,
      action: () => navigate('/dashboard/whatsapp'),
      category: 'navigation',
      keywords: ['whatsapp', 'messages', 'invoices']
    },
    {
      id: 'nav-reminders',
      title: 'Payment Reminders',
      description: 'Automated payment alerts',
      icon: <Bell className="w-4 h-4" />,
      action: () => navigate('/dashboard/payment-reminders'),
      category: 'navigation',
      keywords: ['reminders', 'payments', 'alerts']
    },
    {
      id: 'nav-settings',
      title: 'Settings',
      description: 'Configure application settings',
      icon: <Settings className="w-4 h-4" />,
      action: () => navigate('/dashboard/settings'),
      category: 'navigation',
      keywords: ['settings', 'config', 'preferences']
    },
    // Quick Actions
    {
      id: 'action-add-product',
      title: 'Add New Product',
      description: 'Create a new product in inventory',
      icon: <Package className="w-4 h-4" />,
      shortcut: 'P',
      action: () => {
        navigate('/dashboard/inventory');
        // Would trigger add product modal
      },
      category: 'actions',
      keywords: ['add', 'new', 'product', 'create']
    },
  ];

  const filteredCommands = commands.filter(command => {
    if (!query) return true;
    const searchText = query.toLowerCase();
    return (
      command.title.toLowerCase().includes(searchText) ||
      command.description.toLowerCase().includes(searchText) ||
      command.keywords.some(keyword => keyword.includes(searchText))
    );
  });

  const recentCommandsData = commands.filter(cmd => recentCommands.includes(cmd.id));
  const displayCommands = query ? filteredCommands : [
    ...recentCommandsData.map(cmd => ({ ...cmd, category: 'recent' as const })),
    ...filteredCommands.filter(cmd => !recentCommands.includes(cmd.id))
  ];

  const executeCommand = useCallback((command: Command) => {
    // Add to recent commands
    setRecentCommands(prev => {
      const newRecent = [command.id, ...prev.filter(id => id !== command.id)].slice(0, 5);
      localStorage.setItem('recent_commands', JSON.stringify(newRecent));
      return newRecent;
    });

    command.action();
    onClose();
    setQuery('');
    setSelectedIndex(0);
  }, [onClose]);

  useEffect(() => {
    const stored = localStorage.getItem('recent_commands');
    if (stored) {
      setRecentCommands(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % displayCommands.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + displayCommands.length) % displayCommands.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (displayCommands[selectedIndex]) {
            executeCommand(displayCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, displayCommands, executeCommand, onClose]);

  const getCategoryIcon = (category: Command['category']) => {
    switch (category) {
      case 'recent': return <Clock className="w-4 h-4" />;
      case 'actions': return <Star className="w-4 h-4" />;
      default: return <ArrowRight className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (category: Command['category']) => {
    switch (category) {
      case 'recent': return 'Recent';
      case 'actions': return 'Quick Actions';
      case 'navigation': return 'Navigate';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        <div className="flex items-center border-b px-4 py-3">
          <Search className="w-4 h-4 text-gray-400 mr-3" />
          <Input
            placeholder="Search commands or type '/' for quick navigation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 p-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
          <Badge variant="outline" className="ml-2 text-xs">
            ⌘K
          </Badge>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {displayCommands.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No commands found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          ) : (
            <div className="py-2">
              {/* Group by category */}
              {['recent', 'actions', 'navigation'].map(category => {
                const categoryCommands = displayCommands.filter(cmd => cmd.category === category);
                if (categoryCommands.length === 0) return null;

                return (
                  <div key={category} className="mb-4">
                    <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {getCategoryIcon(category as Command['category'])}
                      {getCategoryLabel(category as Command['category'])}
                    </div>
                    {categoryCommands.map((command, index) => {
                      const globalIndex = displayCommands.indexOf(command);
                      return (
                        <div
                          key={command.id}
                          className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                            globalIndex === selectedIndex
                              ? 'bg-blue-50 border-r-2 border-blue-500'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => executeCommand(command)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                              {command.icon}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{command.title}</p>
                              <p className="text-sm text-gray-500">{command.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {command.shortcut && (
                              <Badge variant="outline" className="text-xs">
                                {command.shortcut}
                              </Badge>
                            )}
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t px-4 py-2 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>⎋ Close</span>
            </div>
            <span>{displayCommands.length} commands</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
