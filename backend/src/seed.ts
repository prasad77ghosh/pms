import "dotenv/config";
import { db } from "./db/databse";
import { EncryptAndDecryptService } from "./utils/encrtiption.service";

interface SeedUser {
    name: string;
    email: string;
    password: string;
    role: "admin" | "user";
}

interface SeedCategory {
    name: string;
}

interface SeedProduct {
    name: string;
    price: number;
    image_url: string;
    categoryName: string;
}

const seedUsers: SeedUser[] = [
    {
        name: "Admin User",
        email: "admin@example.com",
        password: "admin123",
        role: "admin",
    },
];

const seedCategories: SeedCategory[] = [
    { name: "Electronics" },
    { name: "Clothing" },
    { name: "Home & Garden" },
];

const seedProducts: SeedProduct[] = [
    {
        name: "Wireless Headphones",
        price: 79.99,
        image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
        categoryName: "Electronics",
    },
    {
        name: "Smart Watch",
        price: 199.99,
        image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
        categoryName: "Electronics",
    },
    {
        name: "Cotton T-Shirt",
        price: 24.99,
        image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
        categoryName: "Clothing",
    },
    {
        name: "Denim Jeans",
        price: 59.99,
        image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
        categoryName: "Clothing",
    },
    {
        name: "Garden Tool Set",
        price: 89.99,
        image_url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
        categoryName: "Home & Garden",
    },
];

async function seed() {
    try {
        console.log("🌱 Starting database seed...");

        const encryptService = new EncryptAndDecryptService();

        // 1. Seed Users
        console.log("👤 Seeding users...");
        const userIds: { [email: string]: string } = {};

        for (const user of seedUsers) {
            // Check if user already exists
            const existingUser = await db.query(
                "SELECT id FROM users WHERE email = $1",
                [user.email]
            );

            if (existingUser.rows.length > 0) {
                console.log(`   ⚠️  User ${user.email} already exists, skipping...`);
                userIds[user.email] = existingUser.rows[0].id;
                continue;
            }

            const hashedPassword = await encryptService.hashPassword(user.password);

            const result = await db.query(
                `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
                [user.name, user.email, hashedPassword, user.role]
            );

            userIds[user.email] = result.rows[0].id;
            console.log(`   ✅ Created user: ${user.email}`);
        }

        // 2. Seed Categories
        console.log("📁 Seeding categories...");
        const categoryIds: { [name: string]: string } = {};

        for (const category of seedCategories) {
            // Check if category already exists
            const existingCategory = await db.query(
                "SELECT id FROM categories WHERE name = $1",
                [category.name]
            );

            if (existingCategory.rows.length > 0) {
                console.log(`   ⚠️  Category ${category.name} already exists, skipping...`);
                categoryIds[category.name] = existingCategory.rows[0].id;
                continue;
            }

            const result = await db.query(
                `INSERT INTO categories (name)
         VALUES ($1)
         RETURNING id`,
                [category.name]
            );

            categoryIds[category.name] = result.rows[0].id;
            console.log(`   ✅ Created category: ${category.name}`);
        }

        // 3. Seed Products
        console.log("📦 Seeding products...");
        const adminUserId = userIds["admin@example.com"];

        for (const product of seedProducts) {
            // Check if product already exists
            const existingProduct = await db.query(
                "SELECT id FROM products WHERE name = $1",
                [product.name]
            );

            if (existingProduct.rows.length > 0) {
                console.log(`   ⚠️  Product ${product.name} already exists, skipping...`);
                continue;
            }

            const categoryId = categoryIds[product.categoryName];

            if (!categoryId) {
                console.log(`   ❌ Category ${product.categoryName} not found for product ${product.name}`);
                continue;
            }

            await db.query(
                `INSERT INTO products (name, price, image_url, category_id, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
                [product.name, product.price, product.image_url, categoryId, adminUserId]
            );

            console.log(`   ✅ Created product: ${product.name}`);
        }

        console.log("\n✨ Database seeding completed successfully!");
        console.log("\n📝 Seed Summary:");
        console.log(`   - Users: ${seedUsers.length}`);
        console.log(`   - Categories: ${seedCategories.length}`);
        console.log(`   - Products: ${seedProducts.length}`);
        console.log("\n🔑 Admin Credentials:");
        console.log(`   Email: admin@example.com`);
        console.log(`   Password: admin123`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding database:", error);
        process.exit(1);
    }
}

// Run seed
seed();
