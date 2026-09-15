import { prisma } from '@/lib/prisma';
import { sendEmail, type SendEmailResult } from '@/lib/resend';
import { formatNPR, formatDate } from '@/lib/utils';

export type OrderNotificationEvent =
  | 'ORDER_CONFIRMED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'ORDER_PROCESSING'
  | 'ORDER_SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'REFUND_INITIATED'
  | 'REFUND_COMPLETED';

export interface OrderEmailOptions {
  // Shipping metadata (provided when available)
  trackingNumber?: string | null;
  carrier?: string | null;
  shippingMethod?: string | null;
  estimatedDelivery?: string | Date | null;
  deliveryDate?: string | Date | null;
  shippingNotes?: string | null;

  // Payment metadata
  transactionId?: string | null;
  paymentMethod?: string | null;
  paymentFailureReason?: string | null;

  // Cancellation metadata
  cancellationReason?: string | null;

  // Refund metadata
  refundAmount?: number | null;
  refundReason?: string | null;
  refundMethod?: string | null;

  // Overrides
  customRecipient?: string | null;
}

export type OrderWithDetails = NonNullable<Awaited<ReturnType<typeof fetchOrderWithDetails>>>;

/**
 * Retrieves complete order with customer and item details from the database.
 * Customer information is always retrieved from server-side database records.
 */
export async function fetchOrderWithDetails(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
              brand: true,
              price: true,
            },
          },
        },
      },
    },
  });
}

function getBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export function formatOrderNumber(orderId: string): string {
  return orderId.length > 8 ? orderId.slice(-8).toUpperCase() : orderId.toUpperCase();
}

export interface GeneratedEmailMessage {
  subject: string;
  title: string;
  greeting: string;
  eventDescription: string;
  html: string;
  text: string;
}

/**
 * Centralized dynamic email message generator.
 * Every field (subject, title, greeting, body, items, totals, shipping info, CTA)
 * is generated dynamically from actual database and event data.
 * Missing optional fields are omitted gracefully without placeholder artifacts.
 */
export function generateOrderEmail(
  event: OrderNotificationEvent,
  order: OrderWithDetails,
  options?: OrderEmailOptions
): GeneratedEmailMessage {
  const orderNumber = formatOrderNumber(order.id);
  const rawName = order.customer?.name?.trim();
  const greeting = rawName ? `Hello ${rawName},` : 'Hello,';
  const orderUrl = `${getBaseUrl()}/customer/dashboard?tab=orders`;

  // 1. Dynamic Subject & Status Content based on the specific operation
  let subject = '';
  let title = '';
  let eventDescription = '';
  let statusBadgeText = '';
  let statusBadgeColor = '#059669'; // Emerald

  switch (event) {
    case 'ORDER_CONFIRMED':
      subject = `🐾 Order #${orderNumber} Confirmed - PawMart Nepal`;
      title = 'Order Confirmed!';
      eventDescription =
        `Good news! Your PawMart order #${orderNumber} has been received and confirmed. ` +
        `Our pet care team is preparing your package for dispatch.`;
      statusBadgeText = 'CONFIRMED';
      statusBadgeColor = '#059669';
      break;

    case 'PAYMENT_SUCCESS':
      subject = `💳 Payment Successful for Order #${orderNumber} - PawMart Nepal`;
      title = 'Payment Received!';
      eventDescription =
        `We have verified and received payment for your order #${orderNumber}. ` +
        `Thank you for shopping with PawMart Nepal!`;
      statusBadgeText = 'PAID';
      statusBadgeColor = '#059669';
      break;

    case 'PAYMENT_FAILED':
      subject = `⚠️ Payment Failed for Order #${orderNumber} - PawMart Nepal`;
      title = 'Payment Unsuccessful';
      eventDescription =
        `We were unable to process payment for order #${orderNumber}. ` +
        `Please log into your account to retry or select Cash on Delivery.`;
      statusBadgeText = 'PAYMENT FAILED';
      statusBadgeColor = '#dc2626';
      break;

    case 'ORDER_PROCESSING':
      subject = `📦 Your PawMart Order #${orderNumber} Is Being Prepared`;
      title = 'Order In Preparation';
      eventDescription =
        `Your order #${orderNumber} is currently being packed with care by our fulfillment specialists ` +
        `and will be handed over to our courier partner soon.`;
      statusBadgeText = 'PROCESSING';
      statusBadgeColor = '#d97706';
      break;

    case 'ORDER_SHIPPED':
      subject = `🚚 Your PawMart Order #${orderNumber} Has Shipped`;
      title = 'Your Package Has Shipped!';
      eventDescription =
        `Exciting news! Your package for order #${orderNumber} has been dispatched from our warehouse ` +
        `and is now on its way to your delivery address.`;
      statusBadgeText = 'SHIPPED';
      statusBadgeColor = '#2563eb';
      break;

    case 'OUT_FOR_DELIVERY':
      subject = `🛵 Your PawMart Order #${orderNumber} Is Out for Delivery`;
      title = 'Out for Delivery Today!';
      eventDescription =
        `Your package #${orderNumber} is currently with our local delivery courier and will arrive today. ` +
        `Please ensure someone is available to receive it.`;
      statusBadgeText = 'OUT FOR DELIVERY';
      statusBadgeColor = '#7c3aed';
      break;

    case 'ORDER_DELIVERED':
      subject = `🎉 Your PawMart Order #${orderNumber} Has Been Delivered`;
      title = 'Order Delivered Successfully!';
      eventDescription =
        `Your PawMart order #${orderNumber} has been delivered! We hope your pet loves their new goodies. ` +
        `Thank you for being a valued member of the PawMart Nepal family.`;
      statusBadgeText = 'DELIVERED';
      statusBadgeColor = '#059669';
      break;

    case 'ORDER_CANCELLED':
      subject = `❌ Your PawMart Order #${orderNumber} Has Been Cancelled`;
      title = 'Order Cancelled';
      eventDescription =
        `Your PawMart order #${orderNumber} has been cancelled. ` +
        `If payment was already completed, your refund will be processed promptly according to our policy.`;
      statusBadgeText = 'CANCELLED';
      statusBadgeColor = '#4b5563';
      break;

    case 'REFUND_INITIATED':
      subject = `🔄 Refund Started for Order #${orderNumber} - PawMart Nepal`;
      title = 'Refund Initiated';
      eventDescription =
        `A refund has been initiated for your order #${orderNumber}. ` +
        `The funds will be credited back to your original payment account.`;
      statusBadgeText = 'REFUND INITIATED';
      statusBadgeColor = '#0891b2';
      break;

    case 'REFUND_COMPLETED':
      subject = `✅ Refund Completed for Order #${orderNumber} - PawMart Nepal`;
      title = 'Refund Completed';
      eventDescription =
        `The refund for order #${orderNumber} has been processed and completed successfully. ` +
        `Please check your account balance.`;
      statusBadgeText = 'REFUNDED';
      statusBadgeColor = '#059669';
      break;

    default:
      subject = `🐾 PawMart Order #${orderNumber} Update`;
      title = 'Order Status Update';
      eventDescription = `There is an update regarding your PawMart order #${orderNumber}.`;
      statusBadgeText = 'UPDATE';
      statusBadgeColor = '#059669';
      break;
  }

  // 2. Compute dynamic subtotal and items from actual database records
  const items = (order.items || []).map((item) => {
    const name = item.product?.name || 'Pet Item';
    const qty = item.qty || 1;
    const unitPrice = item.priceAtPurchase || 0;
    const lineTotal = unitPrice * qty;
    return { name, qty, unitPrice, lineTotal };
  });

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const total = order.total;
  const shippingFee = Math.max(0, Math.round((total - subtotal) * 100) / 100);
  const orderDateFormatted = formatDate(order.createdAt);

  // 3. Build dynamic shipping info table (ONLY including fields that actually exist)
  const shippingRows: Array<{ label: string; value: string }> = [];

  if (order.shippingAddress) {
    shippingRows.push({ label: 'Delivery Address', value: order.shippingAddress });
  }

  if (options?.carrier) {
    shippingRows.push({ label: 'Carrier / Courier', value: options.carrier });
  }

  if (options?.shippingMethod) {
    shippingRows.push({ label: 'Shipping Method', value: options.shippingMethod });
  }

  if (options?.trackingNumber) {
    shippingRows.push({ label: 'Tracking Number', value: options.trackingNumber });
  }

  if (options?.estimatedDelivery) {
    shippingRows.push({
      label: 'Estimated Delivery',
      value: typeof options.estimatedDelivery === 'string'
        ? options.estimatedDelivery
        : formatDate(options.estimatedDelivery),
    });
  }

  if (options?.deliveryDate) {
    shippingRows.push({
      label: 'Delivered On',
      value: typeof options.deliveryDate === 'string'
        ? options.deliveryDate
        : formatDate(options.deliveryDate),
    });
  }

  if (options?.shippingNotes) {
    shippingRows.push({ label: 'Delivery Notes', value: options.shippingNotes });
  }

  // 4. Build dynamic payment & refund rows (only where data exists)
  const paymentRows: Array<{ label: string; value: string }> = [];

  if (order.paymentMethod) {
    paymentRows.push({ label: 'Payment Method', value: order.paymentMethod });
  }

  if (order.paymentStatus) {
    paymentRows.push({ label: 'Payment Status', value: order.paymentStatus });
  }

  if (options?.transactionId) {
    paymentRows.push({ label: 'Transaction ID', value: options.transactionId });
  }

  if (options?.paymentFailureReason) {
    paymentRows.push({ label: 'Failure Reason', value: options.paymentFailureReason });
  }

  if (options?.cancellationReason) {
    paymentRows.push({ label: 'Cancellation Reason', value: options.cancellationReason });
  }

  if (options?.refundAmount !== undefined && options?.refundAmount !== null) {
    paymentRows.push({ label: 'Refund Amount', value: formatNPR(options.refundAmount) });
  }

  if (options?.refundReason) {
    paymentRows.push({ label: 'Refund Reason', value: options.refundReason });
  }

  if (options?.refundMethod) {
    paymentRows.push({ label: 'Refund Method', value: options.refundMethod });
  }

  // 5. Generate Items HTML table
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #1f2937; font-size: 14px;">
          <strong>${escapeHtml(item.name)}</strong>
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #4b5563; font-size: 14px; text-align: center;">
          ${item.qty}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #4b5563; font-size: 14px; text-align: right;">
          ${formatNPR(item.unitPrice)}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: 600; font-size: 14px; text-align: right;">
          ${formatNPR(item.lineTotal)}
        </td>
      </tr>`
    )
    .join('');

  // 6. Generate Shipping HTML block (omitted if no rows exist)
  let shippingHtmlBlock = '';
  if (shippingRows.length > 0) {
    const rowsHtml = shippingRows
      .map(
        (r) => `
        <tr>
          <td style="padding: 6px 0; color: #6b7280; font-size: 13px; width: 38%; vertical-align: top;">
            ${escapeHtml(r.label)}:
          </td>
          <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 500;">
            ${escapeHtml(r.value)}
          </td>
        </tr>`
      )
      .join('');

    shippingHtmlBlock = `
      <div style="margin-top: 24px; padding: 16px; background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
        <h3 style="margin: 0 0 10px 0; color: #111827; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
          Shipping & Delivery Details
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${rowsHtml}
        </table>
      </div>`;
  }

  // 7. Generate Payment/Refund HTML block (omitted if no rows exist)
  let paymentHtmlBlock = '';
  if (paymentRows.length > 0) {
    const rowsHtml = paymentRows
      .map(
        (r) => `
        <tr>
          <td style="padding: 6px 0; color: #6b7280; font-size: 13px; width: 38%; vertical-align: top;">
            ${escapeHtml(r.label)}:
          </td>
          <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 500;">
            ${escapeHtml(r.value)}
          </td>
        </tr>`
      )
      .join('');

    paymentHtmlBlock = `
      <div style="margin-top: 16px; padding: 16px; background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
        <h3 style="margin: 0 0 10px 0; color: #111827; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
          Payment Details
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${rowsHtml}
        </table>
      </div>`;
  }

  // 8. Assemble Full Responsive HTML Email
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;">
    
    <!-- Brand Header -->
    <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 28px 32px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
        🐾 PawMart Nepal
      </h1>
      <p style="margin: 6px 0 0 0; color: #d1fae5; font-size: 13px;">
        Your Trusted Companion in Pet Care
      </p>
    </div>

    <!-- Main Content Body -->
    <div style="padding: 32px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <span style="display: inline-block; padding: 4px 12px; background-color: ${statusBadgeColor}; color: #ffffff; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px;">
          ${escapeHtml(statusBadgeText)}
        </span>
        <span style="color: #6b7280; font-size: 12px;">
          Order #${escapeHtml(orderNumber)} • ${escapeHtml(orderDateFormatted)}
        </span>
      </div>

      <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 20px; font-weight: 700;">
        ${escapeHtml(title)}
      </h2>

      <p style="margin: 0 0 8px 0; color: #374151; font-size: 15px; line-height: 1.5;">
        ${escapeHtml(greeting)}
      </p>

      <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
        ${escapeHtml(eventDescription)}
      </p>

      <!-- Order Summary Table -->
      <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
        <div style="background-color: #f9fafb; padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
          <strong style="color: #111827; font-size: 14px;">Order Summary</strong>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #fafafa;">
              <th style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; text-align: left;">Item</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; text-align: center;">Qty</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; text-align: right;">Price</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <!-- Totals Breakdown -->
        <div style="padding: 12px 16px; background-color: #fafafa; border-top: 1px solid #e5e7eb;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; color: #4b5563;">
            <span>Subtotal:</span>
            <span>${formatNPR(subtotal)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; color: #4b5563;">
            <span>Standard Shipping:</span>
            <span>${shippingFee > 0 ? formatNPR(shippingFee) : 'Free'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 16px; font-weight: 700; color: #111827;">
            <span>Grand Total:</span>
            <span style="color: #059669;">${formatNPR(total)}</span>
          </div>
        </div>
      </div>

      <!-- Dynamic Shipping Section -->
      ${shippingHtmlBlock}

      <!-- Dynamic Payment Section -->
      ${paymentHtmlBlock}

      <!-- Action Button -->
      <div style="margin-top: 32px; text-align: center;">
        <a href="${orderUrl}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 14px; font-weight: 700; letter-spacing: 0.3px;">
          View Order in Dashboard
        </a>
      </div>

      <p style="margin: 28px 0 0 0; color: #6b7280; font-size: 13px; line-height: 1.5; text-align: center;">
        Need assistance with your order? Reply directly to this email or contact PawMart Nepal Support at support@pawmart.test.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
        PawMart Nepal • Kathmandu, Nepal • Dedicated to Happy Pets
      </p>
    </div>
  </div>
</body>
</html>`;

  // 9. Generate Plain Text Alternative
  const textItems = items.map((i) => `- ${i.name} x${i.qty} (${formatNPR(i.lineTotal)})`).join('\n');
  const textShipping = shippingRows.map((r) => `${r.label}: ${r.value}`).join('\n');
  const textPayment = paymentRows.map((r) => `${r.label}: ${r.value}`).join('\n');

  const text = [
    title,
    '----------------------------------------',
    greeting,
    '',
    eventDescription,
    '',
    `Order #${orderNumber} (${orderDateFormatted})`,
    'Products:',
    textItems,
    '',
    `Subtotal: ${formatNPR(subtotal)}`,
    `Shipping: ${shippingFee > 0 ? formatNPR(shippingFee) : 'Free'}`,
    `Total: ${formatNPR(total)}`,
    '',
    textShipping ? `Shipping Details:\n${textShipping}\n` : '',
    textPayment ? `Payment Information:\n${textPayment}\n` : '',
    `View Order: ${orderUrl}`,
    '',
    'Thank you for shopping with PawMart Nepal!',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    subject,
    title,
    greeting,
    eventDescription,
    html,
    text,
  };
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Primary dispatch function:
 * 1. Fetches full order with customer and items from database.
 * 2. Generates dynamic email message based on actual event & database data.
 * 3. Sends via isolated Resend email client.
 * 4. Fails safely without throwing exceptions or blocking callers.
 */
export async function dispatchOrderEmail(
  orderId: string,
  event: OrderNotificationEvent,
  options?: OrderEmailOptions
): Promise<SendEmailResult> {
  try {
    const order = await fetchOrderWithDetails(orderId);

    if (!order) {
      console.warn(`[OrderEmail] Order ${orderId} not found, skipping email.`);
      return { success: false, error: `Order ${orderId} not found` };
    }

    const recipient = options?.customRecipient || order.customer?.email;

    if (!recipient) {
      console.warn(`[OrderEmail] Order ${orderId} has no customer email address.`);
      return { success: false, error: 'Order has no customer email address' };
    }

    const message = generateOrderEmail(event, order, options);

    const result = await sendEmail({
      to: recipient,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    if (result.success) {
      console.log(
        `[OrderEmail] Live email sent for ${event} to ${recipient} (Order #${formatOrderNumber(order.id)})`
      );
    } else {
      console.warn(
        `[OrderEmail] Email delivery skipped/failed for ${event} to ${recipient}: ${result.error}`
      );
    }

    return result;
  } catch (err: any) {
    console.error(`[OrderEmail] Unexpected error dispatching ${event} email:`, err);
    return {
      success: false,
      error: err?.message || 'Failed to dispatch order email',
    };
  }
}

// ----------------------------------------------------------------------------
// Dedicated Operation Dispatch Helpers
// ----------------------------------------------------------------------------

export async function sendOrderConfirmationEmail(orderId: string, options?: OrderEmailOptions) {
  return dispatchOrderEmail(orderId, 'ORDER_CONFIRMED', options);
}

export async function sendPaymentSuccessEmail(orderId: string, options?: OrderEmailOptions) {
  return dispatchOrderEmail(orderId, 'PAYMENT_SUCCESS', options);
}

export async function sendPaymentFailedEmail(orderId: string, options?: OrderEmailOptions) {
  return dispatchOrderEmail(orderId, 'PAYMENT_FAILED', options);
}

export async function sendOrderProcessingEmail(orderId: string, options?: OrderEmailOptions) {
  return dispatchOrderEmail(orderId, 'ORDER_PROCESSING', options);
}

export async function sendOrderShippedEmail(orderId: string, options?: OrderEmailOptions) {
  return dispatchOrderEmail(orderId, 'ORDER_SHIPPED', options);
}

export async function sendOrderOutForDeliveryEmail(orderId: string, options?: OrderEmailOptions) {
  return dispatchOrderEmail(orderId, 'OUT_FOR_DELIVERY', options);
}

export async function sendOrderDeliveredEmail(orderId: string, options?: OrderEmailOptions) {
  return dispatchOrderEmail(orderId, 'ORDER_DELIVERED', options);
}

export async function sendOrderCancelledEmail(orderId: string, options?: OrderEmailOptions) {
  return dispatchOrderEmail(orderId, 'ORDER_CANCELLED', options);
}

export async function sendRefundInitiatedEmail(orderId: string, options?: OrderEmailOptions) {
  return dispatchOrderEmail(orderId, 'REFUND_INITIATED', options);
}

export async function sendRefundCompletedEmail(orderId: string, options?: OrderEmailOptions) {
  return dispatchOrderEmail(orderId, 'REFUND_COMPLETED', options);
}

/**
 * Handles status transitions with built-in duplicate prevention.
 * If newStatus equals previousStatus, sending is skipped.
 */
export async function handleOrderStatusTransition(
  orderId: string,
  newStatus: string,
  previousStatus?: string,
  options?: OrderEmailOptions
): Promise<SendEmailResult & { skipped?: boolean }> {
  if (previousStatus && newStatus === previousStatus) {
    console.log(`[OrderEmail] Status unchanged (${newStatus}), skipping email dispatch.`);
    return { success: true, skipped: true };
  }

  switch (newStatus) {
    case 'CONFIRMED':
      return sendOrderConfirmationEmail(orderId, options);
    case 'PROCESSING':
      return sendOrderProcessingEmail(orderId, options);
    case 'SHIPPED':
      return sendOrderShippedEmail(orderId, options);
    case 'OUT_FOR_DELIVERY':
      return sendOrderOutForDeliveryEmail(orderId, options);
    case 'DELIVERED':
      return sendOrderDeliveredEmail(orderId, options);
    case 'CANCELLED':
      return sendOrderCancelledEmail(orderId, options);
    case 'REFUND_INITIATED':
      return sendRefundInitiatedEmail(orderId, options);
    case 'REFUND_COMPLETED':
      return sendRefundCompletedEmail(orderId, options);
    default:
      return { success: true, skipped: true };
  }
}
