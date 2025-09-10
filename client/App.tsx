import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastContainer } from "@/components/Toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/dashboard/Analytics";
import AdvancedAnalytics from "./pages/dashboard/AdvancedAnalytics";
import Products from "./pages/dashboard/Products";
import Orders from "./pages/dashboard/Orders";
import AIAssistant from "./pages/dashboard/AIAssistant";
import Settings from "./pages/dashboard/Settings";
import ProtectedRoute from "./components/ProtectedRoute";
// Business-specific components
import CustomerDatabase from "./pages/business/retailer/CustomerDatabase";
import ProductCatalog from "./pages/business/ecommerce/ProductCatalog";
import BookingScheduling from "./pages/business/service/BookingScheduling";
import CommissionManagement from "./pages/business/wholesale/CommissionManagement";
// Manufacturer components
import RecipePage from "./pages/business/manufacturer/Recipe";
import ProductionPage from "./pages/business/manufacturer/Production";
import ProductionLogs from "./pages/business/manufacturer/ProductionLogs";
// Wholesaler components
import PartyLedger from "./pages/business/wholesaler/PartyLedger";
import BulkInventory from "./pages/business/wholesaler/BulkInventory";
import InvoiceGenerator from "./pages/business/wholesaler/InvoiceGenerator";
import TransportLogs from "./pages/business/wholesaler/TransportLogs";
// Distributor components
import TerritoryManagement from "./pages/business/distributor/TerritoryManagement";
import BrandProductManager from "./pages/business/distributor/BrandProductManager";
// Trader components
import BuySellTracking from "./pages/business/trader/BuySellTracking";
// Staff Management components
import StaffManagement from "./pages/StaffManagement";
import AttendanceManagement from "./pages/staff/AttendanceManagement";
import PerformanceTracking from "./pages/staff/PerformanceTracking";
import StaffCommissionManagement from "./pages/staff/CommissionManagement";
import StaffLeaderboard from "./pages/staff/StaffLeaderboard";
import SupportTickets from "./pages/staff/SupportTickets";
import InternalChat from "./pages/InternalChat";
import TaskAssignment from "./pages/TaskAssignment";
import WhatsAppDashboard from "./pages/dashboard/WhatsAppDashboard";
import PaymentReminders from "./pages/dashboard/PaymentReminders";
import InventoryBatches from "./pages/dashboard/InventoryBatches";
import Inventory from "./pages/dashboard/InventoryEnhanced";
import NewSale from "./pages/sales/NewSale";
import SalesDocuments from "./pages/dashboard/SalesDocuments";
import InvoicePreview from "./pages/dashboard/InvoicePreview";
import ProductManagement from "./pages/dashboard/ProductManagement";
import OrderManagement from "./pages/dashboard/OrderManagement";
import StaffManagementSystem from "./pages/dashboard/StaffManagementSystem";
import StaffApprovals from "./pages/dashboard/StaffApprovals";
import AnalyticsSystem from "./pages/dashboard/AnalyticsSystem";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";
// New feature components
import CRM from "./pages/dashboard/CRM";
import DocumentVault from "./pages/dashboard/DocumentVault";
import OwnerAnalytics from "./pages/dashboard/OwnerAnalytics";
import PerformanceReports from "./pages/dashboard/PerformanceReports";
import VendorManagement from "./pages/dashboard/VendorManagement";
import BranchManagement from "./pages/dashboard/BranchManagement";
import ErrorBoundary from "./components/ErrorBoundary";
import ImportBatchDetail from "./pages/dashboard/ImportBatchDetail";
import AccountPage from "./pages/dashboard/Account";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          {/* Placeholder routes for future features */}
          <Route path="/demo" element={<PlaceholderPage title="Product Demo" description="Watch our comprehensive product demo to see how Insygth can transform your business operations." feature="The interactive demo" />} />
          <Route path="/features" element={<PlaceholderPage title="Features" description="Explore all the powerful features that make Insygth the complete business management solution." feature="The features page" />} />
          <Route path="/pricing" element={<PlaceholderPage title="Pricing Plans" description="Choose the perfect plan for your business needs with transparent, affordable pricing." feature="Pricing information" />} />
          <Route path="/integrations" element={<PlaceholderPage title="Integrations" description="Connect Insygth with your favorite tools and services for seamless workflow." feature="Integration marketplace" />} />
          <Route path="/about" element={<PlaceholderPage title="About Us" description="Learn more about our mission to empower businesses with intelligent management tools." feature="Company information" />} />
          <Route path="/contact" element={<PlaceholderPage title="Contact Us" description="Get in touch with our team for support, sales inquiries, or partnership opportunities." feature="Contact form" />} />
          <Route path="/support" element={<PlaceholderPage title="Support Center" description="Find help, documentation, and resources to get the most out of Insygth." feature="Support resources" />} />
          <Route path="/privacy" element={<PlaceholderPage title="Privacy Policy" description="Learn how we protect your data and respect your privacy while using Insygth." feature="Privacy policy" />} />

          {/* Dashboard sub-routes */}
          <Route path="/dashboard/account" element={<AccountPage />} />
          <Route path="/dashboard/analytics" element={
            <ProtectedRoute requiredPermission="view_basic_analytics">
              <AnalyticsSystem />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/advanced-analytics" element={
            <ProtectedRoute ownerOnly={true}>
              <AdvancedAnalytics />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/products" element={
            <ProtectedRoute requiredPermission="addEditDeleteProducts">
              <ProductManagement />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/orders" element={
            <ProtectedRoute requiredPermission="viewAddEditOrders">
              <OrderManagement />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/users" element={<PlaceholderPage title="User Management" description="Manage team members, roles, and permissions for your business." feature="User management" />} />
          <Route path="/dashboard/financials" element={<PlaceholderPage title="Financial Reports" description="View P&L statements, EBITDA analysis, and comprehensive financial reporting." feature="Financial reports" />} />
          <Route path="/dashboard/tasks" element={
            <ProtectedRoute requiredPermission="taskAndTodoManager">
              <TaskAssignment />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/hr" element={<PlaceholderPage title="HR & Attendance" description="Manage staff attendance, leave requests, and HR operations." feature="HR management" />} />
          <Route path="/dashboard/assets" element={<PlaceholderPage title="Asset Management" description="Track business assets, liabilities, and resource allocation." feature="Asset tracking" />} />
          <Route path="/dashboard/ai" element={
            <ProtectedRoute requiredPermission="view_ai_assistant">
              <AIAssistant />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/qr-scanner" element={<PlaceholderPage title="QR Code Scanner" description="Scan QR codes for quick product lookup and data entry." feature="QR scanner" />} />
          <Route path="/dashboard/asset-tracker" element={<PlaceholderPage title="Asset Tracker" description="Real-time tracking of vehicles, equipment, and business assets." feature="Asset tracker" />} />
          <Route path="/dashboard/performance" element={
            <ProtectedRoute requiredPermission="performanceDashboard">
              <PerformanceTracking />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/todo" element={<PlaceholderPage title="Task & To-Do Manager" description="Personal and team task management with priorities and deadlines." feature="Todo management" />} />
          <Route path="/dashboard/chat" element={
            <ProtectedRoute requiredPermission="internalTeamChat">
              <InternalChat />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/attendance" element={
            <ProtectedRoute requiredPermission="leaveAndAttendance">
              <AttendanceManagement />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/activity-logs" element={<PlaceholderPage title="Activity Logs" description="Monitor user actions and system activity for security and auditing." feature="Activity monitoring" />} />
          <Route path="/dashboard/branches" element={
            <ProtectedRoute ownerOnly={true}>
              <BranchManagement />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/settings" element={<Settings />} />
          <Route path="/dashboard/export" element={<PlaceholderPage title="Data Export" description="Export business data to CSV, Excel, and other formats." feature="Data export" />} />
          <Route path="/dashboard/import" element={<PlaceholderPage title="Data Import" description="Import data from CSV, Excel, and external sources." feature="Data import" />} />

          {/* Staff Management Routes */}
          <Route path="/dashboard/staff" element={
            <ProtectedRoute requiredPermission="manage_team">
              <StaffManagementSystem />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/staff/approvals" element={
            <ProtectedRoute ownerOnly={true}>
              <StaffApprovals />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/staff/commission" element={
            <ProtectedRoute requiredPermission="financialReports">
              <StaffCommissionManagement />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/staff/leaderboard" element={
            <ProtectedRoute requiredPermission="performanceDashboard">
              <StaffLeaderboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/staff/support" element={
            <ProtectedRoute>
              <SupportTickets />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/tasks/assignment" element={
            <ProtectedRoute requiredPermission="assignTasksOrRoutes">
              <TaskAssignment />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/whatsapp" element={
            <ProtectedRoute requiredPermission="manage_settings">
              <WhatsAppDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/payment-reminders" element={
            <ProtectedRoute requiredPermission="viewAddEditOrders">
              <PaymentReminders />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/inventory-batches" element={
            <ProtectedRoute requiredPermission="addEditDeleteProducts">
              <InventoryBatches />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/inventory" element={
            <ProtectedRoute requiredPermission="addEditDeleteProducts">
              <Inventory />
            </ProtectedRoute>
          } />
          <Route path="/sales/new" element={
            <ProtectedRoute requiredPermission="viewAddEditOrders">
              <NewSale />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/sales-documents" element={
            <ProtectedRoute requiredPermission="viewAddEditOrders">
              <SalesDocuments />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/sales-documents/invoice/:invoiceId" element={
            <ProtectedRoute requiredPermission="viewAddEditOrders">
              <InvoicePreview />
            </ProtectedRoute>
          } />
          <Route path="/imports/:batchId" element={
            <ProtectedRoute>
              <ImportBatchDetail />
            </ProtectedRoute>
          } />

          {/* New Enhanced Features */}
          <Route path="/dashboard/crm" element={
            <ProtectedRoute requiredPermission="viewAddEditOrders">
              <CRM />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/document-vault" element={
            <ProtectedRoute requiredPermission="viewAddEditOrders">
              <DocumentVault />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/owner-analytics" element={
            <ProtectedRoute ownerOnly={true}>
              <OwnerAnalytics />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/staff/performance" element={
            <ProtectedRoute requiredPermission="performanceDashboard">
              <PerformanceReports />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/vendor-management" element={
            <ProtectedRoute requiredPermission="addEditDeleteProducts">
              <VendorManagement />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/branch-management" element={
            <ProtectedRoute ownerOnly={true}>
              <BranchManagement />
            </ProtectedRoute>
          } />

          {/* Business-specific module routes */}
          {/* Retailer specific routes */}
          <Route path="/dashboard/retailer/customers" element={
            <ProtectedRoute requiredPermission="viewAddEditOrders">
              <CustomerDatabase />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/retailer/inventory" element={<PlaceholderPage title="Retail Inventory" description="Advanced inventory management with stock tracking, variants, and alerts." feature="Retail inventory system" />} />
          <Route path="/dashboard/retailer/offers" element={<PlaceholderPage title="Offers & Promotions" description="Create and manage time-limited discounts and combo offers." feature="Promotion management" />} />
          <Route path="/dashboard/retailer/expenses" element={<PlaceholderPage title="Expense Tracking" description="Track daily and monthly business expenses with categorization." feature="Expense management" />} />
          <Route path="/dashboard/retailer/sales-analytics" element={<PlaceholderPage title="Sales Analytics" description="Detailed sales reports with visual trends and insights." feature="Sales analytics" />} />
          <Route path="/dashboard/retailer/gst-reports" element={<PlaceholderPage title="GST Reports" description="Generate and download GST filing data and compliance reports." feature="GST reporting" />} />
          <Route path="/dashboard/retailer/catalog-sharing" element={<PlaceholderPage title="Catalog Sharing" description="Share product catalogs via PDF/WhatsApp" feature="Catalog sharing" />} />
          <Route path="/dashboard/retailer/inventory-sync" element={<PlaceholderPage title="Multi-Branch Inventory Sync" description="Synchronize inventory across multiple retail locations" feature="Inventory synchronization" />} />

          {/* E-commerce specific routes */}
          <Route path="/dashboard/ecommerce/product-catalog" element={
            <ProtectedRoute requiredPermission="addEditDeleteProducts">
              <ProductCatalog />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/ecommerce/catalog" element={
            <ProtectedRoute requiredPermission="addEditDeleteProducts">
              <ProductCatalog />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/ecommerce/orders" element={<PlaceholderPage title="In-App Ordering System" description="Customer ordering system with cart and checkout" feature="Order management system" />} />
          <Route path="/dashboard/ecommerce/ordering" element={<PlaceholderPage title="In-App Ordering" description="Manage customer orders and order processing workflow." feature="Order management system" />} />
          <Route path="/dashboard/ecommerce/order-tracking" element={<PlaceholderPage title="Order Tracking & Fulfillment Analytics" description="Track orders from placement to delivery with analytics" feature="Order tracking" />} />
          <Route path="/dashboard/ecommerce/reviews" element={<PlaceholderPage title="Customer Feedback/Reviews" description="Manage customer reviews and feedback" feature="Review management" />} />
          <Route path="/dashboard/ecommerce/feedback" element={<PlaceholderPage title="Customer Feedback" description="Collect and manage customer reviews and ratings." feature="Feedback management" />} />
          <Route path="/dashboard/ecommerce/payments" element={<PlaceholderPage title="Payment Tracking" description="UPI, COD, Card payment tracking and reconciliation" feature="Payment tracking" />} />
          <Route path="/dashboard/ecommerce/invoices" element={<PlaceholderPage title="Auto-Invoice Generator" description="Automated invoice generation for orders" feature="Invoice automation" />} />

          {/* Service business specific routes */}
          <Route path="/dashboard/service/services" element={<PlaceholderPage title="Service Listing with Prices" description="Manage service offerings and pricing" feature="Service management" />} />
          <Route path="/dashboard/service/bookings" element={<BookingScheduling />} />
          <Route path="/dashboard/service/time-slots" element={<PlaceholderPage title="Time Slot Management" description="Configure and manage available time slots" feature="Schedule management" />} />
          <Route path="/dashboard/service/reviews" element={<PlaceholderPage title="Post-Service Reviews" description="Collect and manage customer service reviews" feature="Review management" />} />
          <Route path="/dashboard/service/payments" element={<PlaceholderPage title="Online Payment Tracker" description="Track digital payments for services" feature="Payment tracking" />} />
          <Route path="/dashboard/service/financials" element={<PlaceholderPage title="Income & Expense Overview" description="Financial overview specific to service business" feature="Financial management" />} />
          <Route path="/dashboard/service/staff-assignment" element={<PlaceholderPage title="Staff-to-Service Assignment" description="Assign staff members to specific services" feature="Staff assignment" />} />
          <Route path="/dashboard/service/quotations" element={<PlaceholderPage title="Quotation Generator" description="Generate professional service quotations" feature="Quotation system" />} />
          <Route path="/dashboard/service/analytics" element={<PlaceholderPage title="Service Usage Analytics" description="Analytics on service performance and usage" feature="Service analytics" />} />

          {/* B2B/Wholesale specific routes */}
          <Route path="/dashboard/wholesaler/bulk-orders" element={<PlaceholderPage title="Bulk Order Management" description="Manage large volume orders and delivery coordination." feature="Bulk order system" />} />
          <Route path="/dashboard/wholesaler/commissions" element={<CommissionManagement />} />
          <Route path="/dashboard/wholesaler/client-profitability" element={<PlaceholderPage title="Client Profitability" description="Analyze profit margins and ROI per client relationship." feature="Profitability analysis" />} />

          {/* Manufacturer specific routes */}
          <Route path="/dashboard/manufacturer/recipe" element={
            <ProtectedRoute requiredPermission="addEditDeleteProducts">
              <RecipePage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/manufacturer/production" element={
            <ProtectedRoute requiredPermission="addEditDeleteProducts">
              <ProductionPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/manufacturer/production-logs" element={
            <ProtectedRoute requiredPermission="addEditDeleteProducts">
              <ProductionLogs />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/manufacturer/production-planning" element={<PlaceholderPage title="Production Planning" description="Plan and schedule production runs with resource allocation." feature="Production planning" />} />
          <Route path="/dashboard/manufacturer/waste-tracking" element={<PlaceholderPage title="Waste Tracking" description="Monitor and analyze production waste and loss." feature="Waste management" />} />
          <Route path="/dashboard/manufacturer/cost-per-unit" element={<PlaceholderPage title="Cost per Unit Calculator" description="Calculate precise manufacturing costs per unit." feature="Cost calculation" />} />
          <Route path="/dashboard/manufacturer/dispatch" element={<PlaceholderPage title="Dispatch Management" description="Manage finished goods dispatch and delivery." feature="Dispatch management" />} />
          <Route path="/dashboard/manufacturer/purchase-orders" element={<PlaceholderPage title="Purchase Order Management" description="Manage supplier purchase orders and procurement." feature="Purchase order system" />} />
          <Route path="/dashboard/manufacturer/staff-productivity" element={<PlaceholderPage title="Staff Productivity Tracker" description="Track and analyze staff productivity metrics." feature="Productivity tracking" />} />
          <Route path="/dashboard/manufacturer/vendor-management" element={<PlaceholderPage title="Vendor Management" description="Manage supplier relationships and performance." feature="Vendor management" />} />
          <Route path="/dashboard/manufacturer/sales-commission" element={
            <ProtectedRoute requiredPermission="financialReports">
              <StaffCommissionManagement />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/manufacturer/multi-branch-sync" element={<PlaceholderPage title="Multi-Branch Sync" description="Synchronize data across manufacturing locations." feature="Multi-branch sync" />} />

          {/* Wholesaler specific routes */}
          <Route path="/dashboard/wholesaler/bulk-inventory" element={<BulkInventory />} />
          <Route path="/dashboard/wholesaler/party-ledger" element={<PartyLedger />} />
          <Route path="/dashboard/wholesaler/invoices" element={<InvoiceGenerator />} />
          <Route path="/dashboard/wholesaler/invoice-generator" element={<InvoiceGenerator />} />
          <Route path="/dashboard/wholesaler/purchase-orders" element={<PlaceholderPage title="Purchase Order System" description="Manage wholesale purchase orders" feature="Purchase order system" />} />
          <Route path="/dashboard/wholesaler/sales-performance" element={<PlaceholderPage title="Sales Performance Charts" description="Visual analytics for wholesale sales performance" feature="Sales analytics" />} />
          <Route path="/dashboard/wholesaler/commission-management" element={<PlaceholderPage title="Salesman Commission Tracking" description="Track and calculate sales commissions" feature="Commission tracking" />} />
          <Route path="/dashboard/wholesaler/salesman-commission" element={<PlaceholderPage title="Salesman Commission Tracking" description="Track and calculate sales commission payments." feature="Commission tracking" />} />
          <Route path="/dashboard/wholesaler/transport-logs" element={<TransportLogs />} />
          <Route path="/dashboard/wholesaler/distributor-sales" element={<PlaceholderPage title="Distributor-wise Sales View" description="Analyze sales performance by distributor" feature="Distributor analytics" />} />
          <Route path="/dashboard/wholesaler/gst-reports" element={<PlaceholderPage title="GST Auto-Reports" description="Automated GST reporting for wholesale operations" feature="GST reporting" />} />
          <Route path="/dashboard/wholesaler/branch-transfer" element={<PlaceholderPage title="Multi-Branch Transfer" description="Transfer inventory between wholesale branches" feature="Branch transfers" />} />
          <Route path="/dashboard/wholesaler/multi-branch-transfers" element={<PlaceholderPage title="Multi-Branch Transfers" description="Manage inventory transfers between branches." feature="Branch transfers" />} />

          {/* Distributor specific routes */}
          <Route path="/dashboard/distributor/brand-products" element={
            <ProtectedRoute requiredPermission="addEditDeleteProducts">
              <BrandProductManager />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/distributor/territory-management" element={<TerritoryManagement />} />
          <Route path="/dashboard/distributor/area-clients" element={<PlaceholderPage title="Area-wise Client Tracking" description="Track clients by geographical areas" feature="Area management" />} />
          <Route path="/dashboard/distributor/salesman-assignment" element={<PlaceholderPage title="Salesman Assignment" description="Assign salesmen to territories and clients" feature="Salesman assignment" />} />
          <Route path="/dashboard/distributor/target-achievement" element={<PlaceholderPage title="Target vs Achievement Reports" description="Track sales targets against achievements" feature="Performance tracking" />} />
          <Route path="/dashboard/distributor/schemes" element={<PlaceholderPage title="Scheme/Offer Management" description="Manage promotional schemes and offers" feature="Scheme management" />} />
          <Route path="/dashboard/distributor/schemes-offers" element={<PlaceholderPage title="Scheme/Offer Management" description="Manage promotional schemes and offers." feature="Scheme management" />} />
          <Route path="/dashboard/distributor/route-planning" element={<PlaceholderPage title="Route Planning" description="Plan and optimize delivery routes" feature="Route planning" />} />
          <Route path="/dashboard/distributor/credit-followups" element={<PlaceholderPage title="Credit Follow-ups" description="Track and follow up on credit accounts" feature="Credit management" />} />
          <Route path="/dashboard/distributor/stock-ledger" element={<PlaceholderPage title="Stock Ledger" description="Detailed stock movement tracking" feature="Stock ledger" />} />
          <Route path="/dashboard/distributor/returns" element={<PlaceholderPage title="Return/Replacement Control" description="Manage product returns and replacements" feature="Return management" />} />
          <Route path="/dashboard/distributor/returns-replacement" element={<PlaceholderPage title="Return/Replacement Control" description="Manage product returns and replacements." feature="Return management" />} />
          <Route path="/dashboard/distributor/invoicing" element={<PlaceholderPage title="Client Invoicing" description="Generate invoices for distributor clients" feature="Client invoicing" />} />
          <Route path="/dashboard/distributor/client-invoicing" element={<PlaceholderPage title="Client Invoicing" description="Generate and manage client invoices." feature="Client invoicing" />} />

          {/* Trader/Reseller specific routes */}
          <Route path="/dashboard/trader/buy-sell-tracking" element={<BuySellTracking />} />
          <Route path="/dashboard/trader/margin-calculator" element={<PlaceholderPage title="Margin Calculator" description="Calculate profit margins on trading transactions" feature="Margin calculation" />} />
          <Route path="/dashboard/trader/profit-loss" element={<PlaceholderPage title="Profit & Loss Statements" description="Generate P&L reports for trading activities" feature="P&L reporting" />} />
          <Route path="/dashboard/trader/stock-adjustments" element={<PlaceholderPage title="Manual Stock Adjustments" description="Make manual adjustments to stock levels" feature="Stock adjustments" />} />
          <Route path="/dashboard/trader/parties" element={<PlaceholderPage title="Party List" description="Manage trading partners and suppliers" feature="Party management" />} />
          <Route path="/dashboard/trader/party-list" element={<PlaceholderPage title="Party List" description="Manage supplier and customer contact lists." feature="Party management" />} />
          <Route path="/dashboard/trader/invoices" element={<PlaceholderPage title="Invoice Generator" description="Generate invoices for trading transactions" feature="Invoice generation" />} />
          <Route path="/dashboard/trader/invoice-generator" element={<PlaceholderPage title="Invoice Generator" description="Create professional invoices and billing documents." feature="Invoice generation" />} />
          <Route path="/dashboard/trader/delivery-tracking" element={<PlaceholderPage title="Delivery Tracking" description="Track deliveries and shipments" feature="Delivery tracking" />} />
          <Route path="/dashboard/trader/schemes" element={<PlaceholderPage title="Scheme Handling" description="Manage trading schemes and promotional offers" feature="Scheme management" />} />
          <Route path="/dashboard/trader/scheme-handling" element={<PlaceholderPage title="Scheme Handling" description="Manage discount schemes and promotional offers." feature="Scheme management" />} />
          <Route path="/dashboard/trader/inventory-valuation" element={<PlaceholderPage title="Inventory Valuation" description="Calculate current value of trading inventory" feature="Inventory valuation" />} />
          <Route path="/dashboard/trader/returns-refunds" element={<PlaceholderPage title="Return & Refund Logs" description="Track returns and refunds in trading" feature="Return management" />} />
          <Route path="/dashboard/trader/return-refund" element={<PlaceholderPage title="Return & Refund Logs" description="Manage product returns and refund processing." feature="Return management" />} />


          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer />
      <Toaster />
      <Sonner />
    </ErrorBoundary>
  </QueryClientProvider>
);

{
  const container = document.getElementById('root')!;
  const w = window as any;
  const root = w.__insygth_root ?? createRoot(container);
  root.render(<App />);
  w.__insygth_root = root;
}
