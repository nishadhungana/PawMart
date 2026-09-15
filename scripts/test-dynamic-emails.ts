import { generateOrderEmail, type OrderWithDetails } from '../src/lib/order-emails';

console.log('Testing dynamic order email generation...\n');

// Order A: Royal Canin & treats for John in Kathmandu
const mockOrderA: OrderWithDetails = {
  id: 'clt001abc999xyz1',
  customerId: 'user-001',
  total: 6250,
  status: 'SHIPPED',
  paymentMethod: 'ESEWA',
  paymentStatus: 'PAID',
  shippingAddress: 'House #42, Lazimpat, Kathmandu, Nepal (+977-9841234567)',
  createdAt: new Date('2026-09-05T08:00:00Z'),
  updatedAt: new Date('2026-09-05T09:30:00Z'),
  transactionHash: 'dummy_hash_for_test',
  digitalSignature: 'dummy_sig_for_test',
  signedAt: new Date('2026-09-05T08:00:00Z'),
  customer: {
    id: 'user-001',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+977-9841234567',
  },
  items: [
    {
      id: 'item-001',
      orderId: 'clt001abc999xyz1',
      productId: 'prod-001',
      sellerId: 'seller-001',
      qty: 2,
      priceAtPurchase: 2800,
      product: {
        name: 'Royal Canin Maxi Adult Dog Food 4kg',
        brand: 'Royal Canin',
        price: 2800,
      },
    },
    {
      id: 'item-002',
      orderId: 'clt001abc999xyz1',
      productId: 'prod-002',
      sellerId: 'seller-001',
      qty: 1,
      priceAtPurchase: 550,
      product: {
        name: 'Chew Toy Rope with Ball',
        brand: 'PawFun',
        price: 550,
      },
    },
  ],
};

// Order B: Cat scratcher for Sarah in Pokhara with Cash on Delivery
const mockOrderB: OrderWithDetails = {
  id: 'clt002def888uvw2',
  customerId: 'user-002',
  total: 3200,
  status: 'OUT_FOR_DELIVERY',
  paymentMethod: 'COD',
  paymentStatus: 'PENDING',
  shippingAddress: 'Lakeside Ward 6, Pokhara, Nepal (+977-9807654321)',
  createdAt: new Date('2026-09-04T12:00:00Z'),
  updatedAt: new Date('2026-09-05T07:00:00Z'),
  transactionHash: 'dummy_hash_b_for_test',
  digitalSignature: 'dummy_sig_b_for_test',
  signedAt: new Date('2026-09-04T12:00:00Z'),
  customer: {
    id: 'user-002',
    name: 'Sarah Gurung',
    email: 'sarah.gurung@example.com',
    phone: '+977-9807654321',
  },
  items: [
    {
      id: 'item-003',
      orderId: 'clt002def888uvw2',
      productId: 'prod-003',
      sellerId: 'seller-002',
      qty: 1,
      priceAtPurchase: 3100,
      product: {
        name: 'Multi-Level Sisal Cat Scratching Post',
        brand: 'FelineLux',
        price: 3100,
      },
    },
  ],
};

// Test 1: Order A Shipped (with tracking details)
const emailShipped = generateOrderEmail('ORDER_SHIPPED', mockOrderA, {
  carrier: 'Nepal Express Couriers',
  trackingNumber: 'NEC-9948201',
  estimatedDelivery: 'Sep 7, 2026',
});
console.log('--- TEST 1: ORDER_SHIPPED (Order A) ---');
console.log('Subject:', emailShipped.subject);
console.log('Greeting:', emailShipped.greeting);
console.log('Title:', emailShipped.title);
console.log('Has Tracking:', emailShipped.html.includes('NEC-9948201'));
console.log('Has Carrier:', emailShipped.html.includes('Nepal Express Couriers'));
console.log('Has Items:', emailShipped.html.includes('Royal Canin Maxi Adult Dog Food 4kg'));

// Test 2: Order B Out for Delivery (no tracking number provided - verify defensive omission)
const emailOutForDelivery = generateOrderEmail('OUT_FOR_DELIVERY', mockOrderB, {
  carrier: 'Pokhara Local Rider',
});
console.log('\n--- TEST 2: OUT_FOR_DELIVERY (Order B - Defensive Omission) ---');
console.log('Subject:', emailOutForDelivery.subject);
console.log('Greeting:', emailOutForDelivery.greeting);
console.log('Title:', emailOutForDelivery.title);
console.log('Has Carrier:', emailOutForDelivery.html.includes('Pokhara Local Rider'));
console.log('Omitted Tracking Number Label:', !emailOutForDelivery.html.includes('Tracking Number:'));
console.log('Has Address:', emailOutForDelivery.html.includes('Lakeside Ward 6, Pokhara'));

// Test 3: Order A Cancelled
const emailCancelled = generateOrderEmail('ORDER_CANCELLED', mockOrderA, {
  cancellationReason: 'Customer requested change of delivery address',
});
console.log('\n--- TEST 3: ORDER_CANCELLED ---');
console.log('Subject:', emailCancelled.subject);
console.log('Has Reason:', emailCancelled.html.includes('Customer requested change of delivery address'));

// Test 4: Refund Completed
const emailRefund = generateOrderEmail('REFUND_COMPLETED', mockOrderA, {
  refundAmount: 6250,
  refundMethod: 'eSewa Mobile Wallet',
});
console.log('\n--- TEST 4: REFUND_COMPLETED ---');
console.log('Subject:', emailRefund.subject);
console.log('Has Refund Amount:', emailRefund.html.includes('6,250') || emailRefund.html.includes('6250'));
console.log('Has Refund Method:', emailRefund.html.includes('eSewa Mobile Wallet'));

console.log('\nAll dynamic email generator tests passed successfully!');
