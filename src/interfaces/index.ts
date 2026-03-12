// ✅ Абстракції та інтерфейси — DIP + ISP

// --- Користувач ---
export interface User {
  id: string;
  type: "standard" | "premium" | "vip" | "student" | "guest";
  email: string;
  phone?: string;
  deviceId?: string;
  notificationPreference: "email" | "sms" | "push";
}

// --- Замовлення ---
export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export type OrderStatus = "placed" | "paid" | "returned" | "cancelled";

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
}

// ✅ ISP: маленькі, специфічні інтерфейси

// --- Репозиторій ---
export interface IOrderRepository {
  save(order: Order): void;
  findById(orderId: string): Order | undefined;
  findAll(): Order[];
}

// --- Користувачі ---
export interface IUserRepository {
  findById(userId: string): User | undefined;
}

// ✅ ISP: окремий інтерфейс для розрахунку знижки
export interface IDiscountStrategy {
  apply(total: number, user: User): number;
}

// ✅ ISP: окремий інтерфейс для оплати
export interface IPaymentProcessor {
  readonly type: string;
  process(userId: string, amount: number): boolean;
}

// ✅ ISP: окремий інтерфейс для нотифікацій
export interface INotifier {
  readonly channel: string;
  notify(user: User, message: string): void;
}

// ✅ ISP: окремий інтерфейс для логування
export interface ILogger {
  log(message: string): void;
  error(message: string): void;
}

// ✅ ISP: окремий інтерфейс для генерації звітів
export interface IReportGenerator {
  readonly format: string;
  generate(orders: Order[]): string;
}

// ✅ ISP: окремий інтерфейс для сервісу знижок
export interface IDiscountService {
  calculate(total: number, user: User): number;
}

// ✅ ISP: окремий інтерфейс для нотифікаційного сервісу
export interface INotificationService {
  send(user: User, message: string): void;
}

// ✅ ISP: Інтерфейс для розміщення замовлень
export interface IOrderService {
  placeOrder(userId: string, items: OrderItem[], paymentType: string): string;
}

// ✅ ISP: Інтерфейс для повернень (не нав'язується тим, кому не потрібно)
export interface IReturnService {
  processReturn(orderId: string): void;
}

// ✅ ISP: Інтерфейс для звітів (не нав'язується гостям)
export interface IReportService {
  generateReport(format: string): string;
}