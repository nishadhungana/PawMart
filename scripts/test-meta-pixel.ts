/**
 * Meta Pixel Unit & Integration Test Suite
 * Tests all tracking events, deduplication, consent handling, and safety guards.
 */

// 1. Mock DOM and Web APIs in Node environment
const fbqEvents: Array<{ command: string; eventName: string; params?: any; options?: any }> = [];

const mockLocalStorage: Record<string, string> = {};
const mockSessionStorage: Record<string, string> = {};

(global as any).window = {
  location: {
    pathname: '/marketplace',
    search: '',
  },
  fbq: (command: string, eventName: string, params?: any, options?: any) => {
    fbqEvents.push({ command, eventName, params, options });
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

// Set mock Pixel ID for testing
process.env.NEXT_PUBLIC_META_PIXEL_ID = 'TEST_PIXEL_ID_987654321';

async function runTests() {
  console.log('🧪 Starting Meta Pixel Test Suite for PawMart Nepal...\n');

  const {
    trackPageView,
    trackViewContent,
    trackAddToCart,
    trackInitiateCheckout,
    trackPurchase,
    trackCustomEvent,
    hasTrackingConsent,
    setTrackingConsent,
    getPixelId,
    isPixelLoaded,
  } = await import('../src/lib/meta-pixel');

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

  // Test 1: Configuration
  console.log('--- 1. Configuration & Initial State ---');
  assert(getPixelId() === 'TEST_PIXEL_ID_987654321', 'Pixel ID is correctly loaded from environment');
  assert(isPixelLoaded() === true, 'isPixelLoaded returns true when window.fbq is available');
  assert(hasTrackingConsent() === true, 'Default tracking consent is granted');

  // Test 2: PageView & Deduplication
  console.log('\n--- 2. PageView Tracking & Deduplication ---');
  fbqEvents.length = 0;
  trackPageView('/marketplace');
  assert(fbqEvents.length === 1 && fbqEvents[0].eventName === 'PageView', 'PageView event fired successfully');

  // Trigger same URL again -> should be deduplicated
  trackPageView('/marketplace');
  assert(fbqEvents.length === 1, 'Duplicate PageView on identical route is blocked');

  // Trigger different URL -> should fire
  trackPageView('/marketplace/prod-123');
  assert(fbqEvents.length === 2, 'PageView on new route fires successfully');

  // Test 3: ViewContent
  console.log('\n--- 3. ViewContent (Product Details) ---');
  fbqEvents.length = 0;
  trackViewContent({
    content_ids: ['prod-cat-food-1'],
    content_name: 'Royal Canin Mother & Babycat 2kg',
    content_category: 'Cat Food',
    value: 2850,
    currency: 'NPR',
  });
  assert(fbqEvents.length === 1, 'ViewContent fired exactly once');
  assert(fbqEvents[0].eventName === 'ViewContent', 'Event name is ViewContent');
  assert(fbqEvents[0].params.content_ids[0] === 'prod-cat-food-1', 'Product ID is correct');
  assert(fbqEvents[0].params.value === 2850 && fbqEvents[0].params.currency === 'NPR', 'Price and NPR currency are correct');

  // Test 4: Custom Events (ProductImpression & ProductClick)
  console.log('\n--- 4. Product Impressions & Clicks (Custom Events) ---');
  fbqEvents.length = 0;
  trackCustomEvent('ProductImpression', {
    content_ids: ['prod-dog-leash-2'],
    content_name: 'Durable Padded Dog Harness & Leash',
    category: 'Dog Accessories',
    value: 1200,
    currency: 'NPR',
  });
  assert(fbqEvents.length === 1 && fbqEvents[0].command === 'trackCustom', 'ProductImpression fired via trackCustom');
  assert(fbqEvents[0].eventName === 'ProductImpression', 'Custom event name is ProductImpression');

  trackCustomEvent('ProductClick', {
    content_ids: ['prod-dog-leash-2'],
    content_name: 'Durable Padded Dog Harness & Leash',
    value: 1200,
    currency: 'NPR',
  });
  assert(fbqEvents.length === 2 && fbqEvents[1].eventName === 'ProductClick', 'ProductClick fired via trackCustom');

  // Test 5: AddToCart
  console.log('\n--- 5. AddToCart Tracking ---');
  fbqEvents.length = 0;
  trackAddToCart({
    content_ids: ['prod-shampoo-3'],
    content_name: 'Anti-Tick & Flea Organic Dog Shampoo 500ml',
    value: 950,
    currency: 'NPR',
    num_items: 1,
  });
  assert(fbqEvents.length === 1 && fbqEvents[0].eventName === 'AddToCart', 'AddToCart event fired successfully');
  assert(fbqEvents[0].params.value === 950 && fbqEvents[0].params.num_items === 1, 'AddToCart payload has valid quantity and value');

  // Test 6: InitiateCheckout
  console.log('\n--- 6. InitiateCheckout Tracking ---');
  fbqEvents.length = 0;
  trackInitiateCheckout({
    content_ids: ['prod-cat-food-1', 'prod-shampoo-3'],
    num_items: 2,
    value: 3900,
    currency: 'NPR',
  });
  assert(fbqEvents.length === 1 && fbqEvents[0].eventName === 'InitiateCheckout', 'InitiateCheckout event fired successfully');
  assert(fbqEvents[0].params.content_ids.length === 2 && fbqEvents[0].params.value === 3900, 'InitiateCheckout payload has all cart items and total');

  // Test 7: Purchase Tracking & Order Deduplication
  console.log('\n--- 7. Purchase Tracking & Deduplication ---');
  fbqEvents.length = 0;
  trackPurchase({
    order_id: 'order_test_998877',
    content_ids: ['prod-cat-food-1', 'prod-shampoo-3'],
    num_items: 2,
    value: 3900,
    currency: 'NPR',
  });
  assert(fbqEvents.length === 1 && fbqEvents[0].eventName === 'Purchase', 'Purchase event fired for new verified order');
  assert(fbqEvents[0].options?.eventID === 'order_test_998877', 'Meta server-side deduplication eventID is set to order_id');

  // Attempt duplicate purchase firing with same order ID (e.g. user reloads confirmation page)
  trackPurchase({
    order_id: 'order_test_998877',
    content_ids: ['prod-cat-food-1', 'prod-shampoo-3'],
    num_items: 2,
    value: 3900,
    currency: 'NPR',
  });
  assert(fbqEvents.length === 1, 'Duplicate Purchase for existing order ID is strictly prevented');

  // A new distinct order ID should fire
  trackPurchase({
    order_id: 'order_test_112233',
    content_ids: ['prod-cat-food-1'],
    num_items: 1,
    value: 2850,
    currency: 'NPR',
  });
  assert(fbqEvents.length === 2, 'New distinct order fires Purchase event successfully');

  // Test 8: Privacy & Consent Enforcement
  console.log('\n--- 8. Privacy & Consent Enforcement ---');
  fbqEvents.length = 0;
  setTrackingConsent(false);
  assert(hasTrackingConsent() === false, 'Tracking consent revoked');
  assert(fbqEvents.length === 1 && fbqEvents[0].command === 'consent' && fbqEvents[0].eventName === 'revoke', 'fbq consent revoke called');

  // Verify subsequent tracking calls are blocked
  fbqEvents.length = 0;
  trackPageView('/vets');
  trackViewContent({ content_ids: ['x'], content_name: 'test', value: 100, currency: 'NPR' });
  trackAddToCart({ content_ids: ['x'], content_name: 'test', value: 100, currency: 'NPR', num_items: 1 });
  trackPurchase({ order_id: 'order_blocked', content_ids: ['x'], num_items: 1, value: 100, currency: 'NPR' });
  assert(fbqEvents.length === 0, 'No tracking events sent when consent is revoked');

  // Re-grant consent
  fbqEvents.length = 0;
  setTrackingConsent(true);
  assert(hasTrackingConsent() === true, 'Tracking consent re-granted');
  assert(fbqEvents.length === 1 && fbqEvents[0].command === 'consent' && fbqEvents[0].eventName === 'grant', 'fbq consent grant called');

  console.log('\n=============================================');
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('=============================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
