import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.product.count();
  if (count > 0) {
    console.log("Seed skipped — products already exist.");
    return;
  }

  const products = [
    {
      name: "Wireless Earbuds Pro",
      description: "Noise-cancelling earbuds with 36hr battery and fast charge.",
      price: 1499,
      mrp: 2999,
      category: "Electronics",
      imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80",
      brandColor: "#6366F1",
      stock: 120,
    },
    {
      name: "Organic Green Tea",
      description: "100% natural detox green tea, 50 bags pack.",
      price: 299,
      mrp: 499,
      category: "Grocery",
      imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80",
      brandColor: "#22C55E",
      stock: 340,
    },
    {
      name: "Minimalist Backpack",
      description: "Water-resistant 22L laptop backpack for daily commute.",
      price: 999,
      mrp: 1899,
      category: "Fashion",
      imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
      brandColor: "#F59E0B",
      stock: 75,
    },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }
  console.log(`Seeded ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
