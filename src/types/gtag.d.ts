export {};

declare global {
  interface Window {
    dataLayer: any[];
    gtag: {
      (command: 'config', targetId: string, config?: Record<string, any>): void;
      (command: 'set', config: Record<string, any>): void;
      (command: 'js', date: Date): void;
      (command: 'event', eventName: string, eventParams?: Record<string, any>): void;
      (command: 'consent', consentType: 'default' | 'update', consentArg: Record<string, any>): void;
      (...args: any[]): void;
    };
  }
}
