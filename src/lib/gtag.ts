/**
 * Google Analytics 4 (GA4) Centralized Tracking Service
 * PawMart Nepal Pet Supplies & Vet Marketplace
 *
 * Privacy & Compliance:
 * - NO customer PII (names, emails, phones, passwords, card numbers) is sent in event payloads.
 * - Respects cookie/tracking consent before sending events.
 * - Deduplicates Purchase events using transaction/order IDs.
 * - Error-safe: Tracking failures will never break cart, checkout, or UI workflows.
 */

export interface GaProductItem {
  item_id: string;
  item_name: string;
  price?: number;
  item_category?: string;
  quantity?: number;
}

export interface GaPurchaseOrder {
  id: string;
  total: number;
  items: Array<{
    productId: string;
    name?: string;
    priceAtPurchase?: number;
    price?: number;
    qty?: number;
    quantity?: number;
    category?: string;
  }>;
}

// In-memory caches for deduplication
let lastTrackedGaUrl: string | null = null;
const memoryTrackedGaPurchases = new Set<string>();

/**
 * Get configured Google Analytics 4 Measurement ID from environment variable
 */
export function getGaMeasurementId(): string {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-42RWPYWGLR';
}

/**
 * Check if tracking consent has been granted (defaults to true unless explicitly opted-out)
 */
export function hasGaTrackingConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const consent = localStorage.getItem('pawmart_tracking_consent');
    return consent !== 'denied';
  } catch {
    return true;
  }
}

/**
 * Check if Google Analytics (gtag.js) is ready on the client
 */
export function isGaLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

/**
 * Internal logger for development environment
 */
function logGaDebug(eventName: string, data?: any, deduplicated = false) {
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    const measurementId = getGaMeasurementId();
    const idBadge = measurementId ? `ID: ${measurementId}` : 'ID: [Not Set - Dev Preview]';
    const tagStyle = 'background: #EA4335; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-weight: bold;';
    const subStyle = 'color: #1a73e8; font-weight: bold;';

    if (deduplicated) {
      console.log(`%c[GA4]%c Event '${eventName}' skipped (Deduplicated)`, tagStyle, 'color: #b02a37; font-weight: bold;');
    } else {
      console.log(`%c[GA4]%c ${eventName} (${idBadge})`, tagStyle, subStyle, data || '');
    }
  }
}

/**
 * Track page_view on initial load and client-side route transitions.
 * Deduplicates consecutive firings on the same URL.
 */
export function trackGaPageView(url?: string): void {
  if (typeof window === 'undefined') return;

  const currentUrl = url || window.location.pathname + window.location.search;
  if (lastTrackedGaUrl === currentUrl) {
    logGaDebug('page_view', { url: currentUrl }, true);
    return;
  }

  lastTrackedGaUrl = currentUrl;
  logGaDebug('page_view', { page_path: currentUrl });

  if (!hasGaTrackingConsent()) return;

  try {
    if (isGaLoaded()) {
      const gaId = getGaMeasurementId();
      if (gaId) {
        window.gtag('config', gaId, {
          page_path: currentUrl,
          page_location: window.location.href,
        });
      } else {
        window.gtag('event', 'page_view', {
          page_path: currentUrl,
          page_location: window.location.href,
        });
      }
    }
  } catch (error) {
    console.warn('[GA4] Error firing page_view:', error);
  }
}

/**
 * Generic event tracker for custom or standard GA4 events
 */
export function trackGaEvent(eventName: string, params?: Record<string, any>): void {
  if (typeof window === 'undefined') return;

  logGaDebug(eventName, params);

  if (!hasGaTrackingConsent()) return;

  try {
    if (isGaLoaded()) {
      window.gtag('event', eventName, params);
    }
  } catch (error) {
    console.warn(`[GA4] Error firing event '${eventName}':`, error);
  }
}

/**
 * Track view_item when a user views a single product's detail page
 */
export function trackGaViewItem(product: {
  id: string;
  name: string;
  price: number;
  category?: string;
}): void {
  if (typeof window === 'undefined') return;

  const payload = {
    currency: 'NPR',
    value: product.price,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        item_category: product.category || 'Pet Supplies',
        quantity: 1,
      },
    ],
  };

  logGaDebug('view_item', payload);

  if (!hasGaTrackingConsent()) return;

  try {
    if (isGaLoaded()) {
      window.gtag('event', 'view_item', payload);
    }
  } catch (error) {
    console.warn('[GA4] Error firing view_item:', error);
  }
}

/**
 * Track search event when a user searches for products
 */
export function trackGaSearch(searchTerm: string): void {
  if (typeof window === 'undefined' || !searchTerm.trim()) return;

  const payload = {
    search_term: searchTerm.trim(),
  };

  logGaDebug('search', payload);

  if (!hasGaTrackingConsent()) return;

  try {
    if (isGaLoaded()) {
      window.gtag('event', 'search', payload);
    }
  } catch (error) {
    console.warn('[GA4] Error firing search:', error);
  }
}

/**
 * Track add_to_cart when a product is added to the shopping cart
 */
export function trackGaAddToCart(
  item: { id: string; name: string; price: number; category?: string },
  quantity: number = 1
): void {
  if (typeof window === 'undefined' || quantity <= 0) return;

  const payload = {
    currency: 'NPR',
    value: item.price * quantity,
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        item_category: item.category || 'Pet Supplies',
        quantity,
      },
    ],
  };

  logGaDebug('add_to_cart', payload);

  if (!hasGaTrackingConsent()) return;

  try {
    if (isGaLoaded()) {
      window.gtag('event', 'add_to_cart', payload);
    }
  } catch (error) {
    console.warn('[GA4] Error firing add_to_cart:', error);
  }
}

/**
 * Track remove_from_cart when an item is removed from the cart
 */
export function trackGaRemoveFromCart(
  item: { id: string; name: string; price: number; category?: string; quantity?: number }
): void {
  if (typeof window === 'undefined') return;

  const quantity = item.quantity || 1;
  const payload = {
    currency: 'NPR',
    value: item.price * quantity,
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        item_category: item.category || 'Pet Supplies',
        quantity,
      },
    ],
  };

  logGaDebug('remove_from_cart', payload);

  if (!hasGaTrackingConsent()) return;

  try {
    if (isGaLoaded()) {
      window.gtag('event', 'remove_from_cart', payload);
    }
  } catch (error) {
    console.warn('[GA4] Error firing remove_from_cart:', error);
  }
}

/**
 * Track begin_checkout when a user starts checkout
 */
export function trackGaBeginCheckout(
  cartItems: Array<{ id: string; name: string; price: number; quantity: number; category?: string }>,
  totalValue: number
): void {
  if (typeof window === 'undefined' || cartItems.length === 0) return;

  const payload = {
    currency: 'NPR',
    value: totalValue,
    items: cartItems.map((i) => ({
      item_id: i.id,
      item_name: i.name,
      price: i.price,
      item_category: i.category || 'Pet Supplies',
      quantity: i.quantity,
    })),
  };

  logGaDebug('begin_checkout', payload);

  if (!hasGaTrackingConsent()) return;

  try {
    if (isGaLoaded()) {
      window.gtag('event', 'begin_checkout', payload);
    }
  } catch (error) {
    console.warn('[GA4] Error firing begin_checkout:', error);
  }
}

/**
 * Track purchase event upon verified order creation
 * Deduplicates using transaction/order ID in memory & sessionStorage
 */
export function trackGaPurchase(order: GaPurchaseOrder): void {
  if (typeof window === 'undefined' || !order.id) return;

  const orderId = order.id;

  // Check in-memory deduplication
  if (memoryTrackedGaPurchases.has(orderId)) {
    logGaDebug('purchase', { order_id: orderId }, true);
    return;
  }

  // Check sessionStorage deduplication
  try {
    const rawStored = sessionStorage.getItem('pawmart_ga_tracked_purchases');
    const storedList: string[] = rawStored ? JSON.parse(rawStored) : [];
    if (storedList.includes(orderId)) {
      logGaDebug('purchase', { order_id: orderId }, true);
      return;
    }

    storedList.push(orderId);
    sessionStorage.setItem('pawmart_ga_tracked_purchases', JSON.stringify(storedList));
  } catch {
    // SessionStorage fallback
  }

  memoryTrackedGaPurchases.add(orderId);

  const payload = {
    transaction_id: orderId,
    currency: 'NPR',
    value: order.total,
    items: order.items.map((i) => ({
      item_id: i.productId,
      item_name: i.name || i.productId,
      price: i.priceAtPurchase ?? i.price ?? 0,
      item_category: i.category || 'Pet Supplies',
      quantity: i.qty ?? i.quantity ?? 1,
    })),
  };

  logGaDebug('purchase', payload);

  if (!hasGaTrackingConsent()) return;

  try {
    if (isGaLoaded()) {
      window.gtag('event', 'purchase', payload);
    }
  } catch (error) {
    console.warn('[GA4] Error firing purchase:', error);
  }
}
