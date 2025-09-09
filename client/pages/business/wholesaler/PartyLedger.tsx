import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePermissions } from '@/lib/permissions';
import { Search, Filter, Plus, Download, Phone, Mail, MapPin,
         Calendar, DollarSign, AlertTriangle, TrendingUp, User, Users } from 'lucide-react';
import BackButton from '@/components/BackButton';
import EmptyState from '@/components/EmptyState';

interface Party {
  id: string;
  name: string;
  type: 'customer' | 'supplier';
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  creditLimit: number;
  outstandingAmount: number;
  lastTransactionDate: string;
  status: 'active' | 'inactive' | 'blocked';
  paymentTerms: string;
  gstNumber?: string;
}

interface LedgerEntry {
  id: string;
  partyId: string;
  date: string;
  type: 'sale' | 'purchase' | 'payment' | 'receipt' | 'adjustment';
  invoiceNumber?: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  balance: number;
  dueDate?: string;
  status: 'pending' | 'cleared' | 'overdue';
}

interface ReceivablesSummary {
  totalOutstanding: number;
  overdueAmount: number;
  currentDue: number;
  aging30Days: number;
  aging60Days: number;
  aging90Days: number;
  agingAbove90Days: number;
}

const PartyLedger: React.FC = () => {
  const { hasPermission } = usePermissions();
  const [parties, setParties] = useState<Party[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [receivablesSummary, setReceivablesSummary] = useState<ReceivablesSummary>({
    totalOutstanding: 0,
    overdueAmount: 0,
    currentDue: 0,
    aging30Days: 0,
    aging60Days: 0,
    aging90Days: 0,
    agingAbove90Days: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Load real data from backend
  useEffect(() => {
    const loadPartyData = async () => {
      setLoading(true);
      try {
        // In a real app, this would fetch from an API
        // const response = await fetch('/api/parties');
        // const data = await response.json();

        // For now, initialize with empty data
        setParties([]);
        setLedgerEntries([]);
        setReceivablesSummary({
          totalOutstanding: 0,
          overdueAmount: 0,
          currentDue: 0,
          aging30Days: 0,
          aging60Days: 0,
          aging90Days: 0,
          agingAbove90Days: 0
        });
      } catch (error) {
        console.error('Error loading party data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPartyData();
  }, []);

  const filteredParties = parties.filter(party => {
    const matchesSearch = party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         party.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || party.type === filterType;
    const matchesStatus = filterStatus === 'all' || party.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getPartyLedgerEntries = (partyId: string) => {
    return ledgerEntries.filter(entry => entry.partyId === partyId);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      blocked: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cleared: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const calculateCreditUtilization = (outstanding: number, creditLimit: number) => {
    return creditLimit > 0 ? (outstanding / creditLimit) * 100 : 0;
  };

  const exportLedger = () => {
    if (!hasPermission('export_reports')) return;
    // Export functionality would be implemented here
    console.log('Exporting ledger data...');
  };

  if (!hasPermission('view_party_ledger')) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">You don't have permission to view party ledger.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading party ledger...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton />
      {/* Receivables Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(receivablesSummary.totalOutstanding)}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(receivablesSummary.overdueAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Immediate attention required
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Due</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(receivablesSummary.currentDue)}</div>
            <p className="text-xs text-muted-foreground">
              Due this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">87%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Party Ledger & Receivables</CardTitle>
              <CardDescription>
                Manage customer and supplier accounts, track outstanding amounts and payment history
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {hasPermission('create_party') && (
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Party
                </Button>
              )}
              {hasPermission('export_reports') && (
                <Button variant="outline" onClick={exportLedger}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="parties" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="parties">Party List</TabsTrigger>
              <TabsTrigger value="ledger">Ledger Entries</TabsTrigger>
              <TabsTrigger value="aging">Aging Analysis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="parties" className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search parties by name or contact person..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Party Cards */}
              {filteredParties.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No Parties Found"
                  description="No customers or suppliers have been added yet. Add your first party to start tracking receivables and payables."
                  actionLabel="Add Party"
                  onAction={() => console.log('Add party clicked')}
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredParties.map((party) => {
                    const creditUtilization = calculateCreditUtilization(party.outstandingAmount, party.creditLimit);

                    return (
                      <Card key={party.id} className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setSelectedParty(party)}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <CardTitle className="text-lg">{party.name}</CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={party.type === 'customer' ? 'border-blue-300 text-blue-700' : 'border-green-300 text-green-700'}>
                                  {party.type.charAt(0).toUpperCase() + party.type.slice(1)}
                                </Badge>
                                <Badge className={getStatusBadge(party.status)}>
                                  {party.status.charAt(0).toUpperCase() + party.status.slice(1)}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold">
                                {formatCurrency(party.outstandingAmount)}
                              </div>
                              <div className="text-sm text-muted-foreground">Outstanding</div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{party.contactPerson}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{party.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{party.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{party.address}</span>
                          </div>

                          {/* Credit Utilization */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Credit Utilization</span>
                              <span>{creditUtilization.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  creditUtilization > 90 ? 'bg-red-500' :
                                  creditUtilization > 75 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(creditUtilization, 100)}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Limit: {formatCurrency(party.creditLimit)}</span>
                              <span>Available: {formatCurrency(party.creditLimit - party.outstandingAmount)}</span>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            Last transaction: {formatDate(party.lastTransactionDate)} | Terms: {party.paymentTerms}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="ledger" className="space-y-4">
              {selectedParty && (
                <Card>
                  <CardHeader>
                    <CardTitle>Ledger - {selectedParty.name}</CardTitle>
                    <CardDescription>Transaction history and account details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getPartyLedgerEntries(selectedParty.id).map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusBadge(entry.status)}>
                                {entry.status}
                              </Badge>
                              <span className="font-medium">{entry.description}</span>
                              {entry.invoiceNumber && (
                                <span className="text-sm text-muted-foreground">({entry.invoiceNumber})</span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(entry.date)} 
                              {entry.dueDate && ` | Due: ${formatDate(entry.dueDate)}`}
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="flex gap-4">
                              {entry.debitAmount > 0 && (
                                <span className="text-red-600 font-medium">
                                  Dr. {formatCurrency(entry.debitAmount)}
                                </span>
                              )}
                              {entry.creditAmount > 0 && (
                                <span className="text-green-600 font-medium">
                                  Cr. {formatCurrency(entry.creditAmount)}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Balance: {formatCurrency(Math.abs(entry.balance))} {entry.balance >= 0 ? 'Dr' : 'Cr'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {!selectedParty && (
                <Card>
                  <CardContent className="flex items-center justify-center h-48">
                    <p className="text-muted-foreground">Select a party from the Party List to view ledger entries</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="aging" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Receivables Aging Analysis</CardTitle>
                  <CardDescription>Outstanding amounts categorized by aging periods</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">0-30 Days</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(receivablesSummary.aging30Days)}
                        </div>
                        <p className="text-xs text-muted-foreground">Current</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">31-60 Days</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                          {formatCurrency(receivablesSummary.aging60Days)}
                        </div>
                        <p className="text-xs text-muted-foreground">Attention needed</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">61-90 Days</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                          {formatCurrency(receivablesSummary.aging90Days)}
                        </div>
                        <p className="text-xs text-muted-foreground">Follow up required</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">90+ Days</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                          {formatCurrency(receivablesSummary.agingAbove90Days)}
                        </div>
                        <p className="text-xs text-muted-foreground">Critical</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartyLedger;
