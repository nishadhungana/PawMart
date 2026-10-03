export {};

declare global {
  interface Window {
    fbq: {
      (command: 'init', pixelId: string, options?: Record<string, any>): void;
      (command: 'track', eventName: string, parameters?: Record<string, any>, options?: { eventID?: string }): void;
      (command: 'trackCustom', eventName: string, parameters?: Record<string, any>, options?: { eventID?: string }): void;
      (command: 'trackSingle', pixelId: string, eventName: string, parameters?: Record<string, any>): void;
      (command: 'trackSingleCustom', pixelId: string, eventName: string, parameters?: Record<string, any>): void;
      (command: 'consent', action: 'grant' | 'revoke'): void;
      callMethod?: (...args: any[]) => void;
      queue?: any[];
      push?: (...args: any[]) => void;
      loaded?: boolean;
      version?: string;
    };
    _fbq?: any;
  }
}
