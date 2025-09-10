import { notificationService } from "./notification-service";

// Event types for cross-module data flow
export type DataFlowEvent =
  | "order_created"
  | "order_updated"
  | "inventory_changed"
  | "customer_added"
  | "payment_received"
  | "task_assigned"
  | "staff_activity"
  | "expense_added"
  | "sale_completed"
  | "service_booked"
  | "production_started"
  | "raw_material_updated";

export interface DataFlowEventData {
  type: DataFlowEvent;
  payload: any;
  source: string; // Which module triggered the event
  timestamp: number;
  userId: string;
  businessId: string;
}

class DataFlowService {
  private listeners: Map<DataFlowEvent, ((data: DataFlowEventData) => void)[]> =
    new Map();
  private eventHistory: DataFlowEventData[] = [];

  constructor() {
    this.initializeDefaultFlows();
  }

  // Register event listener
  subscribe(
    eventType: DataFlowEvent,
    callback: (data: DataFlowEventData) => void,
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const callbacks = this.listeners.get(eventType)!;
    callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  // Emit event to trigger cross-module updates
  emit(eventData: DataFlowEventData): void {
    // Store in history
    this.eventHistory.push(eventData);

    // Keep only last 1000 events
    if (this.eventHistory.length > 1000) {
      this.eventHistory = this.eventHistory.slice(-1000);
    }

    // Notify all listeners
    const callbacks = this.listeners.get(eventData.type) || [];
    callbacks.forEach((callback) => {
      try {
        callback(eventData);
      } catch (error) {
        console.error("Error in data flow callback:", error);
      }
    });

    // Trigger automatic updates
    this.handleAutomaticUpdates(eventData);
  }

  // Initialize default cross-module data flows
  private initializeDefaultFlows(): void {
    // Order creation affects inventory and analytics
    this.subscribe("order_created", (data) => {
      this.updateInventoryFromOrder(data);
      this.updateAnalyticsFromOrder(data);
      this.triggerNotification("order_created", data);
    });

    // Inventory changes trigger low stock alerts
    this.subscribe("inventory_changed", (data) => {
      this.checkLowStockAlerts(data);
      this.updateAnalyticsFromInventory(data);
    });

    // Payment received updates financials and customer data
    this.subscribe("payment_received", (data) => {
      this.updateFinancialsFromPayment(data);
      this.updateCustomerData(data);
      this.triggerNotification("payment_received", data);
    });

    // Task assignment creates performance tracking data
    this.subscribe("task_assigned", (data) => {
      this.updatePerformanceMetrics(data);
      this.triggerNotification("task_assigned", data);
    });

    // Sale completion updates multiple modules
    this.subscribe("sale_completed", (data) => {
      this.updateInventoryFromSale(data);
      this.updateCustomerHistory(data);
      this.updateSalesAnalytics(data);
      this.updatePerformanceMetrics(data);
      this.triggerNotification("sale_completed", data);
    });

    // Service booking affects scheduling and performance
    this.subscribe("service_booked", (data) => {
      this.updateScheduling(data);
      this.updateServiceAnalytics(data);
      this.triggerNotification("service_booked", data);
    });

    // Production activities affect inventory and costs
    this.subscribe("production_started", (data) => {
      this.updateProductionCosts(data);
      this.triggerNotification("production_started", data);
    });
  }

  // Handle automatic system updates
  private handleAutomaticUpdates(eventData: DataFlowEventData): void {
    // Add to activity logs
    this.addToActivityLogs(eventData);

    // Update AI insights data
    this.updateAIInsights(eventData);

    // Update dashboard metrics
    this.updateDashboardMetrics(eventData);
  }

  // Specific update handlers
  private updateInventoryFromOrder(data: DataFlowEventData): void {
    if (data.payload.items) {
      data.payload.items.forEach((item: any) => {
        console.log(`Updating inventory: ${item.productId} -${item.quantity}`);
        // In real implementation, would call inventory API
      });
    }
  }

  private updateAnalyticsFromOrder(data: DataFlowEventData): void {
    console.log("Updating analytics with new order data");
    // Update sales metrics, revenue calculations, etc.
  }

  private updateInventoryFromSale(data: DataFlowEventData): void {
    if (data.payload.items) {
      data.payload.items.forEach((item: any) => {
        console.log(`Inventory sold: ${item.productId} -${item.quantity}`);
      });
    }
  }

  private updateCustomerHistory(data: DataFlowEventData): void {
    if (data.payload.customerId) {
      console.log(`Updating customer history for: ${data.payload.customerId}`);
    }
  }

  private updateSalesAnalytics(data: DataFlowEventData): void {
    console.log("Updating sales analytics with completed sale");
  }

  private updateFinancialsFromPayment(data: DataFlowEventData): void {
    console.log("Updating financial records with payment");
  }

  private updateCustomerData(data: DataFlowEventData): void {
    if (data.payload.customerId) {
      console.log(
        `Updating customer payment history: ${data.payload.customerId}`,
      );
    }
  }

  private updatePerformanceMetrics(data: DataFlowEventData): void {
    console.log("Updating staff performance metrics");
  }

  private updateScheduling(data: DataFlowEventData): void {
    console.log("Updating service scheduling system");
  }

  private updateServiceAnalytics(data: DataFlowEventData): void {
    console.log("Updating service usage analytics");
  }

  private updateProductionCosts(data: DataFlowEventData): void {
    console.log("Updating production cost calculations");
  }

  private checkLowStockAlerts(data: DataFlowEventData): void {
    if (data.payload.quantity && data.payload.minQuantity) {
      if (data.payload.quantity <= data.payload.minQuantity) {
        notificationService.warning(
          "Low Stock Alert",
          `${data.payload.productName} is running low (${data.payload.quantity} remaining)`,
        );
      }
    }
  }

  private addToActivityLogs(eventData: DataFlowEventData): void {
    console.log("Adding to activity logs:", eventData.type);
    // Store in activity log system
  }

  private updateAIInsights(eventData: DataFlowEventData): void {
    console.log("Updating AI insights with new data");
    // Feed data to AI assistant for trend analysis
  }

  private updateDashboardMetrics(eventData: DataFlowEventData): void {
    console.log("Updating dashboard KPIs");
    // Update real-time dashboard metrics
  }

  private updateAnalyticsFromInventory(data: DataFlowEventData): void {
    console.log("Updating inventory analytics");
  }

  private triggerNotification(
    eventType: DataFlowEvent,
    data: DataFlowEventData,
  ): void {
    const notificationMessages = {
      order_created: {
        title: "New Order Created",
        message: `Order #${data.payload.orderId} has been created`,
      },
      payment_received: {
        title: "Payment Received",
        message: `Payment of ${data.payload.amount} received from ${data.payload.customerName}`,
      },
      task_assigned: {
        title: "Task Assigned",
        message: `New task assigned to ${data.payload.assigneeName}`,
      },
      sale_completed: {
        title: "Sale Completed",
        message: `Sale of ${data.payload.amount} completed successfully`,
      },
      service_booked: {
        title: "Service Booked",
        message: `${data.payload.serviceName} booked for ${data.payload.customerName}`,
      },
      production_started: {
        title: "Production Started",
        message: `Production order #${data.payload.orderId} has started`,
      },
    };

    const notification =
      notificationMessages[eventType as keyof typeof notificationMessages];
    if (notification) {
      notificationService.info(notification.title, notification.message);
    }
  }

  // Get event history for analytics and auditing
  getEventHistory(limit?: number): DataFlowEventData[] {
    return limit ? this.eventHistory.slice(-limit) : this.eventHistory;
  }

  // Clear event history
  clearHistory(): void {
    this.eventHistory = [];
  }

  // Get statistics
  getEventStats(): { [key in DataFlowEvent]?: number } {
    const stats: { [key in DataFlowEvent]?: number } = {};
    this.eventHistory.forEach((event) => {
      stats[event.type] = (stats[event.type] || 0) + 1;
    });
    return stats;
  }
}

// Singleton instance
export const dataFlowService = new DataFlowService();

// Helper functions for common operations
export const triggerOrderCreated = (
  orderData: any,
  userId: string,
  businessId: string,
) => {
  dataFlowService.emit({
    type: "order_created",
    payload: orderData,
    source: "orders",
    timestamp: Date.now(),
    userId,
    businessId,
  });
};

export const triggerInventoryChanged = (
  inventoryData: any,
  userId: string,
  businessId: string,
) => {
  dataFlowService.emit({
    type: "inventory_changed",
    payload: inventoryData,
    source: "inventory",
    timestamp: Date.now(),
    userId,
    businessId,
  });
};

export const triggerSaleCompleted = (
  saleData: any,
  userId: string,
  businessId: string,
) => {
  dataFlowService.emit({
    type: "sale_completed",
    payload: saleData,
    source: "sales",
    timestamp: Date.now(),
    userId,
    businessId,
  });
};

export const triggerPaymentReceived = (
  paymentData: any,
  userId: string,
  businessId: string,
) => {
  dataFlowService.emit({
    type: "payment_received",
    payload: paymentData,
    source: "payments",
    timestamp: Date.now(),
    userId,
    businessId,
  });
};

export const triggerTaskAssigned = (
  taskData: any,
  userId: string,
  businessId: string,
) => {
  dataFlowService.emit({
    type: "task_assigned",
    payload: taskData,
    source: "tasks",
    timestamp: Date.now(),
    userId,
    businessId,
  });
};
