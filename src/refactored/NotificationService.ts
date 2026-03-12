// ✅ SRP + OCP + DIP: Сповіщувачі

import { INotifier, INotificationService, User } from "../interfaces";

// ✅ SRP: кожен клас відповідає лише за свій канал нотифікацій
export class EmailNotifier implements INotifier {
  readonly channel = "email";

  notify(user: User, message: string): void {
    console.log(`[EMAIL] → ${user.email}: ${message}`);
  }
}

export class SmsNotifier implements INotifier {
  readonly channel = "sms";

  notify(user: User, message: string): void {
    if (!user.phone) throw new Error(`User ${user.id} has no phone number`);
    console.log(`[SMS] → ${user.phone}: ${message}`);
  }
}

export class PushNotifier implements INotifier {
  readonly channel = "push";

  notify(user: User, message: string): void {
    if (!user.deviceId) throw new Error(`User ${user.id} has no device ID`);
    console.log(`[PUSH] → device:${user.deviceId}: ${message}`);
  }
}

// ✅ OCP + DIP: NotificationService агрегує нотифікатори через абстракцію
export class NotificationService implements INotificationService {
  private readonly notifiers: Map<string, INotifier>;

  constructor(notifiers: INotifier[]) {
    this.notifiers = new Map(notifiers.map((n) => [n.channel, n]));
  }

  send(user: User, message: string): void {
    const notifier = this.notifiers.get(user.notificationPreference);
    if (!notifier) {
      console.warn(`No notifier for channel: ${user.notificationPreference}`);
      return;
    }
    notifier.notify(user, message);
  }
}