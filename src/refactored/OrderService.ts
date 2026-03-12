// ✅ SRP + DIP: OrderService — лише розміщення замовлень
// Усі залежності — через абстракції (DIP)

import {
  IOrderService,
  IReturnService,
  IOrderRepository,
  IUserRepository,
  IDiscountService,
  INotificationService,
  ILogger,
  OrderItem,
  Order,
} from "../interfaces";
import { PaymentGateway } from "./PaymentGateway";

export class OrderService implements IOrderService {
  constructor(
    private readonly orderRepo: IOrderRepository,       // DIP
    private readonly userRepo: IUserRepository,         // DIP
    private readonly discountService: IDiscountService, // DIP
    private readonly paymentGateway: PaymentGateway,    // DIP
    private readonly notificationService: INotificationService, // DIP
    private readonly logger: ILogger                    // DIP
  ) {}

  placeOrder(userId: string, items: OrderItem[], paymentType: string): string {
    if (!userId || items.length === 0) {
      throw new Error("Invalid order: userId and items are required");
    }

    const user = this.userRepo.findById(userId);
    if (!user) throw new Error(`User "${userId}" not found`);

    // Розрахунок суми
    const rawTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // ✅ DIP: сервіс знижок — абстракція
    const total = this.discountService.calculate(rawTotal, user);

    // ✅ DIP: шлюз оплати — абстракція
    const success = this.paymentGateway.process(paymentType, userId, total);
    if (!success) throw new Error("Payment failed");

    const order: Order = {
      id: `ORD-${Date.now()}`,
      userId,
      items,
      total,
      status: "placed",
      createdAt: new Date(),
    };

    this.orderRepo.save(order);

    // ✅ DIP: сервіс нотифікацій — абстракція
    this.notificationService.send(user, `Your order ${order.id} has been placed! Total: ${total}`);

    // ✅ DIP: логер — абстракція
    this.logger.log(`Order ${order.id} created for user ${userId}`);

    return order.id;
  }
}

// ✅ SRP: ReturnService — виключно обробка повернень
export class ReturnService implements IReturnService {
  constructor(
    private readonly orderRepo: IOrderRepository, // DIP
    private readonly logger: ILogger              // DIP
  ) {}

  processReturn(orderId: string): void {
    const order = this.orderRepo.findById(orderId);
    if (!order) throw new Error(`Order "${orderId}" not found`);

    order.status = "returned";
    this.orderRepo.save(order);

    this.logger.log(`Order ${orderId} returned. Refunding ${order.total}`);
    console.log(`[REFUND] Refunding ${order.total} for order ${orderId}`);
  }
}

// ✅ LSP: GuestOrderService успадковує лише потрібний інтерфейс (ISP)
// і повністю замінює базовий клас без порушень контракту
export class GuestOrderService implements IOrderService {
  // Гість не може використовувати credit_card — але не кидає виняток всередині placeOrder;
  // замість цього ця перевірка — ЯВНА бізнес-логіка перед виконанням
  private static readonly DISALLOWED_PAYMENTS = new Set(["credit_card"]);

  constructor(private readonly orderService: OrderService) {}

  placeOrder(userId: string, items: OrderItem[], paymentType: string): string {
    // ✅ LSP: замість кидання помилки всередині — чітке попереднє обмеження
    if (GuestOrderService.DISALLOWED_PAYMENTS.has(paymentType)) {
      throw new Error(
        `Payment type "${paymentType}" is not allowed for guest orders. Use: paypal, crypto`
      );
    }
    return this.orderService.placeOrder(userId, items, paymentType);
  }
}