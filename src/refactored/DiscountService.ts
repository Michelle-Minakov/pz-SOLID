// ✅ OCP + DIP: Стратегії знижок — кожна має одну відповідальність (SRP)
// Нові знижки додаються через нові класи без редагування існуючих (OCP)

import { IDiscountStrategy, IDiscountService, User } from "../interfaces";

// ✅ SRP: кожен клас відповідає лише за свою знижку
export class StandardDiscountStrategy implements IDiscountStrategy {
  apply(total: number, _user: User): number {
    return total; // без знижки
  }
}

export class PremiumDiscountStrategy implements IDiscountStrategy {
  apply(total: number, _user: User): number {
    return total * 0.9; // -10%
  }
}

export class VipDiscountStrategy implements IDiscountStrategy {
  apply(total: number, _user: User): number {
    return total * 0.8; // -20%
  }
}

export class StudentDiscountStrategy implements IDiscountStrategy {
  apply(total: number, _user: User): number {
    return total * 0.85; // -15%
  }
}

// ✅ OCP + DIP: DiscountService залежить від абстракції IDiscountStrategy
// Щоб додати нову знижку — додаємо новий клас і реєструємо стратегію
export class DiscountService implements IDiscountService {
  // ✅ DIP: залежить від Map<string, IDiscountStrategy> — абстракцій
  private readonly strategies: Map<string, IDiscountStrategy>;

  constructor(strategies?: Map<string, IDiscountStrategy>) {
    this.strategies =
      strategies ??
      new Map<string, IDiscountStrategy>([
        ["standard", new StandardDiscountStrategy()],
        ["premium", new PremiumDiscountStrategy()],
        ["vip", new VipDiscountStrategy()],
        ["student", new StudentDiscountStrategy()],
        ["guest", new StandardDiscountStrategy()],
      ]);
  }

  calculate(total: number, user: User): number {
    const strategy = this.strategies.get(user.type) ?? new StandardDiscountStrategy();
    return strategy.apply(total, user);
  }
}