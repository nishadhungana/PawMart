import { prisma } from '@/lib/prisma';

export interface RecommendedProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  images: string;
  vetRecommended?: boolean;
  category?: {
    id?: string;
    name: string;
    slug?: string;
  };
  seller?: {
    shopName: string;
  };
  reviews?: {
    rating: number;
  }[];
  recommendationScore?: number;
}

export interface RecommendationResponse {
  type: 'collaborative' | 'popular';
  title: string;
  subtitle: string;
  products: RecommendedProduct[];
}

/**
 * Fallback Recommendation: Retrieves popular products based on order frequency.
 * Used for cold-start customers (no purchase history) and guest visitors.
 */
export async function getPopularProducts(
  limit = 4,
  excludeProductIds: Set<string> = new Set()
): Promise<RecommendedProduct[]> {
  try {
    // 1. Group non-cancelled order items by product to determine purchase frequency
    const itemCounts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: { not: 'CANCELLED' },
        },
        productId: {
          notIn: Array.from(excludeProductIds),
        },
      },
      _count: {
        productId: true,
      },
      orderBy: {
        _count: {
          productId: 'desc',
        },
      },
      take: limit * 2, // Fetch a few extra to account for out-of-stock items
    });

    const popularProductIds = itemCounts.map((item) => item.productId);

    // 2. Fetch full product details for in-stock, published products
    let products = await prisma.product.findMany({
      where: {
        id: { in: popularProductIds },
        status: 'PUBLISHED',
        stock: { gt: 0 },
      },
      include: {
        category: true,
        seller: { select: { shopName: true } },
        reviews: { select: { rating: true } },
      },
    });

    // Sort to preserve popular frequency ordering
    const scoreMap = new Map(itemCounts.map((i) => [i.productId, i._count.productId]));
    products.sort((a, b) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0));

    // 3. Fallback to newest published products if order history is insufficient
    if (products.length < limit) {
      const existingIds = new Set([
        ...Array.from(excludeProductIds),
        ...products.map((p) => p.id),
      ]);

      const additionalProducts = await prisma.product.findMany({
        where: {
          id: { notIn: Array.from(existingIds) },
          status: 'PUBLISHED',
          stock: { gt: 0 },
        },
        include: {
          category: true,
          seller: { select: { shopName: true } },
          reviews: { select: { rating: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit - products.length,
      });

      products = [...products, ...additionalProducts];
    }

    return products.slice(0, limit).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      stock: p.stock,
      images: p.images,
      vetRecommended: p.vetRecommended,
      category: p.category,
      seller: p.seller,
      reviews: p.reviews,
      recommendationScore: scoreMap.get(p.id) || 1,
    }));
  } catch (error) {
    console.error('Error fetching popular products:', error);
    return [];
  }
}

/**
 * User-Based Collaborative Filtering Recommendation Engine
 *
 * Algorithm Flow:
 * 1. Step A: Retrieve target customer's past purchases (DELIVERED / valid orders).
 * 2. Step B: Identify peer customers who purchased one or more identical products.
 * 3. Step C: Calculate similarity between target customer and each peer:
 *            similarity = (common products) / (total products bought by target customer)
 * 4. Step D: Collect products purchased by similar peers, excluding products already bought.
 * 5. Step E: Score unpurchased products by purchase frequency among similar peers.
 * 6. Step F: Return top recommended products; fallback to popular items if no history.
 */
export async function getRecommendations(
  userId?: string | null,
  limit = 4
): Promise<RecommendationResponse> {
  // Edge Case 1: Guest user or no user ID supplied -> Cold-Start fallback
  if (!userId) {
    const popular = await getPopularProducts(limit);
    return {
      type: 'popular',
      title: 'Popular Pet Essentials',
      subtitle: 'Trending products loved by pet parents across Nepal',
      products: popular,
    };
  }

  try {
    // --- Step A: Retrieve Target User's Purchase History ---
    const userOrders = await prisma.order.findMany({
      where: {
        customerId: userId,
        status: { not: 'CANCELLED' },
      },
      include: {
        items: {
          select: { productId: true },
        },
      },
    });

    // Collect unique product IDs purchased by the user
    const purchasedProductIds = new Set<string>();
    for (const order of userOrders) {
      for (const item of order.items) {
        purchasedProductIds.add(item.productId);
      }
    }

    // Edge Case 2: Customer has no purchase history -> Cold-Start fallback
    if (purchasedProductIds.size === 0) {
      const popular = await getPopularProducts(limit);
      return {
        type: 'popular',
        title: 'Popular Pet Essentials',
        subtitle: 'Explore our top-selling pet supplies to start your journey',
        products: popular,
      };
    }

    const purchasedList = Array.from(purchasedProductIds);

    // --- Step B: Find Similar Users with Overlapping Purchases ---
    // Fetch orders of other customers containing at least one overlapping product
    const peerOrdersWithOverlap = await prisma.order.findMany({
      where: {
        customerId: { not: userId },
        status: { not: 'CANCELLED' },
        items: {
          some: {
            productId: { in: purchasedList },
          },
        },
      },
      select: {
        customerId: true,
      },
    });

    const similarCustomerIds = Array.from(
      new Set(peerOrdersWithOverlap.map((o) => o.customerId))
    );

    // Edge Case 3: No other customers share any purchases -> Fallback to popular products
    if (similarCustomerIds.length === 0) {
      const popular = await getPopularProducts(limit, purchasedProductIds);
      return {
        type: 'popular',
        title: 'Popular Products for You',
        subtitle: 'Curated popular pet supplies across Kathmandu, Lalitpur, and Pokhara',
        products: popular,
      };
    }

    // --- Step C: Retrieve All Purchases of Similar Users ---
    const allPeerOrders = await prisma.order.findMany({
      where: {
        customerId: { in: similarCustomerIds },
        status: { not: 'CANCELLED' },
      },
      include: {
        items: {
          select: { productId: true },
        },
      },
    });

    // Group purchases by customer ID (using sets to handle duplicate purchases in multiple orders)
    const peerPurchasesMap = new Map<string, Set<string>>();
    for (const order of allPeerOrders) {
      if (!peerPurchasesMap.has(order.customerId)) {
        peerPurchasesMap.set(order.customerId, new Set());
      }
      const set = peerPurchasesMap.get(order.customerId)!;
      for (const item of order.items) {
        set.add(item.productId);
      }
    }

    // --- Step D: Calculate Similarity & Score Candidate Products ---
    // Candidate Product -> Frequency count among similar users
    const productFrequency = new Map<string, number>();
    // Candidate Product -> Weighted similarity score sum
    const productWeightedScores = new Map<string, number>();

    for (const [peerId, peerProducts] of peerPurchasesMap.entries()) {
      // Calculate intersection (common products)
      let commonCount = 0;
      for (const pid of peerProducts) {
        if (purchasedProductIds.has(pid)) {
          commonCount++;
        }
      }

      if (commonCount === 0) continue;

      // User Similarity Metric = common products / total products target user purchased
      const similarity = commonCount / purchasedProductIds.size;

      // Unpurchased items from this peer
      for (const pid of peerProducts) {
        if (!purchasedProductIds.has(pid)) {
          productFrequency.set(pid, (productFrequency.get(pid) || 0) + 1);
          productWeightedScores.set(
            pid,
            (productWeightedScores.get(pid) || 0) + similarity
          );
        }
      }
    }

    // Edge Case 4: Target customer has already purchased all items bought by peers
    if (productFrequency.size === 0) {
      const popular = await getPopularProducts(limit, purchasedProductIds);
      return {
        type: 'popular',
        title: 'Popular Pet Essentials',
        subtitle: 'You are up to date with similar pet owners! Here are other popular items.',
        products: popular,
      };
    }

    // --- Step E: Rank Candidates by Frequency and Similarity ---
    const rankedCandidateIds = Array.from(productFrequency.keys()).sort((a, b) => {
      const freqDiff = (productFrequency.get(b) || 0) - (productFrequency.get(a) || 0);
      if (freqDiff !== 0) return freqDiff;
      // Tiebreaker: weighted similarity score
      return (productWeightedScores.get(b) || 0) - (productWeightedScores.get(a) || 0);
    });

    // --- Step F: Fetch Product Details (Only published and in-stock items) ---
    const recommendedProducts = await prisma.product.findMany({
      where: {
        id: { in: rankedCandidateIds },
        status: 'PUBLISHED',
        stock: { gt: 0 },
      },
      include: {
        category: true,
        seller: { select: { shopName: true } },
        reviews: { select: { rating: true } },
      },
    });

    // Restore candidate ranking order
    const candidateRankMap = new Map(
      rankedCandidateIds.map((id, index) => [id, index])
    );
    recommendedProducts.sort(
      (a, b) =>
        (candidateRankMap.get(a.id) ?? 999) - (candidateRankMap.get(b.id) ?? 999)
    );

    // If candidate results are fewer than requested limit, supplement with popular products
    let finalProducts: RecommendedProduct[] = recommendedProducts.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      stock: p.stock,
      images: p.images,
      vetRecommended: p.vetRecommended,
      category: p.category,
      seller: p.seller,
      reviews: p.reviews,
      recommendationScore: productFrequency.get(p.id) || 1,
    }));

    if (finalProducts.length < limit) {
      const alreadyRecommended = new Set([
        ...Array.from(purchasedProductIds),
        ...finalProducts.map((p) => p.id),
      ]);
      const extraPopular = await getPopularProducts(
        limit - finalProducts.length,
        alreadyRecommended
      );
      finalProducts = [...finalProducts, ...extraPopular];
    }

    return {
      type: 'collaborative',
      title: 'Recommended for You',
      subtitle: 'Based on purchasing patterns of pet owners with similar tastes',
      products: finalProducts.slice(0, limit),
    };
  } catch (error) {
    console.error('Error generating collaborative recommendations:', error);
    // Graceful error fallback to popular products
    const popular = await getPopularProducts(limit);
    return {
      type: 'popular',
      title: 'Popular Pet Essentials',
      subtitle: 'Trending authentic pet supplies in Nepal',
      products: popular,
    };
  }
}
