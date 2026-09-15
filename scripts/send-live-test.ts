import fs from 'fs';
import path from 'path';

// Load .env manually
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    for (const line of envConfig.split(/\r?\n/)) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = match[2] || '';
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[match[1]] = val;
      }
    }
  }
} catch (e) {
  console.warn('Could not read .env file', e);
}

import { sendEmail } from '../src/lib/resend';
import { generateOrderEmail, type OrderWithDetails } from '../src/lib/order-emails';

async function main() {
  const recipient = process.argv[2] || 'hinadhungana04@gmail.com';
  console.log(`Sending live test order email to: ${recipient}...`);

  const sampleOrder: OrderWithDetails = {
    id: 'pm-test-9941a',
    customerId: 'user-test',
    total: 3550,
    status: 'CONFIRMED',
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    shippingAddress: 'Kathmandu, Nepal',
    createdAt: new Date(),
    updatedAt: new Date(),
    transactionHash: 'dummy_hash_live_test',
    digitalSignature: 'dummy_sig_live_test',
    signedAt: new Date(),
    customer: {
      id: 'user-test',
      name: 'Hina Dhungana',
      email: recipient,
      phone: '+977-9800000000',
    },
    items: [
      {
        id: 'item-1',
        orderId: 'pm-test-9941a',
        productId: 'prod-1',
        sellerId: 'seller-1',
        qty: 1,
        priceAtPurchase: 2450,
        product: {
          name: 'Pedigree Adult Meat & Rice 3kg',
          brand: 'Pedigree',
          price: 2450,
        },
      },
      {
        id: 'item-2',
        orderId: 'pm-test-9941a',
        productId: 'prod-2',
        sellerId: 'seller-1',
        qty: 2,
        priceAtPurchase: 500,
        product: {
          name: 'Organic Catnip Mice Toys',
          brand: 'PawFun',
          price: 500,
        },
      },
    ],
  };

  const message = generateOrderEmail('ORDER_CONFIRMED', sampleOrder);

  const result = await sendEmail({
    to: recipient,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });

  if (result.success) {
    console.log(`\n🎉 SUCCESS! Email was delivered via Resend.`);
    console.log(`Message ID: ${result.messageId}`);
    console.log(`Check your Gmail inbox (${recipient}) or Spam/Promotions tab!`);
  } else {
    console.error(`\n❌ Delivery failed: ${result.error}`);
  }
}

main().catch(console.error);
