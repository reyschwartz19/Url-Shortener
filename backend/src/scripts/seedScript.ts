import dotenv from 'dotenv';
dotenv.config();

import { faker } from '@faker-js/faker';
import prisma from "../config/prisma";

const USER_BATCH_SIZE = 1000;
const LINK_BATCH_SIZE = 5000;
const TOTAL_USERS = 1_000;      // links get spread across these
const TOTAL_LINKS = 1_000_000;

async function seedUsers() {
  console.log(`Seeding ${TOTAL_USERS} users...`);
  const users = Array.from({ length: TOTAL_USERS }, () => ({
    email: faker.internet.email(),
    hashedPassword: "seed-placeholder-not-a-real-hash", // fine — these users are never logged in during load tests
  }));

  for (let i = 0; i < users.length; i += USER_BATCH_SIZE) {
    await prisma.user.createMany({
      data: users.slice(i, i + USER_BATCH_SIZE),
      skipDuplicates: true,
    });
  }

  const userRecords = await prisma.user.findMany({ select: { userId: true } });
  console.log(`Seeded ${userRecords.length} users`);
  return userRecords;
}

async function seedLinks(userRecords: { userId: string }[]) {
  console.log(`Seeding ${TOTAL_LINKS} links...`);
  for (let i = 0; i < TOTAL_LINKS; i += LINK_BATCH_SIZE) {
    const batch = Array.from({ length: LINK_BATCH_SIZE }, () => ({
      originalUrl: faker.internet.url(),
      shortCode: faker.string.alphanumeric(8), // matches your real nanoid(8) length
      userId: faker.helpers.arrayElement(userRecords).userId,
      createdAt: faker.date.past(),
    }));

    await prisma.link.createMany({
      data: batch,
      skipDuplicates: true, // handles rare shortCode collisions silently
    });

    if (i % 50_000 === 0) {
      console.log(`Seeded ${i}/${TOTAL_LINKS} links`);
    }
  }
}

async function seed() {
  const userRecords = await seedUsers();
  if (userRecords.length === 0) {
    throw new Error("No users seeded — cannot seed links without valid userId foreign keys.");
  }
  await seedLinks(userRecords);

  const finalCount = await prisma.link.count();
  console.log(`Done. Final link count: ${finalCount}`);
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());