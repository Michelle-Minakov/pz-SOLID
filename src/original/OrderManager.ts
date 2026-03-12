// ❌ ANTI-SOLID CODE — навмисні порушення всіх SOLID принципів
// Цей файл містить один "Бог-клас" який робить усе

export class OrderManager {
  private orders: any[] = [];

  // ❌ SRP: клас відповідає за замовлення, знижки, нотифікації, оплату, звіти
  // ❌ OCP: додавання нового типу знижки потребує редагування цього класу
  // ❌ DIP: залежить від конкретних реалізацій, а не абстракцій

  placeOrder(userId: string, items: any[], paymentType: string): string {
    // Валідація
    if (!userId || items.length === 0) {
      throw new Error("Invalid order");
    }

    // Розрахунок ціни
    let total = 0;
    for (const item of items) {
      total += item.price * item.quantity;
    }

    // ❌ OCP: щоб додати новий тип знижки треба редагувати цей метод
    // Застосування знижки
    const user = this.getUserFromDB(userId);
    if (user.type === "premium") {
      total = total * 0.9; // 10% знижка
    } else if (user.type === "vip") {
      total = total * 0.8; // 20% знижка
    } else if (user.type === "student") {
      total = total * 0.85; // 15% знижка
    }

    // ❌ OCP + DIP: хардкод методу оплати
    let paymentSuccess = false;
    if (paymentType === "credit_card") {
      console.log(`Charging credit card for user ${userId}, amount: ${total}`);
      paymentSuccess = true;
    } else if (paymentType === "paypal") {
      console.log(`Processing PayPal payment for user ${userId}, amount: ${total}`);
      paymentSuccess = true;
    } else if (paymentType === "crypto") {
      console.log(`Processing crypto payment for user ${userId}, amount: ${total}`);
      paymentSuccess = true;
    }

    if (!paymentSuccess) throw new Error("Payment failed");

    const orderId = `ORD-${Date.now()}`;
    const order = { id: orderId, userId, items, total, status: "placed" };
    this.orders.push(order);

    // ❌ SRP: нотифікація — не відповідальність OrderManager
    // ❌ OCP: хардкод каналів нотифікацій
    // ❌ DIP: пряма залежність від конкретних сервісів нотифікацій
    if (user.notificationPreference === "email") {
      console.log(`Sending email to ${user.email}: Your order ${orderId} placed!`);
    } else if (user.notificationPreference === "sms") {
      console.log(`Sending SMS to ${user.phone}: Your order ${orderId} placed!`);
    } else if (user.notificationPreference === "push") {
      console.log(`Sending push notification to ${user.deviceId}: Order ${orderId} placed!`);
    }

    // ❌ SRP: логування — не відповідальність OrderManager
    console.log(`[LOG] Order ${orderId} created for user ${userId} at ${new Date().toISOString()}`);

    return orderId;
  }

  // ❌ SRP: генерація звітів — не відповідальність OrderManager
  generateReport(format: string): string {
    if (format === "json") {
      return JSON.stringify(this.orders);
    } else if (format === "csv") {
      let csv = "id,userId,total,status\n";
      for (const order of this.orders) {
        csv += `${order.id},${order.userId},${order.total},${order.status}\n`;
      }
      return csv;
    } else if (format === "html") {
      let html = "<table><tr><th>ID</th><th>User</th><th>Total</th><th>Status</th></tr>";
      for (const order of this.orders) {
        html += `<tr><td>${order.id}</td><td>${order.userId}</td><td>${order.total}</td><td>${order.status}</td></tr>`;
      }
      html += "</table>";
      return html;
    }
    return "";
  }

  // ❌ SRP + ISP: метод обробки повернення теж живе тут
  processReturn(orderId: string): void {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error("Order not found");
    order.status = "returned";
    console.log(`[LOG] Order ${orderId} returned at ${new Date().toISOString()}`);
    // Повернення оплати теж тут
    console.log(`Refunding ${order.total} for order ${orderId}`);
  }

  // ❌ LSP порушення — підклас нижче порушує контракт
  private getUserFromDB(userId: string): any {
    // Симуляція запиту до БД
    return {
      id: userId,
      type: "premium",
      email: `${userId}@example.com`,
      phone: "+380991234567",
      deviceId: "device-123",
      notificationPreference: "email",
    };
  }
}

// ❌ LSP: GuestOrderManager порушує контракт базового класу
// Він кидає помилку там де батько повертав результат
export class GuestOrderManager extends OrderManager {
  placeOrder(userId: string, items: any[], paymentType: string): string {
    if (paymentType === "credit_card") {
      throw new Error("Guests cannot use credit cards"); // ❌ LSP порушення
    }
    return super.placeOrder(userId, items, paymentType);
  }

  // ❌ ISP: метод generateReport нав'язаний нащадку але він не потрібен гостю
  generateReport(format: string): string {
    throw new Error("Guests cannot generate reports"); // ❌ LSP + ISP порушення
  }
}