// ✅ OCP + DIP + SRP: Процесори оплати

import { IPaymentProcessor, ILogger } from "../interfaces";

// ✅ SRP: кожен клас відповідає лише за свій метод оплати
export class CreditCardProcessor implements IPaymentProcessor {
  readonly type = "credit_card";

  constructor(private readonly logger: ILogger) {}

  process(userId: string, amount: number): boolean {
    this.logger.log(`Charging credit card for user ${userId}, amount: ${amount}`);
    return true;
  }
}

export class PayPalProcessor implements IPaymentProcessor {
  readonly type = "paypal";

  constructor(private readonly logger: ILogger) {}

  process(userId: string, amount: number): boolean {
    this.logger.log(`Processing PayPal payment for user ${userId}, amount: ${amount}`);
    return true;
  }
}

export class CryptoProcessor implements IPaymentProcessor {
  readonly type = "crypto";

  constructor(private readonly logger: ILogger) {}

  process(userId: string, amount: number): boolean {
    this.logger.log(`Processing crypto payment for user ${userId}, amount: ${amount}`);
    return true;
  }
}

// ✅ OCP: PaymentGateway — реєстр процесорів, не потребує редагування при додаванні нових
export class PaymentGateway {
  private readonly processors: Map<string, IPaymentProcessor>;

  constructor(processors: IPaymentProcessor[]) {
    this.processors = new Map(processors.map((p) => [p.type, p]));
  }

  process(type: string, userId: string, amount: number): boolean {
    const processor = this.processors.get(type);
    if (!processor) throw new Error(`Payment processor "${type}" not found`);
    return processor.process(userId, amount);
  }

  hasProcessor(type: string): boolean {
    return this.processors.has(type);
  }
}