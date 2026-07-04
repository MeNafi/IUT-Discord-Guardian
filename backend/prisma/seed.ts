import { PrismaClient, DeviceType } from "@prisma/client";

const prisma = new PrismaClient();

const ROOMS = ["DrawingRoom", "WorkRoom1", "WorkRoom2"];

// Every room: 2 fans (55W each) + 3 lights (15W each) = 5 devices/room, 15 total
async function main() {
  console.log("Seeding rooms + devices...");

  for (const roomName of ROOMS) {
    const room = await prisma.room.upsert({
      where: { name: roomName },
      update: {},
      create: { name: roomName },
    });

    const devicesToCreate = [
      { name: "Fan1", type: DeviceType.fan, ratedWatts: 55 },
      { name: "Fan2", type: DeviceType.fan, ratedWatts: 55 },
      { name: "Light1", type: DeviceType.light, ratedWatts: 15 },
      { name: "Light2", type: DeviceType.light, ratedWatts: 15 },
      { name: "Light3", type: DeviceType.light, ratedWatts: 15 },
    ];

    for (const d of devicesToCreate) {
      await prisma.device.upsert({
        where: { roomId_name: { roomId: room.id, name: d.name } },
        update: {},
        create: {
          name: d.name,
          type: d.type,
          ratedWatts: d.ratedWatts,
          isOn: false,
          roomId: room.id,
        },
      });
    }
  }

  console.log("Seed complete: 3 rooms x 5 devices = 15 devices.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
