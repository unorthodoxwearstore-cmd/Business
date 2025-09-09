import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePermissions } from '@/lib/permissions';
import { dataManager } from '@/lib/data-manager';
import { aiService, BusinessData, AIResponse } from '@/lib/ai-service';
import { Bot, Send, Lightbulb, TrendingUp, AlertTriangle, 
         Settings, Loader2, MessageSquare, BarChart3, Zap } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  insights?: string[];
  actionItems?: string[];
}

interface SmartSuggestion {
  id: string;
  type: 'warning' | 'opportunity' | 'tip';
  title: string;
  description: string;
  action?: string;
}

const AIAssistant: React.FC = () => {
  const { hasPermission, userRole, businessType } = usePermissions();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [businessAnalysis, setBusinessAnalysis] = useState<AIResponse | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Business data now comes from data manager
  const getBusinessData = (): BusinessData => {
    const metrics = dataManager.getBusinessMetrics();
    const products = dataManager.getAllProducts();
    const sales = dataManager.getAllSales();
    const customers = dataManager.getAllCustomers();

    return {
      revenue: metrics.totalRevenue,
      expenses: 0, // Would come from expense tracking
      profit: metrics.totalRevenue * 0.2, // Estimated
      inventory: products.map(p => ({
        id: parseInt(p.id.slice(-3)) || 1,
        name: p.name,
        currentStock: p.stock,
        minimumStock: p.lowStockThreshold || 10
      })).slice(0, 10),
      sales: sales.map((s, i) => ({ id: i + 1, amount: s.total })),
      customers: customers.map((c, i) => ({ id: i + 1, name: c.name })),
      trends: {
        revenueChange: metrics.monthlyGrowth,
        profitChange: metrics.monthlyGrowth * 1.2,
        expenseChange: 5.0
      },
      period: 'Last 30 days'
    };
  };

  const businessData = getBusinessData();

  useEffect(() => {
    // Load API key from localStorage
    const savedApiKey = localStorage.getItem('ai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      aiService.setApiKey(savedApiKey);
      setIsConfigured(true);
      generateInitialAnalysis();
    }

    // Generate smart suggestions
    generateSmartSuggestions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateInitialAnalysis = async () => {
    if (!aiService.isConfigured()) return;
    
    setIsLoading(true);
    try {
      const analysis = await aiService.analyzeBusinessData(businessData, userRole, businessType);
      setBusinessAnalysis(analysis);
    } catch (error) {
      console.error('Failed to generate initial analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSmartSuggestions = () => {
    const suggestions: SmartSuggestion[] = [];
    
    // Low stock warnings
    const lowStockItems = businessData.inventory.filter(item => 
      item.currentStock <= item.minimumStock
    );
    if (lowStockItems.length > 0) {
      suggestions.push({
        id: 'low-stock',
        type: 'warning',
        title: 'Low Stock Alert',
        description: `${lowStockItems.length} items are running low on stock`,
        action: 'Review inventory levels'
      });
    }

    // Profit opportunity
    const profitMargin = (businessData.profit / businessData.revenue) * 100;
    if (profitMargin < 15) {
      suggestions.push({
        id: 'profit-opportunity',
        type: 'opportunity',
        title: 'Profit Optimization',
        description: `Current profit margin is ${profitMargin.toFixed(1)}%. Consider pricing review.`,
        action: 'Analyze pricing strategy'
      });
    }

    // Growth trend
    if (businessData.trends.revenueChange > 10) {
      suggestions.push({
        id: 'growth-trend',
        type: 'tip',
        title: 'Strong Growth Detected',
        description: `Revenue increased by ${businessData.trends.revenueChange.toFixed(1)}%`,
        action: 'Consider expansion opportunities'
      });
    }

    setSmartSuggestions(suggestions);
  };

  const handleApiKeySubmit = async () => {
    if (!apiKey.trim()) return;
    
    setIsLoading(true);
    aiService.setApiKey(apiKey);
    
    try {
      const isValid = await aiService.testConnection();
      if (isValid) {
        localStorage.setItem('ai_api_key', apiKey);
        setIsConfigured(true);
        generateInitialAnalysis();
      } else {
        alert('Invalid API key. Please check your Google AI Studio API key.');
      }
    } catch (error) {
      alert('Failed to connect. Please check your API key and internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionSubmit = async () => {
    if (!currentQuestion.trim() || !isConfigured) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentQuestion,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentQuestion('');
    setIsLoading(true);
    
    try {
      const response = await aiService.askQuestion({
        question: currentQuestion,
        userRole,
        businessType,
        businessData
      });
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.answer,
        timestamp: new Date(),
        suggestions: response.suggestions,
        insights: response.insights,
        actionItems: response.actionItems
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setCurrentQuestion(question);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'tip': return <Lightbulb className="h-4 w-4 text-green-500" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const quickQuestions = [
    "Why did my profit drop last month?",
    "Which products are my best sellers?",
    "How can I improve my profit margins?",
    "What are my top business risks right now?",
    "How is my inventory performing?",
    "What should I focus on this week?"
  ];

  if (!hasPermission('view_ai_assistant')) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">You don't have permission to access the AI Assistant.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>AI Business Assistant</CardTitle>
              <CardDescription>
                Get intelligent insights and answers about your business data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {!isConfigured ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Setup AI Assistant
            </CardTitle>
            <CardDescription>
              Enter your Google AI Studio API key to enable AI features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Google AI Studio API Key</label>
              <Input
                type="password"
                placeholder="Enter your API key from Google AI Studio"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleApiKeySubmit()}
              />
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Get your free API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>. 
                Your key is stored locally and never shared.
              </AlertDescription>
            </Alert>
            <Button onClick={handleApiKeySubmit} disabled={!apiKey.trim() || isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Settings className="mr-2 h-4 w-4" />}
              Configure AI Assistant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat">Chat Assistant</TabsTrigger>
            <TabsTrigger value="insights">Business Insights</TabsTrigger>
            <TabsTrigger value="suggestions">Smart Suggestions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="space-y-4">
            {/* Quick Questions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Questions</CardTitle>
                <CardDescription>Click on a question to ask the AI assistant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {quickQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickQuestion(question)}
                      className="justify-start text-left h-auto p-3"
                    >
                      <MessageSquare className="mr-2 h-3 w-3 flex-shrink-0" />
                      <span className="text-sm">{question}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat Interface */}
            <Card className="h-96">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Chat with AI Assistant</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col h-full">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Ask me anything about your business!</p>
                      </div>
                    </div>
                  )}
                  
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-lg ${
                        message.type === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        
                        {message.insights && message.insights.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <p className="text-xs font-medium opacity-75">Key Insights:</p>
                            {message.insights.map((insight, index) => (
                              <div key={index} className="text-xs opacity-90">• {insight}</div>
                            ))}
                          </div>
                        )}
                        
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <p className="text-xs font-medium opacity-75">Suggestions:</p>
                            {message.suggestions.map((suggestion, index) => (
                              <div key={index} className="text-xs opacity-90">• {suggestion}</div>
                            ))}
                          </div>
                        )}
                        
                        <p className="text-xs opacity-50 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask about your business performance, trends, or get recommendations..."
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleQuestionSubmit()}
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={handleQuestionSubmit} 
                    disabled={!currentQuestion.trim() || isLoading}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Business Performance Analysis
                </CardTitle>
                <CardDescription>AI-powered analysis of your business data</CardDescription>
              </CardHeader>
              <CardContent>
                {businessAnalysis ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-2">Analysis</h4>
                      <p className="text-sm text-muted-foreground">{businessAnalysis.answer}</p>
                    </div>
                    
                    {businessAnalysis.insights.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Key Insights</h4>
                        <div className="space-y-2">
                          {businessAnalysis.insights.map((insight, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{insight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {businessAnalysis.actionItems.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Recommended Actions</h4>
                        <div className="space-y-2">
                          {businessAnalysis.actionItems.map((action, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <Zap className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Analyzing your business data...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="suggestions" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {smartSuggestions.map((suggestion) => (
                <Card key={suggestion.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      {getSuggestionIcon(suggestion.type)}
                      <CardTitle className="text-base">{suggestion.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{suggestion.description}</p>
                    {suggestion.action && (
                      <Button size="sm" variant="outline">
                        {suggestion.action}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {smartSuggestions.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-muted-foreground">No specific suggestions at the moment.</p>
                      <p className="text-sm text-muted-foreground">Your business metrics look healthy!</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AIAssistant;
