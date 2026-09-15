import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PawMart Nepal database...');

  // Clean existing data
  await prisma.moderationLog.deleteMany();
  await prisma.patientRecord.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.vetProfile.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = bcrypt.hashSync('password123', 10);

  // 1. Create Users & Profiles
  // Admin
  await prisma.user.create({
    data: {
      name: 'PawMart Admin',
      email: 'admin@pawmart.test',
      passwordHash,
      role: 'ADMIN',
      phone: '+977-9801000000',
    },
  });

  // Main Customer
  const customer1 = await prisma.user.create({
    data: {
      name: 'Aarav Sharma',
      email: 'customer@pawmart.test',
      passwordHash,
      role: 'CUSTOMER',
      phone: '+977-9841234567',
      customerProfile: {
        create: {
          addresses: JSON.stringify([
            {
              id: 'addr-1',
              title: 'Home',
              street: 'Baneshwor Height, Ward 10',
              city: 'Kathmandu',
              phone: '+977-9841234567',
              isDefault: true,
            },
            {
              id: 'addr-2',
              title: 'Office',
              street: 'Durbar Marg, Level 3',
              city: 'Kathmandu',
              phone: '+977-9841234567',
              isDefault: false,
            },
          ]),
          pets: JSON.stringify([
            {
              id: 'pet-1',
              name: 'Max',
              species: 'Dog',
              breed: 'Golden Retriever',
              age: '3 years',
              gender: 'Male',
              notes: 'Allergic to chicken proteins',
            },
            {
              id: 'pet-2',
              name: 'Luna',
              species: 'Cat',
              breed: 'Persian',
              age: '1.5 years',
              gender: 'Female',
              notes: 'Requires daily grooming',
            },
          ]),
        },
      },
    },
  });

  // Secondary Customer
  const customer2 = await prisma.user.create({
    data: {
      name: 'Sujata Gurung',
      email: 'customer2@pawmart.test',
      passwordHash,
      role: 'CUSTOMER',
      phone: '+977-9818987654',
      customerProfile: {
        create: {
          addresses: JSON.stringify([
            {
              id: 'addr-3',
              title: 'Home',
              street: 'Pulchowk Road, near St. Xavier',
              city: 'Lalitpur',
              phone: '+977-9818987654',
              isDefault: true,
            },
          ]),
          pets: JSON.stringify([
            {
              id: 'pet-3',
              name: 'Rocky',
              species: 'Dog',
              breed: 'German Shepherd',
              age: '4 years',
              gender: 'Male',
              notes: 'Loves high-protein diet',
            },
          ]),
        },
      },
    },
  });

  // Main Seller (Kathmandu Pet Bazaar)
  const sellerUser1 = await prisma.user.create({
    data: {
      name: 'Ramesh Adhikari',
      email: 'seller@pawmart.test',
      passwordHash,
      role: 'SELLER',
      phone: '+977-9851098765',
      sellerProfile: {
        create: {
          shopName: 'Kathmandu Pet Bazaar',
          description: 'Premium pet food, healthcare, and accessories hub in Kathmandu.',
          city: 'Kathmandu',
          address: 'New Road, Kathmandu',
          verified: true,
          rating: 4.9,
        },
      },
    },
    include: { sellerProfile: true },
  });

  // Seller 2 (Furry Friends Lalitpur)
  const sellerUser2 = await prisma.user.create({
    data: {
      name: 'Pooja Shrestha',
      email: 'seller2@pawmart.test',
      passwordHash,
      role: 'SELLER',
      phone: '+977-9849112233',
      sellerProfile: {
        create: {
          shopName: 'Furry Friends Lalitpur',
          description: 'Organic cat treats, toys, and grooming essentials.',
          city: 'Lalitpur',
          address: 'Jawalakhel, Lalitpur',
          verified: true,
          rating: 4.7,
        },
      },
    },
    include: { sellerProfile: true },
  });

  // Seller 3 (Pokhara Pet Care & Supplies)
  const sellerUser3 = await prisma.user.create({
    data: {
      name: 'Bikash Thapa',
      email: 'seller3@pawmart.test',
      passwordHash,
      role: 'SELLER',
      phone: '+977-9860445566',
      sellerProfile: {
        create: {
          shopName: 'Pokhara Pet Care & Supplies',
          description: 'One stop shop for dogs, cats, birds & fish in Pokhara valley.',
          city: 'Pokhara',
          address: 'Lakeside, Pokhara',
          verified: true,
          rating: 4.8,
        },
      },
    },
    include: { sellerProfile: true },
  });

  // Main Vet Clinic (Bagmati Animal Hospital)
  const vetUser1 = await prisma.user.create({
    data: {
      name: 'Dr. Bikram Maharjan',
      email: 'vet@pawmart.test',
      passwordHash,
      role: 'VET',
      phone: '+977-9801234567',
      vetProfile: {
        create: {
          clinicName: 'Bagmati Animal Hospital & Research Center',
          city: 'Kathmandu',
          address: 'Lazimpat (Near Radisson Hotel), Kathmandu',
          phone: '+977-9801234567',
          servicesOffered: JSON.stringify([
            'General Health Checkup',
            'Rabies & Combination Vaccination',
            'Soft Tissue & Orthopedic Surgery',
            'Dental Cleaning & Scaling',
            '24/7 Emergency & Home Visit Service',
          ]),
          openingHours: 'Sun-Fri: 8:00 AM - 7:00 PM | Sat: 10:00 AM - 4:00 PM',
          verified: true,
          rating: 4.9,
        },
      },
    },
    include: { vetProfile: true },
  });

  // Vet 2 (Himalayan Vet Clinic)
  const vetUser2 = await prisma.user.create({
    data: {
      name: 'Dr. Kabita Giri',
      email: 'vet2@pawmart.test',
      passwordHash,
      role: 'VET',
      phone: '+977-9813009988',
      vetProfile: {
        create: {
          clinicName: 'Himalayan Vet Clinic & Pet Diagnostics',
          city: 'Lalitpur',
          address: 'Kumaripati, Lalitpur',
          phone: '+977-9813009988',
          servicesOffered: JSON.stringify([
            'Feline Special Care',
            'Ultrasonic Dental Care',
            'Full Blood & Urine Diagnostics',
            'Home Visit Consultations',
          ]),
          openingHours: 'Mon-Sun: 9:00 AM - 6:00 PM',
          verified: true,
          rating: 4.8,
        },
      },
    },
    include: { vetProfile: true },
  });

  // Vet 3 (Pokhara Veterinary Care)
  const vetUser3 = await prisma.user.create({
    data: {
      name: 'Dr. Roshan Karki',
      email: 'vet3@pawmart.test',
      passwordHash,
      role: 'VET',
      phone: '+977-9861554433',
      vetProfile: {
        create: {
          clinicName: 'Pokhara Vet Care & Rehabilitation',
          city: 'Pokhara',
          address: 'New Road, Pokhara',
          phone: '+977-9861554433',
          servicesOffered: JSON.stringify([
            'Canine & Feline Vaccination',
            'Pet Dermatology & Allergy Testing',
            'Emergency Home Visits',
          ]),
          openingHours: 'Sun-Fri: 9:00 AM - 5:00 PM',
          verified: true,
          rating: 4.7,
        },
      },
    },
    include: { vetProfile: true },
  });

  console.log('Users created successfully.');

  // 2. Categories
  const categoriesData = [
    { name: 'Dog Food', slug: 'dog-food' },
    { name: 'Cat Food', slug: 'cat-food' },
    { name: 'Bird Supplies', slug: 'bird-supplies' },
    { name: 'Fish Supplies', slug: 'fish-supplies' },
    { name: 'Toys', slug: 'toys' },
    { name: 'Grooming', slug: 'grooming' },
    { name: 'Beds', slug: 'beds' },
    { name: 'Collars & Leashes', slug: 'collars-leashes' },
    { name: 'Health Products', slug: 'health-products' },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoriesData) {
    categories[cat.slug] = await prisma.category.create({ data: cat });
  }

  console.log('Categories created successfully.');

  // 3. Products
  const productsData = [
    // Seller 1 Products
    {
      sellerId: sellerUser1.sellerProfile!.id,
      categoryId: categories['dog-food'].id,
      name: 'Royal Canin Adult Golden Retriever Formula 3kg',
      brand: 'Royal Canin',
      description: 'Specially formulated adult dry dog food for Golden Retrievers. Supports joint health, healthy heart, and lustrous coat.',
      price: 4800,
      stock: 25,
      lowStockThreshold: 5,
      images: JSON.stringify(['https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&auto=format&fit=crop&q=80']),
      vetRecommended: true,
      status: 'PUBLISHED',
    },
    {
      sellerId: sellerUser1.sellerProfile!.id,
      categoryId: categories['health-products'].id,
      name: 'Himalaya Erina EP Anti-Tick & Flea Dog Shampoo 200ml',
      brand: 'Himalaya Herbals',
      description: 'Ayurvedic anti-tick shampoo infused with Neem and Eucalyptus oils. Prevents skin infections and ectoparasites in dogs.',
      price: 650,
      stock: 40,
      lowStockThreshold: 10,
      images: JSON.stringify(['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80']),
      vetRecommended: true,
      status: 'PUBLISHED',
    },
    {
      sellerId: sellerUser1.sellerProfile!.id,
      categoryId: categories['toys'].id,
      name: 'KONG Classic Durable Rubber Chew Toy (Large)',
      brand: 'KONG',
      description: 'Ultra-durable natural rubber dog toy. Ideal for chewers, fetching, and stuffing with peanut butter or treats.',
      price: 1850,
      stock: 3, // LOW STOCK FOR TESTING ALERT!
      lowStockThreshold: 5,
      images: JSON.stringify(['https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=600&auto=format&fit=crop&q=80']),
      vetRecommended: false,
      status: 'PUBLISHED',
    },
    {
      sellerId: sellerUser1.sellerProfile!.id,
      categoryId: categories['collars-leashes'].id,
      name: 'Padded Reflexive Nylon Dog Harness & Leash Set',
      brand: 'PawComfort',
      description: 'No-pull breathable mesh harness with 3M reflective strips for safer evening walks in Kathmandu streets.',
      price: 1450,
      stock: 15,
      lowStockThreshold: 5,
      images: JSON.stringify(['https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&auto=format&fit=crop&q=80']),
      vetRecommended: false,
      status: 'PUBLISHED',
    },
    {
      sellerId: sellerUser1.sellerProfile!.id,
      categoryId: categories['beds'].id,
      name: 'Orthopedic Memory Foam Pet Bed (Large)',
      brand: 'RestyPet',
      description: 'Plush washable memory foam bed designed for older dogs needing hip and joint pressure relief.',
      price: 3900,
      stock: 8,
      lowStockThreshold: 3,
      images: JSON.stringify(['https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=600&auto=format&fit=crop&q=80']),
      vetRecommended: true,
      status: 'PUBLISHED',
    },

    // Seller 2 Products
    {
      sellerId: sellerUser2.sellerProfile!.id,
      categoryId: categories['cat-food'].id,
      name: 'Whiskas Ocean Fish Adult Cat Food 1.2kg',
      brand: 'Whiskas',
      description: 'Complete and balanced cat food with tasty crunch bites rich in Omega 3 & 6 for glossy feline coat.',
      price: 980,
      stock: 30,
      lowStockThreshold: 8,
      images: JSON.stringify(['https://images.unsplash.com/photo-1615789591457-74a63395c990?w=600&auto=format&fit=crop&q=80']),
      vetRecommended: true,
      status: 'PUBLISHED',
    },
    {
      sellerId: sellerUser2.sellerProfile!.id,
      categoryId: categories['toys'].id,
      name: 'Interactive Feather Cat Wand & Sisal Scratching Post',
      brand: 'CatPlay',
      description: 'Keep indoor cats active and prevent sofa scratching with durable sisal post and bell wand toy.',
      price: 1200,
      stock: 2, // LOW STOCK
      lowStockThreshold: 5,
      images: JSON.stringify(['https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=600&auto=format&fit=crop&q=80']),
      vetRecommended: false,
      status: 'PUBLISHED',
    },
    {
      sellerId: sellerUser2.sellerProfile!.id,
      categoryId: categories['grooming'].id,
      name: 'Self-Cleaning De-Shedding Pet Slicker Brush',
      brand: 'GroomPro',
      description: 'Effortlessly remove loose undercoat hair with one-click pin retracting mechanism. Works on dogs & cats.',
      price: 750,
      stock: 20,
      lowStockThreshold: 5,
      images: JSON.stringify(['https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600&auto=format&fit=crop&q=80']),
      vetRecommended: true,
      status: 'PUBLISHED',
    },

    // Seller 3 Products
    {
      sellerId: sellerUser3.sellerProfile!.id,
      categoryId: categories['bird-supplies'].id,
      name: 'Trill Premium Cockatiel & Parakeet Seed Mix 1kg',
      brand: 'Trill',
      description: 'Enriched seed mix containing vitamins A, D & E plus shell grit for healthy bird digestion.',
      price: 850,
      stock: 18,
      lowStockThreshold: 4,
      images: JSON.stringify(['https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&auto=format&fit=crop&q=80']),
      vetRecommended: true,
      status: 'PUBLISHED',
    },
    {
      sellerId: sellerUser3.sellerProfile!.id,
      categoryId: categories['fish-supplies'].id,
      name: 'Hikari Gold Tropical Fish Flakes & Water Clarifier 250ml',
      brand: 'Hikari',
      description: 'High nutrition floating granules for tropical aquarium fish, enhanced with natural color booster.',
      price: 1100,
      stock: 22,
      lowStockThreshold: 5,
      images: JSON.stringify(['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=600&auto=format&fit=crop&q=80']),
      vetRecommended: false,
      status: 'PUBLISHED',
    },
  ];

  const createdProducts = [];
  for (const p of productsData) {
    const prod = await prisma.product.create({ data: p });
    createdProducts.push(prod);
  }

  console.log('Products created successfully.');

  // 4. Create Sample Orders for Customer 1
  await prisma.order.create({
    data: {
      customerId: customer1.id,
      total: 4800,
      status: 'DELIVERED',
      paymentMethod: 'ESEWA',
      paymentStatus: 'PAID',
      shippingAddress: 'Baneshwor Height, Ward 10, Kathmandu (+977-9841234567)',
      items: {
        create: [
          {
            productId: createdProducts[0].id,
            sellerId: sellerUser1.sellerProfile!.id,
            qty: 1,
            priceAtPurchase: 4800,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      customerId: customer1.id,
      total: 2100,
      status: 'SHIPPED',
      paymentMethod: 'KHALTI',
      paymentStatus: 'PAID',
      shippingAddress: 'Baneshwor Height, Ward 10, Kathmandu (+977-9841234567)',
      items: {
        create: [
          {
            productId: createdProducts[1].id,
            sellerId: sellerUser1.sellerProfile!.id,
            qty: 1,
            priceAtPurchase: 650,
          },
          {
            productId: createdProducts[3].id,
            sellerId: sellerUser1.sellerProfile!.id,
            qty: 1,
            priceAtPurchase: 1450,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      customerId: customer1.id,
      total: 980,
      status: 'PENDING',
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      shippingAddress: 'Durbar Marg, Level 3, Kathmandu (+977-9841234567)',
      items: {
        create: [
          {
            productId: createdProducts[5].id,
            sellerId: sellerUser2.sellerProfile!.id,
            qty: 1,
            priceAtPurchase: 980,
          },
        ],
      },
    },
  });

  console.log('Orders created successfully.');

  // 5. Product Reviews
  await prisma.review.create({
    data: {
      productId: createdProducts[0].id,
      customerId: customer1.id,
      rating: 5,
      comment: 'Super fast delivery in Kathmandu! My Golden Retriever Max absolutely loves Royal Canin. Coat is shiny.',
      verifiedPurchase: true,
    },
  });

  await prisma.review.create({
    data: {
      productId: createdProducts[1].id,
      customerId: customer2.id,
      rating: 4,
      comment: 'Erina EP shampoo eliminated ticks within 2 washes! Smells fresh of neem.',
      verifiedPurchase: true,
    },
  });

  console.log('Reviews created successfully.');

  // 6. Appointments
  await prisma.appointment.create({
    data: {
      customerId: customer1.id,
      vetId: vetUser1.vetProfile!.id,
      petName: 'Max',
      petType: 'Dog (Golden Retriever)',
      type: 'CLINIC_VISIT',
      requestedDate: '2026-08-21',
      requestedTime: '10:30 AM',
      status: 'CONFIRMED',
      isUrgent: false,
      feeEstimate: 1200,
      notes: 'Annual combination vaccination & general health checkup.',
    },
  });

  await prisma.appointment.create({
    data: {
      customerId: customer1.id,
      vetId: vetUser1.vetProfile!.id,
      petName: 'Luna',
      petType: 'Cat (Persian)',
      type: 'HOME_VISIT',
      requestedDate: '2026-08-22',
      requestedTime: '02:00 PM',
      address: 'Baneshwor Height, Ward 10, Kathmandu',
      status: 'PENDING',
      isUrgent: true,
      feeEstimate: 2500,
      notes: 'Luna has been lethargic and missing meals for 2 days. Urgent home consultation requested.',
    },
  });

  await prisma.appointment.create({
    data: {
      customerId: customer2.id,
      vetId: vetUser2.vetProfile!.id,
      petName: 'Rocky',
      petType: 'Dog (German Shepherd)',
      type: 'CLINIC_VISIT',
      requestedDate: '2026-08-18',
      requestedTime: '11:00 AM',
      status: 'COMPLETED',
      isUrgent: false,
      feeEstimate: 1500,
      notes: 'Routine ear cleaning & dewclaw trimming.',
    },
  });

  console.log('Appointments created successfully.');

  // 7. Patient Records
  await prisma.patientRecord.create({
    data: {
      petName: 'Rocky',
      customerId: customer2.id,
      vetId: vetUser2.vetProfile!.id,
      visitDate: new Date('2026-08-18'),
      diagnosis: 'Mild Otitis Externa (Outer Ear Yeast Infection)',
      prescription: 'Epi-Otic Ear Cleanser 100ml - Apply 5 drops twice daily for 7 days. Amoxyclav 250mg tab - 1 tab daily after meal.',
      followUpNotes: 'Re-examine ear canal after 10 days if redness persists.',
    },
  });

  await prisma.patientRecord.create({
    data: {
      petName: 'Max',
      customerId: customer1.id,
      vetId: vetUser1.vetProfile!.id,
      visitDate: new Date('2026-06-10'),
      diagnosis: 'Seasonal Flea Allergy Dermatitis',
      prescription: 'Himalaya Erina EP Bath + Apoquel 16mg once daily for 5 days.',
      followUpNotes: 'Cleared completely. Continue preventative anti-flea bath monthly.',
    },
  });

  console.log('Patient records created successfully.');

  // 8. Moderation Logs
  await prisma.moderationLog.create({
    data: {
      userId: sellerUser3.id,
      type: 'VERIFICATION',
      reason: 'Verified shop registration documents in Pokhara Municipality.',
      actionTaken: 'APPROVED_SELLER',
      status: 'RESOLVED',
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
