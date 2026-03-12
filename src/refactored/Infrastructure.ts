// ✅ SRP: Logger — одна відповідальність
import { ILogger, IOrderRepository, IUserRepository, IReportGenerator, Order, User } from "../interfaces";

export class ConsoleLogger implements ILogger {
  log(message: string): void {
    console.log(`[LOG ${new Date().toISOString()}] ${message}`);
  }
  error(message: string): void {
    console.error(`[ERR ${new Date().toISOString()}] ${message}`);
  }
}

// ✅ SRP: InMemoryOrderRepository — лише збереження замовлень
export class InMemoryOrderRepository implements IOrderRepository {
  private orders: Order[] = [];

  save(order: Order): void {
    const idx = this.orders.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      this.orders[idx] = order;
    } else {
      this.orders.push(order);
    }
  }

  findById(orderId: string): Order | undefined {
    return this.orders.find((o) => o.id === orderId);
  }

  findAll(): Order[] {
    return [...this.orders];
  }
}

// ✅ SRP: InMemoryUserRepository — лише отримання користувачів
export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User>;

  constructor(users: User[] = []) {
    this.users = new Map(users.map((u) => [u.id, u]));
  }

  findById(userId: string): User | undefined {
    return this.users.get(userId);
  }
}

// ✅ OCP + SRP: генератори звітів — кожен клас = один формат
export class JsonReportGenerator implements IReportGenerator {
  readonly format = "json";

  generate(orders: Order[]): string {
    return JSON.stringify(orders, null, 2);
  }
}

export class CsvReportGenerator implements IReportGenerator {
  readonly format = "csv";

  generate(orders: Order[]): string {
    const header = "id,userId,total,status,createdAt";
    const rows = orders.map(
      (o) => `${o.id},${o.userId},${o.total},${o.status},${o.createdAt.toISOString()}`
    );
    return [header, ...rows].join("\n");
  }
}

export class HtmlReportGenerator implements IReportGenerator {
  readonly format = "html";

  generate(orders: Order[]): string {
    const rows = orders
      .map(
        (o) =>
          `<tr><td>${o.id}</td><td>${o.userId}</td><td>${o.total}</td><td>${o.status}</td></tr>`
      )
      .join("");
    return `<table><tr><th>ID</th><th>User</th><th>Total</th><th>Status</th></tr>${rows}</table>`;
  }
}

// ✅ OCP: ReportService — реєстр генераторів, не змінюється при додаванні нових форматів
export class ReportService {
  private readonly generators: Map<string, IReportGenerator>;

  constructor(private readonly repo: IOrderRepository, generators: IReportGenerator[]) {
    this.generators = new Map(generators.map((g) => [g.format, g]));
  }

  generateReport(format: string): string {
    const generator = this.generators.get(format);
    if (!generator) throw new Error(`Report format "${format}" not supported`);
    return generator.generate(this.repo.findAll());
  }
}