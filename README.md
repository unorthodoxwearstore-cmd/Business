# Insygth - Complete Business Management Application

![Hisaabb Logo](public/placeholder.svg)

**Insygth** is a comprehensive, production-ready business management application designed to handle diverse business types with role-based access control, AI-powered insights, and advanced analytics. Built with modern web technologies for scalability and security.

## 🌟 Key Features

### 🤖 AI Business Assistant
- **GPT-3.5/GPT-4 Integration**: Smart business analysis using Google AI Studio API
- **Natural Language Q&A**: Ask questions about business performance, trends, and get actionable recommendations
- **Role-based Insights**: AI responses tailored to user permissions and business context
- **Smart Suggestions**: Automated alerts for low stock, profit drops, growth opportunities
- **Trend Detection**: Identify patterns in revenue, expenses, and business metrics

### 📊 Advanced Analytics (Owner Only)
- **Revenue & Sales Reports**: Comprehensive financial tracking with visual charts
- **EBITDA & PAT Analysis**: Earnings before interest, taxes, depreciation & amortization
- **Business Valuation Calculator**: Multi-method valuation using industry multipliers
- **Asset Management**: Track depreciation, current values, and asset lifecycle
- **Liability Overview**: Monitor loans, EMIs, and outstanding dues with payment schedules

### 🔐 Secure Authentication & Authorization
- **JWT-based Authentication**: Secure token-based session management
- **Role-based Access Control**: Owner, Co-Founder, Manager, Staff, Accountant, Sales Executive
- **Business-specific Permissions**: Granular access control for different business operations
- **Owner & Staff Password System**: Dual password system for enhanced security
- **Protected Routes**: Route-level security with automatic redirects

### 🏢 Multi-Business Type Support

#### **Manufacturer Features**
- Raw Material Stock Tracking with multi-warehouse support
- Bill of Materials (BoM) management with cost calculation
- Production Planning and waste tracking
- Cost per unit calculation and dispatch management
- Vendor management and multi-branch synchronization

#### **Wholesaler Features**
- Bulk Inventory Management across warehouses
- Party Ledger & Receivables with aging analysis
- Professional Invoice Generator with GST compliance
- Transport Logs with vehicle and route tracking
- Sales performance charts and commission tracking

#### **Distributor Features**
- Territory Management with salesman assignment
- Brand-wise product management
- Area-wise client tracking and route planning
- Target vs achievement reports
- Scheme/offer management and credit follow-ups

#### **Trader/Reseller Features**
- Buy-Sell Transaction Tracking with profit analysis
- Margin Calculator with real-time profit calculations
- Inventory valuation and manual stock adjustments
- Party management and delivery tracking

#### **Franchisee Features**
- Brand Controls with compliance tracking
- Franchise sales logs and royalty tracking
- Head office communication hub
- Standard offers sync and contract renewal alerts

### 🎨 Modern UI/UX
- **Light Mode Only**: Clean, business-friendly interface
- **Shimmer Loading**: Smooth loading states for better user experience
- **Smooth Transitions**: CSS and JavaScript animations for fluid interactions
- **Multi-language Support**: English and Hindi (हिंदी) language options
- **Responsive Design**: Mobile-first approach with tablet and desktop optimization
- **Modular Components**: Business-type specific dashboards and widgets

### 🛡️ Production-Ready Architecture
- **Error Handling**: Comprehensive error tracking with user-friendly messages
- **Performance Monitoring**: Page load metrics and interaction tracking
- **Validation System**: Input validation with sanitization for security
- **Configuration Management**: Environment-based feature flags and settings
- **Logging System**: Structured logging with local storage and remote reporting

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Google AI Studio API key (optional, for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/insygth.git
   cd insygth
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Access the application**
   - Open [http://localhost:5173](http://localhost:5173)
   - Use demo credentials:
     - Email: `owner@business.com`
     - Owner Password: `owner123`
     - Staff Password: `staff123`

## 🏗️ Project Structure

```
insygth/
├── client/                     # Frontend React application
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI components (shadcn/ui)
│   │   ├── ProtectedRoute.tsx # Route protection wrapper
│   │   ├── LanguageSwitcher.tsx # Multi-language support
│   │   └── Loading.tsx       # Loading states and skeletons
│   ├── lib/                  # Utility libraries
│   │   ├── auth-service.ts   # Authentication logic
│   │   ├── ai-service.ts     # AI integration service
│   │   ├── permissions.ts    # Role-based access control
│   │   ├── i18n.ts          # Internationalization
│   │   ├── validation.ts     # Form validation utilities
│   │   ├── config.ts        # Application configuration
│   │   ├── error-handler.ts  # Error handling system
│   │   └── utils.ts         # Common utilities
│   ├── pages/               # Page components
│   │   ├── dashboard/       # Dashboard pages
│   │   │   ├── Analytics.tsx
│   │   │   ├── AdvancedAnalytics.tsx
│   │   │   ├─��� AIAssistant.tsx
│   │   │   └── ...
│   │   ├── business/        # Business-specific pages
│   │   │   ├── manufacturer/
│   │   │   ├── wholesaler/
│   │   │   ├── distributor/
│   │   │   ├── trader/
│   │   │   └── franchisee/
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── Signin.tsx       # Authentication
│   │   └── Signup.tsx       # Registration
│   └── App.tsx             # Main application component
├── shared/                 # Shared types and utilities
│   ├── types.ts           # TypeScript type definitions
│   └── api.ts             # API interfaces
├── server/                # Backend server (Node.js/Express)
├── public/               # Static assets
└── netlify/             # Netlify deployment configuration
```

## 🔧 Configuration

### Environment Variables

Key environment variables (see `.env.example` for full list):

```bash
# API Configuration
VITE_API_BASE_URL=https://api.your-domain.com/api

# Feature Flags
VITE_ENABLE_AI_ASSISTANT=true
VITE_ENABLE_ADVANCED_ANALYTICS=true
VITE_ENABLE_MULTI_LANGUAGE=true

# Google AI Studio (for AI features)
VITE_GOOGLE_AI_API_KEY=your_api_key_here

# Security
VITE_ENABLE_CSP=true
VITE_ENABLE_HSTS=true
```

### Feature Flags

Control features using environment variables:
- `VITE_ENABLE_AI_ASSISTANT`: Enable/disable AI assistant
- `VITE_ENABLE_ADVANCED_ANALYTICS`: Enable/disable owner analytics
- `VITE_ENABLE_MULTI_LANGUAGE`: Enable/disable language switching
- `VITE_ENABLE_ANIMATIONS`: Enable/disable UI animations

## 👥 User Roles & Permissions

### Owner
- Full access to all features and modules
- Advanced analytics and business valuation
- User management and business settings
- AI assistant with comprehensive insights

### Co-Founder
- Most operational features
- Advanced analytics (limited)
- Team management capabilities
- AI assistant access

### Manager
- Department-specific modules
- Team analytics and management
- AI assistant for operational insights
- Export capabilities for team reports

### Staff
- Basic operational modules
- Limited data access (own assignments)
- Basic reporting capabilities

### Accountant
- Financial modules and reports
- GST and tax-related features
- AI assistant for financial insights
- Export financial reports

### Sales Executive
- Sales and customer modules
- Commission and target tracking
- Customer relationship management
- AI assistant for sales optimization

## 🤖 AI Assistant Setup

1. **Get Google AI Studio API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key for configuration

2. **Configure in Application**
   - Go to Dashboard → AI Assistant
   - Click "Setup AI Assistant"
   - Enter your API key
   - Start asking questions about your business!

3. **Sample Questions**
   - "Why did my profit drop last month?"
   - "Which products are my best sellers?"
   - "How can I improve my profit margins?"
   - "What are my top business risks right now?"

## 🌐 Multi-Language Support

Hisaabb supports English and Hindi languages:

- **English**: Default language for international users
- **हिंदी (Hindi)**: Localized for Indian users
- **Language Switcher**: Available in the top navigation
- **Persistent Selection**: Language preference saved locally

Add new languages by extending the translation files in `client/lib/i18n.ts`.

## 🔒 Security Features

### Authentication
- JWT-based session management
- Secure password hashing
- Role-based access control
- Automatic token refresh

### Data Protection
- Input validation and sanitization
- XSS protection
- CSRF protection (when deployed)
- Secure headers for production

### Privacy
- Local data storage with encryption
- No external data sharing
- User consent for analytics
- GDPR compliance ready

## 📈 Performance & Monitoring

### Performance Features
- Lazy loading for routes
- Code splitting for optimal bundle size
- Image optimization and caching
- Service worker for offline support (production)

### Monitoring
- Error tracking and reporting
- Performance metrics collection
- User interaction analytics
- Real-time error notifications

## 🚀 Deployment

### Production Build
```bash
npm run build
# or
yarn build
```

### Netlify Deployment
1. Connect your repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Set environment variables in Netlify dashboard
4. Deploy!

### Manual Deployment
1. Build the application
2. Upload `dist/` folder to your web server
3. Configure web server for SPA routing
4. Set up SSL certificate
5. Configure security headers

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow TypeScript strict mode
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages
- Add unit tests for new features

## 📞 Support

### Documentation
- Visit [docs.insygth.com](https://docs.insygth.com) for detailed guides
- Check the [FAQ section](https://docs.insygth.com/faq) for common questions

### Community
- [GitHub Discussions](https://github.com/your-org/insygth/discussions) for questions
- [Issues](https://github.com/your-org/insygth/issues) for bug reports
- [Discord Community](https://discord.gg/insygth) for real-time chat

### Commercial Support
- Email: support@insygth.com
- Enterprise support available
- Custom development services

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Google AI Studio](https://makersuite.google.com/) for AI capabilities
- [React](https://reactjs.org/) and [TypeScript](https://www.typescriptlang.org/) for the foundation
- [Vite](https://vitejs.dev/) for lightning-fast development

---

**Built with ❤️ for small and medium businesses worldwide**

*Hisaabb - Making business management simple, intelligent, and accessible.*
