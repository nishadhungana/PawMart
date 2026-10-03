/**
 * Meta Pixel (Facebook Pixel) Centralized Tracking Service
 * PawMart Nepal Pet Supplies & Vet Marketplace
 *
 * Privacy & Compliance:
 * - NO customer PII (names, emails, phones, passwords, card details) is sent in event payloads.
 * - Respects cookie/tracking consent before sending events.
 * - Deduplicates Purchase events using order IDs and sessionStorage.
 * - Error-safe: Tracking failures will never break cart, checkout, or UI workflows.
 */

export interface ViewContentParams {
  content_ids: string[];
  content_name: string;
  content_category?: string;
  content_type?: string;
  value?: number;
  currency?: string;
}

export interface AddToCartParams {
  content_ids: string[];
  content_name: string;
  content_type?: string;
  value: number;
  currency: string;
  num_items: number;
}

export interface InitiateCheckoutParams {
  content_ids: string[];
  num_items: number;
  value: number;
  currency: string;
}

export interface PurchaseParams {
  order_id: string;
  content_ids: string[];
  content_type?: string;
  num_items: number;
  value: number;
  currency: string;
}

// In-memory caches for deduplication
let lastTrackedUrl: string | null = null;
const memoryTrackedPurchases = new Set<string>();

/**
 * Get configured Meta Pixel ID from environment variable
 */
export function getPixelId(): string {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID || '';
}

/**
 * Check if tracking consent has been granted (defaults to true unless explicitly opted-out)
 */
export function hasTrackingConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const consent = localStorage.getItem('pawmart_tracking_consent');
    return consent !== 'denied';
  } catch {
    return true;
  }
}

/**
 * Set tracking consent preference
 */
export function setTrackingConsent(granted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('pawmart_tracking_consent', granted ? 'granted' : 'denied');
    if (typeof window.fbq === 'function') {
      window.fbq('consent', granted ? 'grant' : 'revoke');
    }
  } catch (err) {
    console.error('[Meta Pixel] Failed to update consent storage:', err);
  }
}

/**
 * Check if the Meta Pixel library is ready on the client
 */
export function isPixelLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.fbq === 'function';
}

/**
 * Internal logger for development environment
 */
function logDebug(eventName: string, data?: any, deduplicated = false) {
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    const pixelId = getPixelId();
    const idBadge = pixelId ? `ID: ${pixelId}` : 'ID: [Not Set - Dev Preview]';
    const tagStyle = 'background: #1877F2; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-weight: bold;';
    const subStyle = 'color: #0f5132; font-weight: bold;';

    if (deduplicated) {
      console.log(`%c[Meta Pixel]%c Event '${eventName}' skipped (Deduplicated)`, tagStyle, 'color: #b02a37; font-weight: bold;');
    } else {
      console.log(`%c[Meta Pixel]%c ${eventName} (${idBadge})`, tagStyle, subStyle, data || '');
    }
  }
}

/**
 * Track PageView event on initial load and client-side route transitions.
 * Deduplicates consecutive firings on the same URL.
 */
export function trackPageView(url?: string): void {
  if (typeof window === 'undefined') return;

  const currentUrl = url || window.location.pathname + window.location.search;
  if (lastTrackedUrl === currentUrl) {
    logDebug('PageView', { url: currentUrl }, true);
    return;
  }

  lastTrackedUrl = currentUrl;
  logDebug('PageView', { url: currentUrl });

  if (!hasTrackingConsent()) return;

  try {
    if (isPixelLoaded()) {
      window.fbq('track', 'PageView');
    }
  } catch (error) {
    console.warn('[Meta Pixel] Error firing PageView:', error);
  }
}

/**
 * Track ViewContent when a user views a single product's detail page.
 */
export function trackViewContent(params: ViewContentParams): void {
  if (typeof window === 'undefined') return;

  const payload = {
    content_ids: params.content_ids,
    content_name: params.content_name,
    content_category: params.content_category || 'Pet Supplies',
    content_type: params.content_type || 'product',
    value: params.value ?? 0,
    currency: params.currency || 'NPR',
  };

  logDebug('ViewContent', payload);

  if (!hasTrackingConsent()) return;

  try {
    if (isPixelLoaded()) {
      window.fbq('track', 'ViewContent', payload);
    }
  } catch (error) {
    console.warn('[Meta Pixel] Error firing ViewContent:', error);
  }
}

/**
 * Track AddToCart when a product is successfully added to the cart.
 */
export function trackAddToCart(params: AddToCartParams): void {
  if (typeof window === 'undefined') return;

  const payload = {
    content_ids: params.content_ids,
    content_name: params.content_name,
    content_type: params.content_type || 'product',
    value: params.value,
    currency: params.currency || 'NPR',
    num_items: params.num_items,
  };

  logDebug('AddToCart', payload);

  if (!hasTrackingConsent()) return;

  try {
    if (isPixelLoaded()) {
      window.fbq('track', 'AddToCart', payload);
    }
  } catch (error) {
    console.warn('[Meta Pixel] Error firing AddToCart:', error);
  }
}

/**
 * Track InitiateCheckout when a user navigates to the checkout page.
 */
export function trackInitiateCheckout(params: InitiateCheckoutParams): void {
  if (typeof window === 'undefined') return;

  const payload = {
    content_ids: params.content_ids,
    content_type: 'product',
    num_items: params.num_items,
    value: params.value,
    currency: params.currency || 'NPR',
  };

  logDebug('InitiateCheckout', payload);

  if (!hasTrackingConsent()) return;

  try {
    if (isPixelLoaded()) {
      window.fbq('track', 'InitiateCheckout', payload);
    }
  } catch (error) {
    console.warn('[Meta Pixel] Error firing InitiateCheckout:', error);
  }
}

/**
 * Track Purchase when an order is successfully verified and created by the backend.
 * Uses order_id deduplication via memory & sessionStorage to prevent double-counting.
 */
export function trackPurchase(params: PurchaseParams): void {
  if (typeof window === 'undefined') return;

  const { order_id } = params;

  // Check in-memory deduplication
  if (memoryTrackedPurchases.has(order_id)) {
    logDebug('Purchase', { order_id }, true);
    return;
  }

  // Check sessionStorage deduplication
  try {
    const rawStored = sessionStorage.getItem('pawmart_tracked_purchases');
    const storedList: string[] = rawStored ? JSON.parse(rawStored) : [];
    if (storedList.includes(order_id)) {
      logDebug('Purchase', { order_id }, true);
      return;
    }

    storedList.push(order_id);
    sessionStorage.setItem('pawmart_tracked_purchases', JSON.stringify(storedList));
  } catch {
    // SessionStorage unavailable fallback
  }

  memoryTrackedPurchases.add(order_id);

  const payload = {
    content_ids: params.content_ids,
    content_type: params.content_type || 'product',
    num_items: params.num_items,
    value: params.value,
    currency: params.currency || 'NPR',
    order_id: params.order_id,
  };

  logDebug('Purchase', payload);

  if (!hasTrackingConsent()) return;

  try {
    if (isPixelLoaded()) {
      window.fbq('track', 'Purchase', payload, { eventID: order_id });
    }
  } catch (error) {
    console.warn('[Meta Pixel] Error firing Purchase:', error);
  }
}

/**
 * Track custom events (e.g. ProductImpression, ProductClick)
 */
export function trackCustomEvent(eventName: string, data?: Record<string, any>): void {
  if (typeof window === 'undefined') return;

  logDebug(`Custom: ${eventName}`, data);

  if (!hasTrackingConsent()) return;

  try {
    if (isPixelLoaded()) {
      window.fbq('trackCustom', eventName, data);
    }
  } catch (error) {
    console.warn(`[Meta Pixel] Error firing custom event '${eventName}':`, error);
  }
}
