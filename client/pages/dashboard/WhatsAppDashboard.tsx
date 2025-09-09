import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { whatsappService } from '@/lib/whatsapp-service';
import { 
  MessageCircle, 
  Send, 
  Settings, 
  Activity, 
  CheckCircle, 
  AlertCircle,
  Phone,
  Calendar,
  FileText,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/lib/permissions';
import WhatsAppConfig from '@/components/WhatsAppConfig';

export default function WhatsAppDashboard() {
  const { toast } = useToast();
  const permissions = usePermissions();
  const [isConfigured, setIsConfigured] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Hello! This is a test message from Insygth.');
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    setIsConfigured(whatsappService.isConfigured());
    setActivities(whatsappService.getWhatsAppActivities());
  }, []);

  const handleConfigurationChange = (configured: boolean) => {
    setIsConfigured(configured);
  };

  const handleSendTestMessage = async () => {
    if (!testPhone || !testMessage) {
      toast({
        title: "Missing Information",
        description: "Please provide both phone number and message",
        variant: "destructive"
      });
      return;
    }

    setIsSendingTest(true);
    
    try {
      const result = await whatsappService.sendTextMessage(testPhone, testMessage);
      
      if (result.success) {
        toast({
          title: "Test Message Sent",
          description: "WhatsApp test message sent successfully",
          variant: "default"
        });
        setTestPhone('');
        setTestMessage('Hello! This is a test message from Insygth.');
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
        description: "Failed to send test message",
        variant: "destructive"
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'invoice': return <FileText className="w-4 h-4" />;
      case 'catalog': return <Users className="w-4 h-4" />;
      case 'quotation': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'invoice': return 'bg-blue-100 text-blue-800';
      case 'catalog': return 'bg-green-100 text-green-800';
      case 'quotation': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!permissions.hasPermission('manage_settings') && !permissions.hasPermission('sendInvoicesAndCatalogs')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-500">You don't have permission to access WhatsApp integration.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showConfig) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              WhatsApp Configuration
            </h1>
            <p className="text-gray-600 mt-1">
              Configure WhatsApp Business API integration
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowConfig(false)}>
            Back to Dashboard
          </Button>
        </div>

        <WhatsAppConfig onConfigurationChange={handleConfigurationChange} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            WhatsApp Integration
          </h1>
          <p className="text-gray-600 mt-1">
            Send invoices, catalogs, and quotations directly to customers via WhatsApp
          </p>
        </div>

        <Button onClick={() => setShowConfig(true)} variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Configure
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Integration Status</p>
                <p className="text-2xl font-bold mt-2">
                  {isConfigured ? (
                    <Badge className="bg-green-100 text-green-800 text-sm">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-sm">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </p>
              </div>
              <Settings className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Documents Sent</p>
                <p className="text-2xl font-bold mt-2">{activities.length}</p>
              </div>
              <Send className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold mt-2">
                  {activities.filter(a => {
                    const activityDate = new Date(a.sentAt);
                    const now = new Date();
                    return activityDate.getMonth() === now.getMonth() && activityDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold mt-2">
                  {activities.length > 0 ? '95%' : '0%'}
                </p>
              </div>
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {!isConfigured && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            WhatsApp integration is not configured. Click "Configure" to set up your WhatsApp Business API credentials.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest documents sent via WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No WhatsApp activity yet</p>
                  <p className="text-sm">Documents sent via WhatsApp will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getDocumentTypeColor(activity.documentType)}`}>
                          {getDocumentTypeIcon(activity.documentType)}
                        </div>
                        <div>
                          <p className="font-medium">{activity.recipientName}</p>
                          <p className="text-sm text-gray-500">
                            {activity.documentType.toUpperCase()} • {activity.phoneNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          Sent
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.sentAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Test Messaging */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Test Message
              </CardTitle>
              <CardDescription>
                Send a test message to verify your WhatsApp integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testPhone">Phone Number</Label>
                <Input
                  id="testPhone"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  disabled={!isConfigured}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="testMessage">Test Message</Label>
                <Textarea
                  id="testMessage"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Enter your test message..."
                  rows={3}
                  disabled={!isConfigured}
                />
              </div>

              <Button 
                onClick={handleSendTestMessage}
                disabled={!isConfigured || isSendingTest || !testPhone || !testMessage}
                className="w-full"
              >
                {isSendingTest ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Test Message
                  </>
                )}
              </Button>

              {!isConfigured && (
                <p className="text-xs text-gray-500 text-center">
                  Configure WhatsApp integration to enable test messaging
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Invoices Sent</span>
                <span className="font-medium">
                  {activities.filter(a => a.documentType === 'invoice').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Catalogs Sent</span>
                <span className="font-medium">
                  {activities.filter(a => a.documentType === 'catalog').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Quotations Sent</span>
                <span className="font-medium">
                  {activities.filter(a => a.documentType === 'quotation').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
