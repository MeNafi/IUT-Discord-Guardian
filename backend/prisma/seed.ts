import { PrismaClient, DeviceType } from "@prisma/client";

const prisma = new PrismaClient();

// Match room names with discord commands
const ROOMS = ["drawing", "work1", "work2"];

async function main() {
  console.log("🌱 Seeding rooms + devices...");

  for (const roomName of ROOMS) {
    // Get or create room
    const room = await prisma.room.upsert({
      where: { name: roomName },
      update: {},
      create: { name: roomName },
    });

    // 2 fans (55W) + 3 lights (15W) per room
    const devicesToCreate = [
      { name: "Fan1", type: DeviceType.fan, ratedWatts: 55 },
      { name: "Fan2", type: DeviceType.fan, ratedWatts: 55 },
      { name: "Light1", type: DeviceType.light, ratedWatts: 15 },
      { name: "Light2", type: DeviceType.light, ratedWatts: 15 },
      { name: "Light3", type: DeviceType.light, ratedWatts: 15 },
    ];

    for (const d of devicesToCreate) {
      // Upsert devices with random initial state
      await prisma.device.upsert({
        where: { roomId_name: { roomId: room.id, name: d.name } },
        update: {},
        create: {
          name: d.name,
          type: d.type,
          ratedWatts: d.ratedWatts,
          isOn: Math.random() > 0.5, 
          roomId: room.id,
        },
      });
    }
  }

  console.log("✅ Seed complete: 3 rooms x 5 devices = 15 devices injected.");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });