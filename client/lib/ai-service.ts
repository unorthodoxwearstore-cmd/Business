import { UserRole, BusinessType } from '@/shared/types';

interface BusinessData {
  revenue: number;
  expenses: number;
  profit: number;
  inventory: any[];
  sales: any[];
  customers: any[];
  trends: any;
  period: string;
}

interface AIQuery {
  question: string;
  userRole: UserRole;
  businessType: BusinessType;
  businessData: BusinessData;
}

interface AIResponse {
  answer: string;
  suggestions: string[];
  insights: string[];
  actionItems: string[];
}

class AIService {
  private apiKey: string = '';
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeBusinessData(data: BusinessData, userRole: UserRole, businessType: BusinessType): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new Error('AI API key not configured. Please set your Google AI Studio API key in settings.');
    }

    const prompt = this.buildBusinessAnalysisPrompt(data, userRole, businessType);
    
    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const result = await response.json();
      const aiText = result.candidates[0]?.content?.parts[0]?.text || 'Unable to analyze data at this time.';
      
      return this.parseAIResponse(aiText);
    } catch (error) {
      console.error('AI Service Error:', error);
      return {
        answer: 'Unable to connect to AI service. Please check your API key and internet connection.',
        suggestions: [],
        insights: [],
        actionItems: []
      };
    }
  }

  async askQuestion(query: AIQuery): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new Error('AI API key not configured. Please set your Google AI Studio API key in settings.');
    }

    const prompt = this.buildQuestionPrompt(query);
    
    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const result = await response.json();
      const aiText = result.candidates[0]?.content?.parts[0]?.text || 'Unable to answer your question at this time.';
      
      return this.parseAIResponse(aiText);
    } catch (error) {
      console.error('AI Service Error:', error);
      return {
        answer: 'Unable to connect to AI service. Please check your API key and internet connection.',
        suggestions: [],
        insights: [],
        actionItems: []
      };
    }
  }

  private buildBusinessAnalysisPrompt(data: BusinessData, userRole: UserRole, businessType: BusinessType): string {
    const roleContext = this.getRoleContext(userRole);
    const businessContext = this.getBusinessContext(businessType);
    
    return `
You are an AI business analyst for a ${businessType} business. Analyze the following business data and provide insights suitable for a ${userRole}.

Business Data:
- Revenue: ₹${data.revenue.toLocaleString()}
- Expenses: ₹${data.expenses.toLocaleString()}
- Profit: ₹${data.profit.toLocaleString()}
- Profit Margin: ${((data.profit / data.revenue) * 100).toFixed(2)}%
- Number of Inventory Items: ${data.inventory.length}
- Number of Sales: ${data.sales.length}
- Number of Customers: ${data.customers.length}
- Period: ${data.period}

${businessContext}
${roleContext}

Please provide your response in the following format:
ANALYSIS: [Your main analysis of the business performance]

INSIGHTS: 
- [Key insight 1]
- [Key insight 2]
- [Key insight 3]

SUGGESTIONS:
- [Actionable suggestion 1]
- [Actionable suggestion 2]
- [Actionable suggestion 3]

ACTION_ITEMS:
- [Specific action item 1]
- [Specific action item 2]
- [Specific action item 3]

Focus on practical, actionable advice that can be implemented immediately. Consider industry best practices for ${businessType} businesses.
`;
  }

  private buildQuestionPrompt(query: AIQuery): string {
    const roleContext = this.getRoleContext(query.userRole);
    const businessContext = this.getBusinessContext(query.businessType);
    
    return `
You are an AI business analyst for a ${query.businessType} business. Answer the following question using only the provided business data. Do not make assumptions or use external data.

Question: ${query.question}

Business Data Context:
- Revenue: ₹${query.businessData.revenue.toLocaleString()}
- Expenses: ₹${query.businessData.expenses.toLocaleString()}
- Profit: ₹${query.businessData.profit.toLocaleString()}
- Profit Margin: ${((query.businessData.profit / query.businessData.revenue) * 100).toFixed(2)}%
- Inventory Items: ${query.businessData.inventory.length}
- Sales Records: ${query.businessData.sales.length}
- Customer Count: ${query.businessData.customers.length}
- Period: ${query.businessData.period}

${businessContext}
${roleContext}

Please provide your response in the following format:
ANSWER: [Direct answer to the question based on the data]

INSIGHTS: 
- [Related insight 1]
- [Related insight 2]

SUGGESTIONS:
- [Actionable suggestion 1]
- [Actionable suggestion 2]

ACTION_ITEMS:
- [Specific action to take]

Base your answer strictly on the provided data. If the data is insufficient to answer the question, clearly state what additional information would be needed.
`;
  }

  private getRoleContext(role: UserRole): string {
    const contexts = {
      owner: 'Focus on high-level strategic decisions, profitability, growth opportunities, and overall business performance. Include financial metrics and long-term planning insights.',
      co_founder: 'Provide strategic insights with focus on operations, team management, and business development. Include operational efficiency and scaling recommendations.',
      manager: 'Focus on departmental performance, team productivity, and operational improvements. Include management-specific metrics and team optimization suggestions.',
      staff: 'Provide task-specific insights relevant to daily operations. Focus on immediate actionable items and process improvements within your scope.',
      accountant: 'Focus on financial analysis, cost optimization, and accounting-related insights. Include financial health indicators and budget recommendations.',
      sales_executive: 'Focus on sales performance, customer insights, and revenue optimization. Include sales metrics and customer relationship recommendations.'
    };
    
    return `Role Context (${role}): ${contexts[role] || contexts.staff}`;
  }

  private getBusinessContext(businessType: BusinessType): string {
    const contexts = {
      retailer: 'Consider retail-specific metrics like inventory turnover, customer footfall, seasonal trends, and point-of-sale performance.',
      ecommerce: 'Focus on online sales metrics, conversion rates, digital marketing effectiveness, and customer acquisition costs.',
      manufacturer: 'Analyze production efficiency, raw material costs, manufacturing lead times, and quality control metrics.',
      wholesaler: 'Consider bulk sales patterns, distributor relationships, inventory management, and B2B customer metrics.',
      service: 'Focus on service delivery metrics, customer satisfaction, appointment scheduling efficiency, and service profitability.',
      distributor: 'Analyze territory performance, sales team effectiveness, brand relationships, and market penetration.',
      trader: 'Focus on buy-sell margins, market timing, inventory valuation, and trading profitability.',
    };
    
    return `Business Context (${businessType}): ${contexts[businessType] || contexts.retailer}`;
  }

  private parseAIResponse(aiText: string): AIResponse {
    const sections = {
      answer: '',
      insights: [] as string[],
      suggestions: [] as string[],
      actionItems: [] as string[]
    };

    // Extract main analysis/answer
    const analysisMatch = aiText.match(/(?:ANALYSIS|ANSWER):\s*(.*?)(?=\n(?:INSIGHTS|SUGGESTIONS|ACTION_ITEMS):|$)/s);
    if (analysisMatch) {
      sections.answer = analysisMatch[1].trim();
    }

    // Extract insights
    const insightsMatch = aiText.match(/INSIGHTS:\s*(.*?)(?=\n(?:SUGGESTIONS|ACTION_ITEMS):|$)/s);
    if (insightsMatch) {
      sections.insights = this.extractListItems(insightsMatch[1]);
    }

    // Extract suggestions
    const suggestionsMatch = aiText.match(/SUGGESTIONS:\s*(.*?)(?=\n(?:ACTION_ITEMS):|$)/s);
    if (suggestionsMatch) {
      sections.suggestions = this.extractListItems(suggestionsMatch[1]);
    }

    // Extract action items
    const actionItemsMatch = aiText.match(/ACTION_ITEMS:\s*(.*?)$/s);
    if (actionItemsMatch) {
      sections.actionItems = this.extractListItems(actionItemsMatch[1]);
    }

    // Fallback if structured parsing fails
    if (!sections.answer && !sections.insights.length && !sections.suggestions.length) {
      sections.answer = aiText.trim();
    }

    return sections;
  }

  private extractListItems(text: string): string[] {
    return text
      .split('\n')
      .map(line => line.replace(/^[-*•]\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 5); // Limit to 5 items for better UX
  }

  // Smart suggestion generators based on business data
  generateSmartSuggestions(data: BusinessData, businessType: BusinessType): string[] {
    const suggestions: string[] = [];
    
    // Low stock suggestions
    const lowStockItems = data.inventory.filter(item => 
      item.currentStock <= item.minimumStock
    );
    if (lowStockItems.length > 0) {
      suggestions.push(`⚠️ ${lowStockItems.length} items are running low on stock. Consider reordering soon.`);
    }

    // Profit margin analysis
    const profitMargin = (data.profit / data.revenue) * 100;
    if (profitMargin < 10) {
      suggestions.push(`📉 Profit margin is ${profitMargin.toFixed(1)}%. Consider reviewing pricing strategy or reducing costs.`);
    } else if (profitMargin > 25) {
      suggestions.push(`📈 Strong profit margin of ${profitMargin.toFixed(1)}%. Consider expansion opportunities.`);
    }

    // Revenue trend analysis
    if (data.trends && data.trends.revenueChange < -5) {
      suggestions.push(`📊 Revenue declined by ${Math.abs(data.trends.revenueChange)}%. Focus on customer retention and acquisition.`);
    }

    // Business-specific suggestions
    switch (businessType) {
      case 'retailer':
        if (data.customers.length < 50) {
          suggestions.push(`👥 Build your customer base with loyalty programs and referral incentives.`);
        }
        break;
      case 'manufacturer':
        if (data.expenses > data.revenue * 0.8) {
          suggestions.push(`🏭 High production costs detected. Review raw material suppliers and operational efficiency.`);
        }
        break;
      case 'ecommerce':
        suggestions.push(`🛒 Consider implementing abandoned cart recovery to boost online sales.`);
        break;
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  // Trend detection
  detectTrends(data: BusinessData): { type: 'positive' | 'negative' | 'neutral', message: string }[] {
    const trends = [];
    
    if (data.trends) {
      if (data.trends.revenueChange > 10) {
        trends.push({
          type: 'positive' as const,
          message: `Revenue increased by ${data.trends.revenueChange.toFixed(1)}% - excellent growth!`
        });
      } else if (data.trends.revenueChange < -5) {
        trends.push({
          type: 'negative' as const,
          message: `Revenue decreased by ${Math.abs(data.trends.revenueChange).toFixed(1)}% - needs attention`
        });
      }

      if (data.trends.profitChange > 15) {
        trends.push({
          type: 'positive' as const,
          message: `Profit improved by ${data.trends.profitChange.toFixed(1)}% - great operational efficiency`
        });
      }
    }

    return trends;
  }

  // Check if API key is configured
  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  // Test API connection
  async testConnection(): Promise<boolean> {
    if (!this.apiKey) return false;
    
    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Test connection'
            }]
          }]
        })
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const aiService = new AIService();
export type { BusinessData, AIQuery, AIResponse };
