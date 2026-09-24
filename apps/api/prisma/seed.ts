import { PrismaClient, Role, LedgerReason, TransferStatus, WorkOrderStatus, CustomerOrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding FOUNDRY database...');

  // Clean existing tables
  await prisma.customerOrder.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.stockLedger.deleteMany();
  await prisma.inventoryBalance.deleteMany();
  await prisma.user.deleteMany();
  await prisma.item.deleteMany();
  await prisma.location.deleteMany();

  // Create Locations
  const locCentral = await prisma.location.create({
    data: { name: 'Central Foundry Warehouse' },
  });

  const locWest = await prisma.location.create({
    data: { name: 'West Coast Distribution Center' },
  });

  const locEast = await prisma.location.create({
    data: { name: 'East Coast Logistics Hub' },
  });

  console.log('✅ Created 3 Locations');

  // Create Users with hashed passwords
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@foundry.com',
      passwordHash,
      role: Role.ADMIN,
      assignedLocationId: locCentral.id,
    },
  });

  const opsUser = await prisma.user.create({
    data: {
      email: 'ops@foundry.com',
      passwordHash,
      role: Role.OPS,
      assignedLocationId: locWest.id,
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      email: 'sales@foundry.com',
      passwordHash,
      role: Role.SALES,
      assignedLocationId: locEast.id,
    },
  });

  console.log('✅ Created Demo Users (Admin, Ops, Sales)');

  // Create Items
  const itemSteel = await prisma.item.create({
    data: {
      sku: 'RAW-STL-001',
      name: 'High-Grade Steel Alloy Ingot',
      category: 'Raw Materials',
    },
  });

  const itemBattery = await prisma.item.create({
    data: {
      sku: 'PWR-BAT-400',
      name: 'Industrial Lithium Battery Pack 400V',
      category: 'Electronics',
    },
  });

  const itemBearing = await prisma.item.create({
    data: {
      sku: 'MCH-BRG-088',
      name: 'Precision Ceramic Micro-Bearing',
      category: 'Machinery Components',
    },
  });

  console.log('✅ Created 3 Inventory Items');

  // Seed Initial Stock Receipts via Ledger and Balances in sync
  const initialStock = [
    { item: itemSteel, location: locCentral, batch: 'BATCH-2026-A1', physical: 500, reserved: 50 },
    { item: itemBattery, location: locCentral, batch: 'BATCH-2026-B1', physical: 120, reserved: 20 },
    { item: itemBearing, location: locCentral, batch: 'BATCH-2026-C1', physical: 15, reserved: 5 }, // Low stock item
    { item: itemSteel, location: locWest, batch: 'BATCH-2026-A2', physical: 300, reserved: 0 },
    { item: itemBattery, location: locEast, batch: 'BATCH-2026-B2', physical: 80, reserved: 10 },
  ];

  for (const s of initialStock) {
    await prisma.inventoryBalance.create({
      data: {
        itemId: s.item.id,
        locationId: s.location.id,
        batch: s.batch,
        physicalQty: s.physical,
        reservedQty: s.reserved,
      },
    });

    await prisma.stockLedger.create({
      data: {
        itemId: s.item.id,
        locationId: s.location.id,
        batch: s.batch,
        delta: s.physical,
        reason: LedgerReason.RECEIPT,
        refType: 'INITIAL_SEED',
        refId: 'SEED-001',
        idempotencyKey: `SEED-${s.item.sku}-${s.location.id}-${s.batch}`,
        createdBy: adminUser.id,
      },
    });
  }

  console.log('✅ Created Initial Ledger Entries and Synchronized Inventory Balances');

  // Create Work Orders
  await prisma.workOrder.create({
    data: {
      locationId: locCentral.id,
      itemId: s.itemBearing.id, // Low stock -> causes shortage calculation trigger!
      requiredQty: 40,
      assignedUserId: opsUser.id,
      status: WorkOrderStatus.IN_PROGRESS,
    },
  });

  // Create Transfer
  await prisma.transfer.create({
    data: {
      sourceLocationId: locCentral.id,
      destLocationId: locWest.id,
      itemId: itemSteel.id,
      quantity: 50,
      status: TransferStatus.REQUESTED,
    },
  });

  // Create Customer Order
  await prisma.customerOrder.create({
    data: {
      customerRef: 'CUST-TESLA-99',
      itemId: itemBattery.id,
      locationId: locCentral.id,
      quantity: 15,
      status: CustomerOrderStatus.RESERVED,
      salesUserId: salesUser.id,
    },
  });

  console.log('✅ Seeded Work Orders, Transfers, and Customer Orders successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
