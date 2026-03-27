// POST /api/fastmoss/backfill-categories — fix existing products:
// 1. Set fastmossCategoryId from category name
// 2. Fix corrupt prices (> 10M VND → divide by 1000)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const CATEGORY_NAME_TO_CODE: Record<string, number> = {
  "Beauty & Personal Care": 14,
  "Womenswear & Underwear": 2,
  Health: 25,
  "Fashion Accessories": 8,
  "Sports & Outdoor": 9,
  "Phones & Electronics": 16,
  "Home Supplies": 10,
  "Food & Beverages": 24,
  "Automotive & Motorcycle": 23,
  "Menswear & Underwear": 3,
  Collectibles: 30,
  "Toys & Hobbies": 19,
  Kitchenware: 11,
  "Home Improvement": 22,
  "Computers & Office Equipment": 15,
  "Luggage & Bags": 7,
  Shoes: 6,
  "Tools & Hardware": 21,
  "Textiles & Soft Furnishings": 12,
  "Household Appliances": 13,
  "Pet Supplies": 17,
  "Jewelry Accessories": 28,
  "Books, Magazines & Audio": 26,
  "Baby & Maternity": 18,
  Furniture: 20,
  "Kids' Fashion": 4,
  "Muslim Fashion": 5,
  "Pre-Owned": 31,
  "Virtual Products": 27,
};

export async function POST(request: Request): Promise<NextResponse> {
  const secret = request.headers.get("x-auth-secret");
  if (!secret || secret !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- Fix 1: Category backfill ---
  const noCategory = await prisma.productIdentity.findMany({
    where: { fastmossProductId: { not: null }, fastmossCategoryId: null },
    select: { id: true, category: true, fastmossCategory: true },
  });

  let catFixed = 0;
  for (const p of noCategory) {
    const l1Name = p.category || p.fastmossCategory?.split(" > ")[0];
    const code = l1Name ? CATEGORY_NAME_TO_CODE[l1Name] : undefined;
    if (code) {
      await prisma.productIdentity.update({
        where: { id: p.id },
        data: { fastmossCategoryId: code },
      });
      catFixed++;
    }
  }

  // --- Fix 2: Corrupt price correction ---
  // Prices > 10M VND are likely API millidong values (× 1000)
  const corruptPrices = await prisma.productIdentity.findMany({
    where: { fastmossProductId: { not: null }, price: { gt: 10_000_000 } },
    select: { id: true, price: true },
  });

  let priceFixed = 0;
  for (const p of corruptPrices) {
    const corrected = Math.round(Number(p.price) / 1000);
    if (corrected >= 100 && corrected <= 10_000_000) {
      await prisma.productIdentity.update({
        where: { id: p.id },
        data: { price: corrected },
      });
      priceFixed++;
    }
  }

  return NextResponse.json({
    success: true,
    categories: { total: noCategory.length, fixed: catFixed },
    prices: { corrupt: corruptPrices.length, fixed: priceFixed },
  });
}
