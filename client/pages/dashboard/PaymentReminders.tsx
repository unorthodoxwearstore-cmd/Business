import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  paymentReminderService, 
  PaymentReminder, 
  PaymentReminderConfig, 
  Invoice 
} from '@/lib/payment-reminder-service';
import { 
  Bell, 
  Send, 
  Settings, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  DollarSign,
  Phone,
  Mail,
  FileText,
  CreditCard,
  Loader2,
  Eye,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/lib/permissions';
import { formatCurrency } from '@/lib/business-data';

export default function PaymentReminders() {
  const { toast } = useToast();
  const permissions = usePermissions();
  const [config, setConfig] = useState<PaymentReminderConfig>(paymentReminderService.getConfig());
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [dueInvoices, setDueInvoices] = useState<Invoice[]>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<Invoice[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [sendingReminders, setSendingReminders] = useState<Set<string>>(new Set());
  const [selectedReminder, setSelectedReminder] = useState<PaymentReminder | null>(null);

  useEffect(() => {
    loadData();
    // Check for new reminders every 5 minutes
    const interval = setInterval(() => {
      const newReminders = paymentReminderService.checkAndGenerateReminders();
      if (newReminders.length > 0) {
        loadData();
        toast({
          title: "New Reminders Generated",
          description: `${newReminders.length} new payment reminder(s) created`,
          variant: "default"
        });
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setReminders(paymentReminderService.getReminders());
    setInvoices(paymentReminderService.getInvoices());
    setDueInvoices(paymentReminderService.getDueInvoices());
    setOverdueInvoices(paymentReminderService.getOverdueInvoices());
  };

  const handleConfigSave = async () => {
    setIsSaving(true);
    try {
      paymentReminderService.updateConfig(config);
      toast({
        title: "Configuration Saved",
        description: "Payment reminder settings have been updated",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save configuration",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendReminder = async (reminderId: string) => {
    setSendingReminders(prev => new Set(prev).add(reminderId));
    
    try {
      const result = await paymentReminderService.sendReminder(reminderId);
      
      if (result.success) {
        toast({
          title: "Reminder Sent",
          description: result.message,
          variant: "default"
        });
        loadData();
      } else {
        toast({
          title: "Send Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reminder",
        variant: "destructive"
      });
    } finally {
      setSendingReminders(prev => {
        const newSet = new Set(prev);
        newSet.delete(reminderId);
        return newSet;
      });
    }
  };

  const handleMarkPaid = (invoiceId: string) => {
    const success = paymentReminderService.updateInvoiceStatus(invoiceId, 'paid', new Date().toISOString());
    if (success) {
      toast({
        title: "Invoice Marked as Paid",
        description: "Invoice status updated successfully",
        variant: "default"
      });
      loadData();
    }
  };

  const getReminderStatusColor = (status: PaymentReminder['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'acknowledged': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReminderTypeIcon = (type: PaymentReminder['reminderType']) => {
    switch (type) {
      case 'approaching_due': return <Clock className="w-4 h-4" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  if (!permissions.hasPermission('viewAddEditOrders') && !permissions.hasPermission('manage_settings')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-500">You don't have permission to access payment reminders.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingReminders = reminders.filter(r => r.status === 'pending');
  const sentReminders = reminders.filter(r => r.status === 'sent');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            Payment Reminders
          </h1>
          <p className="text-gray-600 mt-1">
            Automated payment reminders for due and overdue invoices
          </p>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Reminders</p>
                <p className="text-2xl font-bold mt-2">{pendingReminders.length}</p>
              </div>
              <Bell className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Due Soon</p>
                <p className="text-2xl font-bold mt-2">{dueInvoices.length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold mt-2">{overdueInvoices.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0))}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reminders" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="invoices">Due Invoices</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Reminders Tab */}
        <TabsContent value="reminders">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Payment Reminders
              </CardTitle>
              <CardDescription>
                Automated reminders for approaching due dates and overdue payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reminders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No payment reminders yet</p>
                  <p className="text-sm">Reminders will appear here automatically</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reminders.slice(0, 20).map((reminder) => (
                    <div key={reminder.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          reminder.reminderType === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {getReminderTypeIcon(reminder.reminderType)}
                        </div>
                        <div>
                          <p className="font-medium">{reminder.customerName}</p>
                          <p className="text-sm text-gray-500">
                            {reminder.invoiceNumber} • {formatCurrency(reminder.amount)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getReminderStatusColor(reminder.status)}>
                              {reminder.status.replace('_', ' ')}
                            </Badge>
                            {reminder.reminderType === 'overdue' && reminder.daysOverdue && (
                              <Badge variant="outline" className="text-red-600 border-red-200">
                                {reminder.daysOverdue} days overdue
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReminder(reminder)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        {reminder.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleSendReminder(reminder.id)}
                            disabled={sendingReminders.has(reminder.id)}
                          >
                            {sendingReminders.has(reminder.id) ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Send
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Due Invoices Tab */}
        <TabsContent value="invoices">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Due Soon */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Due Soon ({dueInvoices.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dueInvoices.map((invoice) => (
                    <div key={invoice.id} className="p-3 rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{invoice.customerName}</p>
                          <p className="text-sm text-gray-500">{invoice.invoiceNumber}</p>
                        </div>
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          {formatCurrency(invoice.amount)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkPaid(invoice.id)}
                        >
                          Mark Paid
                        </Button>
                      </div>
                    </div>
                  ))}
                  {dueInvoices.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No invoices due soon</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Overdue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Overdue ({overdueInvoices.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overdueInvoices.map((invoice) => {
                    const daysOverdue = Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={invoice.id} className="p-3 rounded-lg border border-red-200 bg-red-50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{invoice.customerName}</p>
                            <p className="text-sm text-gray-500">{invoice.invoiceNumber}</p>
                          </div>
                          <Badge variant="outline" className="text-red-600 border-red-200">
                            {formatCurrency(invoice.amount)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-red-600">
                            {daysOverdue} days overdue
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkPaid(invoice.id)}
                          >
                            Mark Paid
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {overdueInvoices.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No overdue invoices</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Reminder Configuration
              </CardTitle>
              <CardDescription>
                Configure when and how payment reminders are sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Payment Reminders</Label>
                  <div className="text-sm text-muted-foreground">
                    Automatically send reminders for due and overdue payments
                  </div>
                </div>
                <Switch
                  checked={config.isEnabled}
                  onCheckedChange={(checked) => setConfig({ ...config, isEnabled: checked })}
                />
              </div>

              {config.isEnabled && (
                <>
                  {/* Timing Configuration */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="approachingDays">Days before due date to send reminder</Label>
                      <Input
                        id="approachingDays"
                        type="number"
                        min="1"
                        max="30"
                        value={config.approachingDueDays}
                        onChange={(e) => setConfig({ ...config, approachingDueDays: Number(e.target.value) })}
                        className="w-24"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="overdueDays">Days after due date to send reminders (comma-separated)</Label>
                      <Input
                        id="overdueDays"
                        value={config.overdueDays.join(', ')}
                        onChange={(e) => {
                          const days = e.target.value.split(',').map(d => Number(d.trim())).filter(d => !isNaN(d));
                          setConfig({ ...config, overdueDays: days });
                        }}
                        placeholder="1, 3, 7, 15"
                      />
                    </div>
                  </div>

                  {/* Message Templates */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="approachingTemplate">Approaching Due Date Message</Label>
                      <Textarea
                        id="approachingTemplate"
                        value={config.messageTemplates.approachingDue}
                        onChange={(e) => setConfig({
                          ...config,
                          messageTemplates: { ...config.messageTemplates, approachingDue: e.target.value }
                        })}
                        rows={4}
                      />
                      <p className="text-xs text-gray-500">
                        Available variables: {'{customerName}'}, {'{invoiceNumber}'}, {'{amount}'}, {'{dueDate}'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="overdueTemplate">Overdue Payment Message</Label>
                      <Textarea
                        id="overdueTemplate"
                        value={config.messageTemplates.overdue}
                        onChange={(e) => setConfig({
                          ...config,
                          messageTemplates: { ...config.messageTemplates, overdue: e.target.value }
                        })}
                        rows={4}
                      />
                      <p className="text-xs text-gray-500">
                        Available variables: {'{customerName}'}, {'{invoiceNumber}'}, {'{amount}'}, {'{dueDate}'}, {'{daysOverdue}'}
                      </p>
                    </div>
                  </div>

                  {/* Additional Options */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Include payment link in reminders</Label>
                      <Switch
                        checked={config.includePaymentLink}
                        onCheckedChange={(checked) => setConfig({ ...config, includePaymentLink: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Include UPI QR code</Label>
                      <Switch
                        checked={config.includeUpiQr}
                        onCheckedChange={(checked) => setConfig({ ...config, includeUpiQr: checked })}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <Button onClick={handleConfigSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Configuration'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reminder Detail Modal */}
      {selectedReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Reminder Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Customer</Label>
                  <p className="text-sm">{selectedReminder.customerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Invoice</Label>
                  <p className="text-sm">{selectedReminder.invoiceNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-sm">{formatCurrency(selectedReminder.amount)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Due Date</Label>
                  <p className="text-sm">{new Date(selectedReminder.dueDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Message</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                  {selectedReminder.message}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedReminder(null)}>
                  Close
                </Button>
                {selectedReminder.status === 'pending' && (
                  <Button onClick={() => {
                    handleSendReminder(selectedReminder.id);
                    setSelectedReminder(null);
                  }}>
                    Send Reminder
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
