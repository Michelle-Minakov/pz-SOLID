/**
 * Tests for refactored SOLID code
 * @jest-environment node
 */

const {
  DiscountService,
  PremiumDiscountStrategy,
  VipDiscountStrategy,
  StudentDiscountStrategy,
  StandardDiscountStrategy,
  CreditCardProcessor,
  PayPalProcessor,
  CryptoProcessor,
  PaymentGateway,
  EmailNotifier,
  SmsNotifier,
  PushNotifier,
  NotificationService,
  ConsoleLogger,
  InMemoryOrderRepository,
  InMemoryUserRepository,
  JsonReportGenerator,
  CsvReportGenerator,
  HtmlReportGenerator,
  ReportService,
  OrderService,
  ReturnService,
  GuestOrderService,
} = require("../src/refactored/index");

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeUser(overrides = {}) {
  return {
    id: "user-1",
    type: "premium",
    email: "user@example.com",
    phone: "+380991234567",
    deviceId: "device-abc",
    notificationPreference: "email",
    ...overrides,
  };
}

function makeItems(overrides = {}) {
  return [{ productId: "p1", name: "Widget", price: 100, quantity: 2, ...overrides }];
}

function makeLogger() {
  return { log: jest.fn(), error: jest.fn() };
}

// ─── SRP + OCP: Discount Strategies ────────────────────────────────────────

describe("DiscountService — SRP + OCP", () => {
  const user = makeUser();

  test("StandardDiscountStrategy applies no discount", () => {
    const strategy = new StandardDiscountStrategy();
    expect(strategy.apply(100, user)).toBe(100);
  });

  test("PremiumDiscountStrategy applies 10% discount", () => {
    const strategy = new PremiumDiscountStrategy();
    expect(strategy.apply(100, user)).toBeCloseTo(90);
  });

  test("VipDiscountStrategy applies 20% discount", () => {
    const strategy = new VipDiscountStrategy();
    expect(strategy.apply(100, user)).toBeCloseTo(80);
  });

  test("StudentDiscountStrategy applies 15% discount", () => {
    const strategy = new StudentDiscountStrategy();
    expect(strategy.apply(100, user)).toBeCloseTo(85);
  });

  test("DiscountService selects correct strategy by user type", () => {
    const svc = new DiscountService();
    expect(svc.calculate(200, { ...user, type: "vip" })).toBeCloseTo(160);
    expect(svc.calculate(200, { ...user, type: "premium" })).toBeCloseTo(180);
    expect(svc.calculate(200, { ...user, type: "student" })).toBeCloseTo(170);
    expect(svc.calculate(200, { ...user, type: "standard" })).toBeCloseTo(200);
  });

  test("DiscountService accepts custom strategy map (OCP)", () => {
    const custom = new Map([
      ["vip", { apply: () => 0 }], // free for VIP
    ]);
    const svc = new DiscountService(custom);
    expect(svc.calculate(500, { ...user, type: "vip" })).toBe(0);
  });
});

// ─── OCP + DIP: Payment Gateway ─────────────────────────────────────────────

describe("PaymentGateway — OCP + DIP", () => {
  const logger = makeLogger();

  test("CreditCardProcessor processes payment", () => {
    const proc = new CreditCardProcessor(logger);
    expect(proc.process("u1", 99)).toBe(true);
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining("credit card"));
  });

  test("PayPalProcessor processes payment", () => {
    const proc = new PayPalProcessor(logger);
    expect(proc.process("u1", 50)).toBe(true);
  });

  test("CryptoProcessor processes payment", () => {
    const proc = new CryptoProcessor(logger);
    expect(proc.process("u1", 200)).toBe(true);
  });

  test("PaymentGateway routes to correct processor", () => {
    const gw = new PaymentGateway([
      new CreditCardProcessor(logger),
      new PayPalProcessor(logger),
    ]);
    expect(gw.process("credit_card", "u1", 100)).toBe(true);
    expect(gw.process("paypal", "u1", 50)).toBe(true);
  });

  test("PaymentGateway throws for unknown processor", () => {
    const gw = new PaymentGateway([new CreditCardProcessor(logger)]);
    expect(() => gw.process("bitcoin_lightning", "u1", 1)).toThrow();
  });

  test("PaymentGateway.hasProcessor returns correct boolean", () => {
    const gw = new PaymentGateway([new CreditCardProcessor(logger)]);
    expect(gw.hasProcessor("credit_card")).toBe(true);
    expect(gw.hasProcessor("paypal")).toBe(false);
  });
});

// ─── SRP + OCP: Notifiers ───────────────────────────────────────────────────

describe("NotificationService — SRP + OCP", () => {
  const spy = jest.spyOn(console, "log").mockImplementation(() => {});
  afterAll(() => spy.mockRestore());

  test("EmailNotifier sends to user email", () => {
    const notifier = new EmailNotifier();
    const user = makeUser({ notificationPreference: "email" });
    notifier.notify(user, "Hello!");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining(user.email));
  });

  test("SmsNotifier sends to user phone", () => {
    const notifier = new SmsNotifier();
    const user = makeUser({ notificationPreference: "sms" });
    notifier.notify(user, "Hello!");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining(user.phone));
  });

  test("PushNotifier sends to device", () => {
    const notifier = new PushNotifier();
    const user = makeUser({ notificationPreference: "push" });
    notifier.notify(user, "Hello!");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining(user.deviceId));
  });

  test("SmsNotifier throws if user has no phone", () => {
    const notifier = new SmsNotifier();
    const user = makeUser({ phone: undefined });
    expect(() => notifier.notify(user, "msg")).toThrow();
  });

  test("NotificationService routes to correct notifier", () => {
    const svc = new NotificationService([new EmailNotifier(), new SmsNotifier()]);
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    svc.send(makeUser({ notificationPreference: "push" }), "no push notifier");
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

// ─── SRP: Repositories ──────────────────────────────────────────────────────

describe("InMemoryOrderRepository — SRP", () => {
  test("saves and retrieves an order", () => {
    const repo = new InMemoryOrderRepository();
    const order = { id: "ORD-1", userId: "u1", items: [], total: 50, status: "placed", createdAt: new Date() };
    repo.save(order);
    expect(repo.findById("ORD-1")).toEqual(order);
  });

  test("findAll returns all orders", () => {
    const repo = new InMemoryOrderRepository();
    repo.save({ id: "A", userId: "u1", items: [], total: 10, status: "placed", createdAt: new Date() });
    repo.save({ id: "B", userId: "u2", items: [], total: 20, status: "placed", createdAt: new Date() });
    expect(repo.findAll()).toHaveLength(2);
  });

  test("updates existing order on re-save", () => {
    const repo = new InMemoryOrderRepository();
    const order = { id: "X", userId: "u1", items: [], total: 99, status: "placed", createdAt: new Date() };
    repo.save(order);
    repo.save({ ...order, status: "returned" });
    expect(repo.findById("X")?.status).toBe("returned");
  });

  test("returns undefined for unknown orderId", () => {
    const repo = new InMemoryOrderRepository();
    expect(repo.findById("NOPE")).toBeUndefined();
  });
});

describe("InMemoryUserRepository — SRP", () => {
  test("finds user by id", () => {
    const user = makeUser();
    const repo = new InMemoryUserRepository([user]);
    expect(repo.findById("user-1")).toEqual(user);
  });

  test("returns undefined for unknown user", () => {
    const repo = new InMemoryUserRepository([]);
    expect(repo.findById("ghost")).toBeUndefined();
  });
});

// ─── OCP + SRP: Report Generators ───────────────────────────────────────────

describe("ReportService — OCP + SRP", () => {
  const orders = [
    { id: "ORD-1", userId: "u1", items: [], total: 100, status: "placed", createdAt: new Date("2024-01-01") },
  ];
  const repo = { save: jest.fn(), findById: jest.fn(), findAll: jest.fn(() => orders) };

  test("JsonReportGenerator produces valid JSON", () => {
    const gen = new JsonReportGenerator();
    const result = gen.generate(orders);
    expect(() => JSON.parse(result)).not.toThrow();
    expect(JSON.parse(result)[0].id).toBe("ORD-1");
  });

  test("CsvReportGenerator produces CSV with header", () => {
    const gen = new CsvReportGenerator();
    const result = gen.generate(orders);
    expect(result).toContain("id,userId,total,status");
    expect(result).toContain("ORD-1");
  });

  test("HtmlReportGenerator produces HTML table", () => {
    const gen = new HtmlReportGenerator();
    const result = gen.generate(orders);
    expect(result).toContain("<table>");
    expect(result).toContain("ORD-1");
  });

  test("ReportService routes to correct generator", () => {
    const svc = new ReportService(repo, [new JsonReportGenerator(), new CsvReportGenerator()]);
    expect(svc.generateReport("json")).toContain("ORD-1");
    expect(svc.generateReport("csv")).toContain("ORD-1");
  });

  test("ReportService throws for unknown format", () => {
    const svc = new ReportService(repo, [new JsonReportGenerator()]);
    expect(() => svc.generateReport("xml")).toThrow();
  });
});

// ─── Full Integration: OrderService ─────────────────────────────────────────

function buildOrderService(userOverrides = {}) {
  const logger = makeLogger();
  const user = makeUser(userOverrides);
  const orderRepo = new InMemoryOrderRepository();
  const userRepo = new InMemoryUserRepository([user]);
  const discountSvc = new DiscountService();
  const gateway = new PaymentGateway([
    new CreditCardProcessor(logger),
    new PayPalProcessor(logger),
    new CryptoProcessor(logger),
  ]);
  const notifSvc = new NotificationService([new EmailNotifier()]);
  return { svc: new OrderService(orderRepo, userRepo, discountSvc, gateway, notifSvc, logger), orderRepo, logger };
}

describe("OrderService — Integration (DIP + SRP)", () => {
  const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  afterAll(() => consoleSpy.mockRestore());

  test("places order and returns orderId", () => {
    const { svc } = buildOrderService();
    const id = svc.placeOrder("user-1", makeItems(), "credit_card");
    expect(id).toMatch(/^ORD-/);
  });

  test("applies premium discount correctly", () => {
    const { svc, orderRepo } = buildOrderService({ type: "premium" });
    const id = svc.placeOrder("user-1", [{ productId: "p1", name: "X", price: 100, quantity: 1 }], "credit_card");
    const order = orderRepo.findById(id);
    expect(order?.total).toBeCloseTo(90); // 10% off
  });

  test("throws for unknown user", () => {
    const { svc } = buildOrderService();
    expect(() => svc.placeOrder("ghost", makeItems(), "credit_card")).toThrow(/not found/);
  });

  test("throws for invalid order (empty items)", () => {
    const { svc } = buildOrderService();
    expect(() => svc.placeOrder("user-1", [], "credit_card")).toThrow(/Invalid order/);
  });

  test("throws for unsupported payment method", () => {
    const { svc } = buildOrderService();
    expect(() => svc.placeOrder("user-1", makeItems(), "wire_transfer")).toThrow(/processor/i);
  });

  test("logs order creation", () => {
    const { svc, logger } = buildOrderService();
    const id = svc.placeOrder("user-1", makeItems(), "paypal");
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining(id));
  });
});

// ─── SRP: ReturnService ──────────────────────────────────────────────────────

describe("ReturnService — SRP", () => {
  const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  afterAll(() => consoleSpy.mockRestore());

  test("marks order as returned", () => {
    const repo = new InMemoryOrderRepository();
    const logger = makeLogger();
    const order = { id: "ORD-X", userId: "u1", items: [], total: 50, status: "placed", createdAt: new Date() };
    repo.save(order);
    const svc = new ReturnService(repo, logger);
    svc.processReturn("ORD-X");
    expect(repo.findById("ORD-X")?.status).toBe("returned");
  });

  test("throws for unknown order", () => {
    const repo = new InMemoryOrderRepository();
    const svc = new ReturnService(repo, makeLogger());
    expect(() => svc.processReturn("GHOST")).toThrow(/not found/);
  });
});

// ─── LSP: GuestOrderService ──────────────────────────────────────────────────

describe("GuestOrderService — LSP + ISP", () => {
  const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  afterAll(() => consoleSpy.mockRestore());

  function buildGuestService() {
    const { svc } = buildOrderService({ type: "guest" });
    return new GuestOrderService(svc);
  }

  test("✅ LSP: allows PayPal for guest", () => {
    const guest = buildGuestService();
    const id = guest.placeOrder("user-1", makeItems(), "paypal");
    expect(id).toMatch(/^ORD-/);
  });

  test("✅ LSP: allows crypto for guest", () => {
    const guest = buildGuestService();
    const id = guest.placeOrder("user-1", makeItems(), "crypto");
    expect(id).toMatch(/^ORD-/);
  });

  test("✅ LSP: rejects credit_card for guest with clear message", () => {
    const guest = buildGuestService();
    // Не порушує контракт: помилка кидається ПЕРЕД викликом базового методу,
    // як явне бізнес-обмеження, а не непередбачена поведінка всередині потоку
    expect(() => guest.placeOrder("user-1", makeItems(), "credit_card")).toThrow(
      /not allowed for guest/
    );
  });

  test("✅ ISP: GuestOrderService does NOT have generateReport (not in its interface)", () => {
    const guest = buildGuestService();
    expect(guest.generateReport).toBeUndefined();
  });
});