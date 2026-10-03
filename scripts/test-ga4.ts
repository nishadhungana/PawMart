export {};

/**
 * Google Analytics 4 (GA4) Unit & Integration Test Suite
 * Tests all tracking events, deduplication, consent handling, and safety guards.
 */

// 1. Mock DOM and Web APIs in Node environment
const gtagCalls: Array<{ command: string; targetOrEvent: string; params?: any }> = [];

const mockLocalStorage: Record<string, string> = {};
const mockSessionStorage: Record<string, string> = {};

(global as any).window = {
  location: {
    pathname: '/marketplace',
    search: '',
    href: 'https://pawmart.test/marketplace',
  },
  dataLayer: [],
  gtag: (command: string, targetOrEvent: string, params?: any) => {
    gtagCalls.push({ command, targetOrEvent, params });
  },
  localStorage: {
    getItem: (key: string) => mockLocalStorage[key] || null,
    setItem: (key: string, val: string) => { mockLocalStorage[key] = val; },
    removeItem: (key: string) => { delete mockLocalStorage[key]; },
  },
  sessionStorage: {
    getItem: (key: string) => mockSessionStorage[key] || null,
    setItem: (key: string, val: string) => { mockSessionStorage[key] = val; },
    removeItem: (key: string) => { delete mockSessionStorage[key]; },
  },
};

(global as any).localStorage = (global as any).window.localStorage;
(global as any).sessionStorage = (global as any).window.sessionStorage;

// Set mock GA4 ID for testing
process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST998877';

async function runGa4Tests() {
  console.log('🧪 Starting Google Analytics 4 (GA4) Test Suite for PawMart Nepal...\n');

  const {
    trackGaPageView,
    trackGaViewItem,
    trackGaSearch,
    trackGaAddToCart,
    trackGaRemoveFromCart,
    trackGaBeginCheckout,
    trackGaPurchase,
    trackGaEvent,
    hasGaTrackingConsent,
    getGaMeasurementId,
    isGaLoaded,
  } = await import('../src/lib/gtag');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // Test 1: Configuration & Readiness
  console.log('--- 1. Configuration & Readiness ---');
  assert(getGaMeasurementId() === 'G-TEST998877', 'Measurement ID is correctly loaded from environment');
  assert(isGaLoaded() === true, 'isGaLoaded returns true when window.gtag is available');
  assert(hasGaTrackingConsent() === true, 'Default tracking consent is granted');

  // Test 2: PageView Tracking & Deduplication
  console.log('\n--- 2. page_view Tracking & Deduplication ---');
  gtagCalls.length = 0;
  trackGaPageView('/marketplace');
  assert(gtagCalls.length === 1 && gtagCalls[0].command === 'config', 'page_view config called for new route');
  assert(gtagCalls[0].params.page_path === '/marketplace', 'page_path matches target URL');

  // Trigger same route again -> should be deduplicated
  trackGaPageView('/marketplace');
  assert(gtagCalls.length === 1, 'Duplicate page_view on identical route is blocked');

  // Trigger different route -> should fire
  trackGaPageView('/marketplace/prod-cat-food-1');
  assert(gtagCalls.length === 2, 'page_view on new route fires successfully');

  // Test 3: view_item (Product Details)
  console.log('\n--- 3. view_item (Product Details) ---');
  gtagCalls.length = 0;
  trackGaViewItem({
    id: 'prod-cat-food-1',
    name: 'Royal Canin Mother & Babycat 2kg',
    price: 2850,
    category: 'Cat Food',
  });
  assert(gtagCalls.length === 1, 'view_item fired exactly once');
  assert(gtagCalls[0].targetOrEvent === 'view_item', 'Event name is view_item');
  assert(gtagCalls[0].params.currency === 'NPR', 'Currency is NPR');
  assert(gtagCalls[0].params.value === 2850, 'Value is 2850');
  assert(gtagCalls[0].params.items[0].item_id === 'prod-cat-food-1', 'Item ID is correct');
  assert(gtagCalls[0].params.items[0].item_category === 'Cat Food', 'Item category is correct');

  // Test 4: search
  console.log('\n--- 4. search Event ---');
  gtagCalls.length = 0;
  trackGaSearch('Royal Canin');
  assert(gtagCalls.length === 1, 'search event fired');
  assert(gtagCalls[0].targetOrEvent === 'search', 'Event name is search');
  assert(gtagCalls[0].params.search_term === 'Royal Canin', 'search_term is correct');

  // Test 5: add_to_cart
  console.log('\n--- 5. add_to_cart Event ---');
  gtagCalls.length = 0;
  trackGaAddToCart(
    {
      id: 'prod-shampoo-3',
      name: 'Anti-Tick & Flea Organic Dog Shampoo 500ml',
      price: 950,
      category: 'Grooming',
    },
    2
  );
  assert(gtagCalls.length === 1, 'add_to_cart event fired');
  assert(gtagCalls[0].targetOrEvent === 'add_to_cart', 'Event name is add_to_cart');
  assert(gtagCalls[0].params.value === 1900, 'Total value is 1900 (950 * 2)');
  assert(gtagCalls[0].params.items[0].quantity === 2, 'Quantity is 2');

  // Test 6: remove_from_cart
  console.log('\n--- 6. remove_from_cart Event ---');
  gtagCalls.length = 0;
  trackGaRemoveFromCart({
    id: 'prod-shampoo-3',
    name: 'Anti-Tick & Flea Organic Dog Shampoo 500ml',
    price: 950,
    quantity: 1,
  });
  assert(gtagCalls.length === 1, 'remove_from_cart event fired');
  assert(gtagCalls[0].targetOrEvent === 'remove_from_cart', 'Event name is remove_from_cart');
  assert(gtagCalls[0].params.value === 950, 'Removed value is 950');

  // Test 7: begin_checkout
  console.log('\n--- 7. begin_checkout Event ---');
  gtagCalls.length = 0;
  trackGaBeginCheckout(
    [
      { id: 'prod-cat-food-1', name: 'Royal Canin Babycat', price: 2850, quantity: 1 },
      { id: 'prod-shampoo-3', name: 'Anti-Tick Shampoo', price: 950, quantity: 1 },
    ],
    3900
  );
  assert(gtagCalls.length === 1, 'begin_checkout event fired');
  assert(gtagCalls[0].targetOrEvent === 'begin_checkout', 'Event name is begin_checkout');
  assert(gtagCalls[0].params.items.length === 2, 'items array contains both cart items');
  assert(gtagCalls[0].params.value === 3900, 'Checkout value is 3900');

  // Test 8: purchase & Deduplication
  console.log('\n--- 8. purchase Event & Deduplication ---');
  gtagCalls.length = 0;
  trackGaPurchase({
    id: 'ga_order_998811',
    total: 3900,
    items: [
      { productId: 'prod-cat-food-1', name: 'Royal Canin Babycat', priceAtPurchase: 2850, qty: 1 },
      { productId: 'prod-shampoo-3', name: 'Anti-Tick Shampoo', priceAtPurchase: 950, qty: 1 },
    ],
  });
  assert(gtagCalls.length === 1, 'purchase event fired for new verified order');
  assert(gtagCalls[0].targetOrEvent === 'purchase', 'Event name is purchase');
  assert(gtagCalls[0].params.transaction_id === 'ga_order_998811', 'transaction_id is correct');
  assert(gtagCalls[0].params.value === 3900, 'Order value is 3900');

  // Attempt duplicate purchase firing with same transaction ID
  trackGaPurchase({
    id: 'ga_order_998811',
    total: 3900,
    items: [],
  });
  assert(gtagCalls.length === 1, 'Duplicate purchase for existing transaction_id is strictly blocked');

  // A new distinct order ID should fire
  trackGaPurchase({
    id: 'ga_order_112233',
    total: 2850,
    items: [{ productId: 'prod-cat-food-1', priceAtPurchase: 2850, qty: 1 }],
  });
  assert(gtagCalls.length === 2, 'New distinct order fires purchase event successfully');

  // Test 9: Consent Revocation
  console.log('\n--- 9. Privacy & Consent Revocation ---');
  mockLocalStorage['pawmart_tracking_consent'] = 'denied';
  assert(hasGaTrackingConsent() === false, 'Consent recognized as denied');

  gtagCalls.length = 0;
  trackGaPageView('/checkout');
  trackGaViewItem({ id: 'x', name: 'test', price: 100 });
  trackGaAddToCart({ id: 'x', name: 'test', price: 100 }, 1);
  trackGaPurchase({ id: 'order_blocked', total: 100, items: [] });
  assert(gtagCalls.length === 0, 'No GA4 events sent when consent is revoked');

  // Restore consent
  mockLocalStorage['pawmart_tracking_consent'] = 'granted';
  assert(hasGaTrackingConsent() === true, 'Consent restored');

  console.log('\n=============================================');
  console.log(`📊 GA4 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('=============================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runGa4Tests().catch((err) => {
  console.error('GA4 Test execution error:', err);
  process.exit(1);
});
