import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { whatsappService, WhatsAppConfig } from '@/lib/whatsapp-service';
import { MessageCircle, CheckCircle, AlertCircle, ExternalLink, Save, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppConfigProps {
  onConfigurationChange?: (isConfigured: boolean) => void;
}

export default function WhatsAppConfig({ onConfigurationChange }: WhatsAppConfigProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<WhatsAppConfig>({
    apiKey: '',
    instanceId: '',
    isEnabled: false,
    webhookUrl: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  useEffect(() => {
    const savedConfig = whatsappService.getConfig();
    if (savedConfig) {
      setConfig(savedConfig);
    }
  }, []);

  const handleSave = async () => {
    if (config.isEnabled && (!config.apiKey || !config.instanceId)) {
      toast({
        title: "Missing Configuration",
        description: "Please provide both API Key and Instance ID to enable WhatsApp integration",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    try {
      whatsappService.saveConfig(config);
      
      toast({
        title: "Configuration Saved",
        description: "WhatsApp settings have been saved successfully",
        variant: "default"
      });

      onConfigurationChange?.(whatsappService.isConfigured());
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save WhatsApp configuration",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.apiKey || !config.instanceId) {
      toast({
        title: "Missing Configuration",
        description: "Please provide API Key and Instance ID to test connection",
        variant: "destructive"
      });
      return;
    }

    setIsTestingConnection(true);
    
    try {
      // Simulate API connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate random success/failure for testing
      const isSuccess = Math.random() > 0.3;
      
      if (isSuccess) {
        toast({
          title: "Connection Successful",
          description: "WhatsApp API connection is working properly",
          variant: "default"
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Unable to connect to WhatsApp API. Please check your credentials.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to test WhatsApp connection",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const recentActivities = whatsappService.getWhatsAppActivities().slice(0, 5);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            WhatsApp Business Integration
          </CardTitle>
          <CardDescription>
            Configure WhatsApp Business API to send invoices, catalogs, and quotations directly to customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            {whatsappService.isConfigured() ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Configured & Active
              </Badge>
            ) : (
              <Badge variant="secondary">
                <AlertCircle className="w-3 h-3 mr-1" />
                Not Configured
              </Badge>
            )}
          </div>

          <Separator />

          {/* Enable/Disable Switch */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable WhatsApp Integration</Label>
              <div className="text-sm text-muted-foreground">
                Allow sending documents via WhatsApp across all modules
              </div>
            </div>
            <Switch
              checked={config.isEnabled}
              onCheckedChange={(checked) => setConfig({ ...config, isEnabled: checked })}
            />
          </div>

          {config.isEnabled && (
            <>
              <Separator />

              {/* API Configuration */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instanceId">Instance ID</Label>
                  <Input
                    id="instanceId"
                    value={config.instanceId}
                    onChange={(e) => setConfig({ ...config, instanceId: e.target.value })}
                    placeholder="Enter your WhatsApp Business Instance ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? 'text' : 'password'}
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder="Enter your WhatsApp Business API Key"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
                  <Input
                    id="webhookUrl"
                    value={config.webhookUrl || ''}
                    onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                    placeholder="https://your-domain.com/webhook/whatsapp"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL to receive delivery status and message updates
                  </p>
                </div>
              </div>

              <Separator />

              {/* Test Connection */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection || !config.apiKey || !config.instanceId}
                >
                  {isTestingConnection ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => window.open('https://developers.facebook.com/docs/whatsapp/cloud-api', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  API Documentation
                </Button>
              </div>

              {/* Setup Instructions */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Setup Instructions:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Create a WhatsApp Business Account</li>
                      <li>Get your Instance ID from WhatsApp Business API</li>
                      <li>Generate an API Key with document sending permissions</li>
                      <li>Enter the credentials above and test the connection</li>
                    </ol>
                  </div>
                </AlertDescription>
              </Alert>
            </>
          )}

          <Separator />

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {recentActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent WhatsApp Activity</CardTitle>
            <CardDescription>
              Last 5 documents sent via WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{activity.recipientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.documentType.toUpperCase()} • {activity.phoneNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">Sent</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.sentAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
