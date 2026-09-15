# PawMart Nepal — Multi-Vendor Pet Care Marketplace

PawMart Nepal is a full-stack, multi-role web application combining a pet supplies marketplace with a veterinary booking platform tailored for Nepal. Built with Next.js (App Router), TypeScript, Tailwind CSS, Prisma ORM with SQLite, Auth.js (NextAuth), Zod, and React Hook Form.

---

## 🚀 Quick Setup & Run Instructions

```bash
# 1. Install dependencies
npm install

# 2. Synchronize database schema (file-based SQLite, zero external setup)
npx prisma db push

# 3. Seed realistic Nepali database (products, clinics, orders, appointments)
npx prisma db seed

# 4. Start local development server
npm run dev
```

The application will be available at **`http://localhost:3000`**.

---

## 🔑 Demo Login Credentials (All 4 User Roles)

All demo accounts use the password: `password123`.

| Role | Email | Password | Access Route | Features & Purpose |
|---|---|---|---|---|
| **Customer** (Pet Owner) | `customer@pawmart.test` | `password123` | `/customer/dashboard` | Browse/filter marketplace, add to cart/wishlist, checkout with mock eSewa/Khalti, view orders & printable receipts, leave verified reviews, book vet clinic appointments & home visits. |
| **Seller** (Pet Shop) | `seller@pawmart.test` | `password123` | `/seller/dashboard` | Manage shop catalog (CRUD), monitor low-stock alerts, perform batch stock updates, process incoming orders, and print invoices. |
| **Veterinary Clinic** | `vet@pawmart.test` | `password123` | `/vet/dashboard` | Manage appointment schedule, review home visit requests, issue NPR fee estimates, log electronic health records (EHR) & prescriptions. |
| **Admin** | `admin@pawmart.test` | `password123` | `/admin/dashboard` | Monitor platform GMV & metrics, approve/verify seller & vet applications, create product categories, and moderate listings. |

> 💡 **Quick 1-Click Login**: You can click the **Customer / Seller / Vet Clinic / Admin** quick login buttons on the header or `/login` page to auto-fill credentials instantly!

---

## 🐾 Core Features per Role

### 🛒 Customer (Pet Owners)
- Browse catalog by categories (Dog Food, Cat Food, Bird Supplies, Fish Supplies, Toys, Grooming, Beds, Collars, Health Products).
- Filter by brand, max price, and **Vet-Recommended** tag.
- Shopping Cart & Wishlist with persistent state.
- Multi-step checkout featuring simulated **eSewa** & **Khalti** digital payment QR modals and Cash on Delivery (COD).
- Printable purchase receipts & verified customer product reviews.
- Search nearby vet clinics in Kathmandu, Lalitpur, Pokhara, and Bhaktapur.
- Request Clinic Visit or Home Consultation with pet issue details & fee estimate preview.

### 🏪 Seller (Kathmandu Pet Bazaar)
- Sales & revenue metrics in **NPR (Rs.)**.
- Full CRUD listing control with stock levels and low-stock thresholds.
- Low-stock alert center with 1-click batch restock (+10 units).
- Order status manager (PENDING → CONFIRMED → SHIPPED → DELIVERED).
- Printable store invoice generator.

### 🩺 Veterinary Clinic (Bagmati Animal Hospital)
- Today's appointment schedule and pending requests manager.
- Urgent case prioritization flags.
- Home visit request review with custom NPR fee estimate dispatch.
- Electronic Health Record (EHR) logger for diagnoses, prescriptions, and follow-up notes.

### 🛡️ Admin (Platform Operator)
- Platform GMV, total user count, active sellers, and active vet clinics dashboard.
- Verification control for pet shop and clinic applications.
- Category management & listing moderation.
- System-wide order audit logs.

---

## 🛠️ Tech Stack & Single-Repo Architecture

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + Lucide React Icons
- **Database & ORM**: SQLite (`dev.db`) + Prisma ORM
- **Authentication**: NextAuth.js (Credentials provider with bcrypt password hashing & role-based middleware guards)
- **Validation**: Zod schema validation
- **State Management**: React Context CartProvider & Wishlist

---

## 📝 Out of Scope (Mocked / Future Enhancements)

- Live eSewa / Khalti production API credentials (simulated via interactive QR modals).
- Live Google Maps API (city & area filters implemented).
- Native mobile app & AI recommendations (listed as future enhancements).

---

## Shipping notifications and transaction security

### Database migration

The notification/security additions introduce WhatsApp preferences, notification audit data, and transaction integrity fields. Back up any production database, then run:

```bash
npx prisma db push
npx prisma generate
```

Use `npx prisma db seed` only when resetting demo data; it deletes and recreates the sample records.

### Configuration

Copy [.env.example](.env.example) to a local `.env` and configure it outside source control. The app uses SMTP for email and the official Meta WhatsApp Business Platform / Cloud API for WhatsApp. Each configured WhatsApp template must be approved in Meta Business Manager and have the parameter order used in `src/lib/notifications.ts`.

For RSA signing keys, generate a pair on a secure server or workstation:

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out transaction-private.pem
openssl rsa -pubout -in transaction-private.pem -out transaction-public.pem
```

Place the PEM contents in `SIGNING_PRIVATE_KEY` and `SIGNING_PUBLIC_KEY` (replace line breaks with `\n` if your host requires it). Never expose or commit the private key. When the signing key is absent, orders still receive a SHA-256 integrity hash, while signature verification reports that it is not configured.

### How notifications work

An admin changes an order status in the Admin Dashboard. The API validates the status and legal transition, records the new status for de-duplication, creates the in-app alert, then sends enabled channels without allowing a provider failure to roll back the order update. Every attempted email or WhatsApp send is retained in `NotificationLog` with its provider result and time. Failed logs can be resent; the Notifications tab can also deliberately send an email or WhatsApp update for an order.

Customers can independently enable email and WhatsApp, plus order, shipping, delivery, and promotional topic preferences. WhatsApp numbers are derived from the user’s stored phone number and must be valid E.164 numbers. Transactional messages are only sent via approved Cloud API templates—there is no browser automation or unofficial WhatsApp integration.

### Hashing and signatures

```text
Canonical non-sensitive transaction data → SHA-256 → Hash
Canonical non-sensitive transaction data → RSA private key → Digital signature
Canonical data + signature + RSA public key → Verification
```

The canonical representation consists of order ID, server-derived amount, `NPR`, transaction timestamp, and payment status. It explicitly excludes passwords, API keys, card numbers, and CVVs. A hash detects changed data; a digital signature additionally proves that the server-side private-key holder signed it. In the Admin Dashboard, use **Verify Transaction** for any new order to see the stored/recalculated hash, signature state, and an in-memory tampering demonstration. The endpoint never returns private keys.

### TLS / checkout deployment

Deploy behind HTTPS (for example Vercel, Cloudflare, Nginx, or a managed load balancer) and set `NEXTAUTH_URL` to its `https://` URL. In production the middleware redirects HTTP checkout and order API traffic to HTTPS, enables HSTS and security headers, and NextAuth uses secure, HTTP-only, SameSite cookies. Local development deliberately remains `http://localhost`.

To demonstrate production TLS:

1. Open `/checkout` and confirm the browser URL starts with `https://` and displays the security indicator.
2. Request the equivalent `http://` checkout URL and confirm it redirects to HTTPS.
3. In browser DevTools, verify checkout requests use HTTPS and that no mixed-content warning appears.
4. Inspect the session cookie and confirm `Secure`, `HttpOnly`, and `SameSite=Lax` are present.

### Verification checklist

- Update an order through Confirmed, Shipped, Out for Delivery, Delivered, and Delivery Failed; confirm the appropriate log entries.
- Toggle email/WhatsApp independently, try both on and both off, and use an invalid recipient or missing provider configuration to confirm a failed log does not undo the order update.
- Resend a failed log and use the manual-send controls as an admin.
- Create an order, verify its stored/recalculated SHA-256 hash matches, then inspect the tampered amount demonstration to confirm the hash changes and the original signature is invalid.
- Confirm that non-admins cannot update order status and browser-supplied price/seller values do not determine the persisted order.

### Security notes and limitations

Checkout uses simulated payment methods; a live card or wallet integration must redirect/tokenize through its PCI-compliant provider and must never post PAN/CVV to this application. TLS certificates and HTTP-to-HTTPS behavior require correct hosting/reverse-proxy configuration—application middleware cannot create certificates. Provider credentials, signing keys, and `.env` files are intentionally excluded from Git.
