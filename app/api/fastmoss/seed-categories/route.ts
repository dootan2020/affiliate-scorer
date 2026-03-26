// POST /api/fastmoss/seed-categories — populate FastMossCategory with known L1 VN categories
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const VN_L1_CATEGORIES = [
  { code: 14, name: "Beauty & Personal Care", nameVi: "Làm đẹp & Chăm sóc cá nhân", rank: 1 },
  { code: 2, name: "Womenswear & Underwear", nameVi: "Thời trang nữ & Đồ lót", rank: 6 },
  { code: 25, name: "Health", nameVi: "Sức khỏe", rank: 9 },
  { code: 8, name: "Fashion Accessories", nameVi: "Phụ kiện thời trang", rank: 11 },
  { code: 9, name: "Sports & Outdoor", nameVi: "Thể thao & Ngoài trời", rank: 16 },
  { code: 16, name: "Phones & Electronics", nameVi: "Điện thoại & Điện tử", rank: 26 },
  { code: 10, name: "Home Supplies", nameVi: "Đồ gia dụng", rank: 31 },
  { code: 24, name: "Food & Beverages", nameVi: "Thực phẩm & Đồ uống", rank: 36 },
  { code: 23, name: "Automotive & Motorcycle", nameVi: "Ô tô & Xe máy", rank: 41 },
  { code: 3, name: "Menswear & Underwear", nameVi: "Thời trang nam & Đồ lót", rank: 44 },
  { code: 30, name: "Collectibles", nameVi: "Sưu tầm", rank: 46 },
  { code: 19, name: "Toys & Hobbies", nameVi: "Đồ chơi & Sở thích", rank: 51 },
  { code: 11, name: "Kitchenware", nameVi: "Đồ bếp", rank: 56 },
  { code: 22, name: "Home Improvement", nameVi: "Cải thiện nhà cửa", rank: 61 },
  { code: 15, name: "Computers & Office Equipment", nameVi: "Máy tính & Thiết bị VP", rank: 71 },
  { code: 7, name: "Luggage & Bags", nameVi: "Hành lý & Túi xách", rank: 76 },
  { code: 6, name: "Shoes", nameVi: "Giày dép", rank: 81 },
  { code: 21, name: "Tools & Hardware", nameVi: "Dụng cụ & Phần cứng", rank: 86 },
  { code: 12, name: "Textiles & Soft Furnishings", nameVi: "Vải & Nội thất mềm", rank: 91 },
  { code: 13, name: "Household Appliances", nameVi: "Thiết bị gia dụng", rank: 93 },
  { code: 17, name: "Pet Supplies", nameVi: "Đồ thú cưng", rank: 96 },
  { code: 28, name: "Jewelry Accessories", nameVi: "Trang sức", rank: 101 },
  { code: 26, name: "Books, Magazines & Audio", nameVi: "Sách, Tạp chí & Audio", rank: 103 },
  { code: 18, name: "Baby & Maternity", nameVi: "Mẹ & Bé", rank: 106 },
  { code: 20, name: "Furniture", nameVi: "Nội thất", rank: 111 },
  { code: 4, name: "Kids' Fashion", nameVi: "Thời trang trẻ em", rank: 116 },
  { code: 5, name: "Muslim Fashion", nameVi: "Thời trang Hồi giáo", rank: 118 },
  { code: 31, name: "Pre-Owned", nameVi: "Đồ đã qua sử dụng", rank: 191 },
  { code: 27, name: "Virtual Products", nameVi: "Sản phẩm ảo", rank: 194 },
];

export async function POST(request: Request): Promise<NextResponse> {
  const secret = request.headers.get("x-auth-secret");
  if (!secret || secret !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let created = 0;
  let updated = 0;

  for (const cat of VN_L1_CATEGORIES) {
    const existing = await prisma.fastMossCategory.findUnique({
      where: { code_region: { code: cat.code, region: "VN" } },
    });

    if (existing) {
      await prisma.fastMossCategory.update({
        where: { id: existing.id },
        data: { name: cat.name, nameVi: cat.nameVi, rank: cat.rank, level: 1 },
      });
      updated++;
    } else {
      await prisma.fastMossCategory.create({
        data: { code: cat.code, name: cat.name, nameVi: cat.nameVi, rank: cat.rank, level: 1, region: "VN" },
      });
      created++;
    }
  }

  return NextResponse.json({
    success: true,
    totalCategories: VN_L1_CATEGORIES.length,
    created,
    updated,
  });
}
