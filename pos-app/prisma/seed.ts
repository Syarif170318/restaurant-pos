import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";
import { getMysqlConfig } from "../src/lib/db-config";

const cfg = getMysqlConfig();
const adapter = new PrismaMariaDb({
  host: cfg.host,
  port: cfg.port,
  user: cfg.user,
  password: cfg.password,
  database: cfg.database,
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.loginAudit.deleteMany();
  await prisma.deliveryOrder.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.loyaltyTransaction.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.transactionLog.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.orderItemModifier.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.order.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.ingredientStock.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.menuModifier.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.table.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.user.deleteMany();
  await prisma.outlet.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.supplier.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const outlet1 = await prisma.outlet.create({
    data: {
      name: "Outlet 1",
      code: "OUT1",
      address: "Demo outlet 1",
    },
  });

  const outlet2 = await prisma.outlet.create({
    data: {
      name: "Outlet 2",
      code: "OUT2",
      address: "Demo outlet 2",
    },
  });

  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: "admin",
        passwordHash,
        fullName: "Admin System",
        role: "admin",
        pinCode: "1234",
        outletId: outlet1.id,
      },
    }),
    prisma.user.create({
      data: {
        username: "kasir1",
        passwordHash,
        fullName: "Rina Cashier",
        role: "cashier",
        pinCode: "1111",
        outletId: outlet1.id,
      },
    }),
    prisma.user.create({
      data: {
        username: "dapur1",
        passwordHash,
        fullName: "Budi Kitchen",
        role: "kitchen",
        pinCode: "2222",
        outletId: outlet1.id,
      },
    }),
    prisma.user.create({
      data: {
        username: "manager1",
        passwordHash,
        fullName: "Andi Manager",
        role: "manager",
        pinCode: "3333",
        outletId: outlet1.id,
      },
    }),
    prisma.user.create({
      data: {
        username: "inventory1",
        passwordHash,
        fullName: "Siti Inventory",
        role: "inventory",
        pinCode: "4444",
        outletId: outlet1.id,
      },
    }),
    prisma.user.create({
      data: {
        username: "kasir2",
        passwordHash,
        fullName: "Dewi Cashier",
        role: "cashier",
        pinCode: "5555",
        outletId: outlet2.id,
      },
    }),
    prisma.user.create({
      data: {
        username: "manager2",
        passwordHash,
        fullName: "Rudi Manager",
        role: "manager",
        pinCode: "6666",
        outletId: outlet2.id,
      },
    }),
  ]);

  await prisma.setting.createMany({
    data: [
      { key: "tax_percentage", value: "10", description: "Pajak %" },
      { key: "service_charge_percentage", value: "5", description: "Service charge %" },
      { key: "receipt_header", value: "Restaurant POS", description: "Header struk" },
      { key: "receipt_footer", value: "Terima kasih!", description: "Footer struk" },
      { key: "loyalty_points_per_amount", value: "1000", description: "1 poin per Rp X" },
      { key: "loyalty_redeem_value", value: "100", description: "Nilai 1 poin (Rp)" },
    ],
  });

  const tableNums = ["A1", "A2", "A3", "B1", "B2", "B3"];
  await Promise.all([
    Promise.all(
      tableNums.map((num, i) =>
        prisma.table.create({
          data: {
            outletId: outlet1.id,
            tableNumber: num,
            capacity: i % 2 === 0 ? 4 : 2,
            area: num.startsWith("A") ? "Indoor" : "Outdoor",
            status: "available",
          },
        }),
      ),
    ),
    Promise.all(
      tableNums.map((num, i) =>
        prisma.table.create({
          data: {
            outletId: outlet2.id,
            tableNumber: num,
            capacity: i % 2 === 0 ? 4 : 2,
            area: num.startsWith("A") ? "Indoor" : "Outdoor",
            status: "available",
          },
        }),
      ),
    ),
  ]);

  const makanan = await prisma.menuCategory.create({
    data: { name: "Makanan", sortOrder: 1 },
  });
  const minuman = await prisma.menuCategory.create({
    data: { name: "Minuman", sortOrder: 2 },
  });
  const dessert = await prisma.menuCategory.create({
    data: { name: "Dessert", sortOrder: 3 },
  });

  const nasiGoreng = await prisma.menuItem.create({
    data: {
      categoryId: makanan.id,
      name: "Nasi Goreng Spesial",
      description: "Nasi goreng dengan telur dan ayam",
      price: 35000,
      station: "grill",
    },
  });
  const mieGoreng = await prisma.menuItem.create({
    data: {
      categoryId: makanan.id,
      name: "Mie Goreng",
      description: "Mie goreng klasik",
      price: 32000,
      station: "grill",
    },
  });
  const ayamBakar = await prisma.menuItem.create({
    data: {
      categoryId: makanan.id,
      name: "Ayam Bakar",
      description: "Ayam bakar bumbu spesial",
      price: 40000,
      station: "grill",
    },
  });
  const esTeh = await prisma.menuItem.create({
    data: {
      categoryId: minuman.id,
      name: "Es Teh Manis",
      price: 6500,
      station: "bar",
    },
  });
  const esJeruk = await prisma.menuItem.create({
    data: {
      categoryId: minuman.id,
      name: "Es Jeruk",
      price: 8000,
      station: "bar",
    },
  });
  const kopi = await prisma.menuItem.create({
    data: {
      categoryId: minuman.id,
      name: "Kopi Hitam",
      price: 12000,
      station: "bar",
    },
  });
  const puding = await prisma.menuItem.create({
    data: {
      categoryId: dessert.id,
      name: "Puding Coklat",
      price: 15000,
      station: "pastry",
    },
  });

  const extraPedas = await prisma.menuModifier.create({
    data: { menuItemId: nasiGoreng.id, name: "Extra Pedas", extraPrice: 2000 },
  });
  await prisma.menuModifier.create({
    data: { menuItemId: nasiGoreng.id, name: "Tanpa Bawang", extraPrice: 0 },
  });

  const beras = await prisma.ingredient.create({
    data: { name: "Beras", unit: "gram", minStockLevel: 5000 },
  });
  const telur = await prisma.ingredient.create({
    data: { name: "Telur", unit: "pcs", minStockLevel: 20 },
  });
  const ayam = await prisma.ingredient.create({
    data: { name: "Ayam", unit: "gram", minStockLevel: 2000 },
  });
  const mie = await prisma.ingredient.create({
    data: { name: "Mie", unit: "gram", minStockLevel: 3000 },
  });
  const teh = await prisma.ingredient.create({
    data: { name: "Teh", unit: "gram", minStockLevel: 500 },
  });
  const gula = await prisma.ingredient.create({
    data: { name: "Gula", unit: "gram", minStockLevel: 1000 },
  });

  const ingredients = [beras, telur, ayam, mie, teh, gula];
  for (const outlet of [outlet1, outlet2]) {
    for (const ing of ingredients) {
      await prisma.ingredientStock.create({
        data: {
          ingredientId: ing.id,
          outletId: outlet.id,
          currentStock:
            outlet.id === outlet1.id ? ing.minStockLevel * 3 : ing.minStockLevel * 1.2,
        },
      });
    }
  }

  await prisma.customer.createMany({
    data: [
      { phone: "081234567890", name: "Budi Pelanggan", loyaltyPoints: 50, outletId: outlet1.id },
      { phone: "081987654321", name: "Siti Pelanggan", loyaltyPoints: 120, outletId: outlet1.id },
      { phone: "085678901234", name: "Andi Pelanggan", loyaltyPoints: 25, outletId: outlet2.id },
    ],
  });

  await prisma.recipe.createMany({
    data: [
      { menuItemId: nasiGoreng.id, ingredientId: beras.id, quantityNeeded: 200 },
      { menuItemId: nasiGoreng.id, ingredientId: telur.id, quantityNeeded: 1 },
      { menuItemId: nasiGoreng.id, ingredientId: ayam.id, quantityNeeded: 80 },
      { menuItemId: mieGoreng.id, ingredientId: mie.id, quantityNeeded: 150 },
      { menuItemId: mieGoreng.id, ingredientId: telur.id, quantityNeeded: 1 },
      { menuItemId: ayamBakar.id, ingredientId: ayam.id, quantityNeeded: 250 },
      { menuItemId: esTeh.id, ingredientId: teh.id, quantityNeeded: 5 },
      { menuItemId: esTeh.id, ingredientId: gula.id, quantityNeeded: 15 },
      { menuItemId: esJeruk.id, ingredientId: gula.id, quantityNeeded: 10 },
      { menuItemId: kopi.id, ingredientId: gula.id, quantityNeeded: 5 },
    ],
  });

  await prisma.supplier.createMany({
    data: [
      { name: "PT Sumber Pangan", contactPerson: "Pak Joko", phone: "081234567890", email: "joko@sumberpangan.com", leadTimeDays: 3 },
      { name: "CV Segar Segar", contactPerson: "Bu Siti", phone: "081987654321", email: "siti@segar.com", leadTimeDays: 2 },
      { name: "UD Bahan Dapur", contactPerson: "Pak Ahmad", phone: "085678901234", leadTimeDays: 5 },
    ],
  });

  const supplierList = await prisma.supplier.findMany();
  const tableA1 = await prisma.table.findFirst({
    where: { outletId: outlet1.id, tableNumber: "A1" },
  });

  if (tableA1) {
    await prisma.reservation.create({
      data: {
        outletId: outlet1.id,
        tableId: tableA1.id,
        customerName: "Rina Reservasi",
        phone: "08111222333",
        partySize: 4,
        reservedAt: new Date(Date.now() + 86400000),
        status: "confirmed",
        notes: "Ulang tahun",
      },
    });
  }

  const invUser = users.find((u) => u.username === "inventory1");
  if (invUser && supplierList[0]) {
    await prisma.purchaseOrder.create({
      data: {
        outletId: outlet1.id,
        supplierId: supplierList[0].id,
        status: "draft",
        totalAmount: 500000,
        createdById: invUser.id,
        notes: "PO demo mingguan",
        items: {
          create: [{ ingredientId: beras.id, quantity: 10000, unitPrice: 15000 }],
        },
      },
    });
  }

  await prisma.deliveryOrder.create({
    data: {
      outletId: outlet1.id,
      platform: "gofood",
      externalId: "GF-DEMO-001",
      customerName: "GoFood Customer",
      customerPhone: "081999888777",
      itemsJson: JSON.stringify([{ name: "Nasi Goreng", qty: 2 }]),
      totalAmount: 70000,
      status: "pending",
    },
  });

  console.log("Seed completed!");
  console.log("Users:", users.map((u) => `${u.username} / password123 (PIN: ${u.pinCode ?? "-"})`).join(", "));
  console.log("QR Menu:", "http://localhost:3001/qr/OUT1");
  console.log("Outlets:", outlet1.name, `(${outlet1.code})`, ",", outlet2.name, `(${outlet2.code})`);
  console.log("Tables per outlet:", tableNums.join(", "));
  console.log("Modifier sample:", extraPedas.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
