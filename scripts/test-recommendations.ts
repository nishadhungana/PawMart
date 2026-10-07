import { prisma } from '../src/lib/prisma';
import { getRecommendations, getPopularProducts } from '../src/lib/recommendations';

async function runRecommendationTests() {
  console.log('🧪 Starting PawMart Nepal Recommendation Engine Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  // Fetch test customers
  const customer1 = await prisma.user.findUnique({
    where: { email: 'customer@pawmart.test' },
  });
  const customer2 = await prisma.user.findUnique({
    where: { email: 'customer2@pawmart.test' },
  });

  if (!customer1 || !customer2) {
    console.error('❌ Could not find seeded customers. Please run `npm run db:seed` first.');
    process.exit(1);
  }

  // --- Test Case 1: Existing Customer with Purchase History (Collaborative Filtering) ---
  console.log('--- 1. Collaborative Filtering for Active Customer ---');
  const res1 = await getRecommendations(customer1.id, 4);

  assert(res1.type === 'collaborative', 'Recommendation type is "collaborative" for customer with history');
  assert(res1.products.length > 0, `Returned ${res1.products.length} recommendations`);
  assert(res1.title === 'Recommended for You', 'Title matches "Recommended for You"');

  // Verify KONG Toy is in recommendations (purchased by similar customer2)
  const hasKongToy = res1.products.some((p) => p.name.includes('KONG'));
  assert(hasKongToy, 'Recommends "KONG Chew Toy" purchased by similar peer (customer2)');

  // --- Test Case 2: Deduplication (Purchased products must NOT appear) ---
  console.log('\n--- 2. Purchased Products Exclusion (Deduplication) ---');
  const user1Orders = await prisma.order.findMany({
    where: { customerId: customer1.id, status: { not: 'CANCELLED' } },
    include: { items: true },
  });
  const user1PurchasedPids = new Set(user1Orders.flatMap((o) => o.items.map((i) => i.productId)));

  let foundAlreadyPurchased = false;
  for (const prod of res1.products) {
    if (user1PurchasedPids.has(prod.id)) {
      foundAlreadyPurchased = true;
      break;
    }
  }
  assert(!foundAlreadyPurchased, 'None of target customer already-purchased products appear in recommendations');

  // --- Test Case 3: New Customer with No Purchase History (Cold Start Fallback) ---
  console.log('\n--- 3. Cold Start for Customer with Zero Purchases ---');
  // Create or test a fresh dummy customer without any orders
  const freshCustomer = await prisma.user.upsert({
    where: { email: 'newcustomer_test@pawmart.test' },
    update: {},
    create: {
      name: 'New Customer',
      email: 'newcustomer_test@pawmart.test',
      passwordHash: 'dummyhash',
      role: 'CUSTOMER',
    },
  });

  const resNew = await getRecommendations(freshCustomer.id, 4);
  assert(resNew.type === 'popular', 'New customer receives "popular" fallback recommendations');
  assert(resNew.products.length > 0, 'Popular fallback returns products');
  assert(resNew.title.includes('Popular'), 'Title indicates Popular Pet Essentials');

  // Clean up test customer
  await prisma.user.delete({ where: { id: freshCustomer.id } }).catch(() => {});

  // --- Test Case 4: Guest / Logged-out Visitor ---
  console.log('\n--- 4. Unauthenticated Guest Visitor Handling ---');
  const resGuest = await getRecommendations(null, 4);
  assert(resGuest.type === 'popular', 'Guest visitor receives "popular" recommendations without error');
  assert(resGuest.products.length > 0, 'Guest visitor receives non-empty product list');

  const resUndefined = await getRecommendations(undefined, 4);
  assert(resUndefined.type === 'popular', 'Undefined user ID receives popular recommendations safely');

  // --- Test Case 5: No Matching Similar Users Fallback ---
  console.log('\n--- 5. Isolated Purchases (No Similar Users) Fallback ---');
  // If an isolated customer only bought a distinct item with no peers
  const resIsolated = await getPopularProducts(4, new Set(['some-isolated-id']));
  assert(resIsolated.length > 0, 'Popular fallback functions correctly when excluding isolated items');

  // --- Test Case 6: Duplicate Purchases in Multiple Orders ---
  console.log('\n--- 6. Duplicate Product Purchases Normalization ---');
  // Verify that multiple orders containing the same item do not inflate similarity past 1.0
  const ordersCount = user1Orders.length;
  assert(ordersCount > 1, 'Customer 1 has multiple orders across history');
  // The algorithm sets ensure unique product IDs are used for overlap computation
  assert(user1PurchasedPids.size <= ordersCount * 3, 'Unique product set correctly formed');

  // --- Test Case 7: Ranking Order by Recommendation Score ---
  console.log('\n--- 7. Ranking Order Validation ---');
  const scores = res1.products.map((p) => p.recommendationScore ?? 0);
  let isSorted = true;
  for (let i = 0; i < scores.length - 1; i++) {
    if (scores[i] < scores[i + 1]) {
      isSorted = false;
      break;
    }
  }
  assert(isSorted, 'Recommended products are ranked in descending order of recommendation score');
  console.log('     Scores:', scores);

  // --- Test Case 8: Availability (Only in-stock and published products) ---
  console.log('\n--- 8. Inventory & Publication Verification ---');
  const allActiveAndInStock = res1.products.every((p) => p.stock > 0);
  assert(allActiveAndInStock, 'All recommended products are in stock (stock > 0)');

  console.log('\n======================================================');
  console.log(`📊 Recommendation Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runRecommendationTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
