import { PrismaClient, Visibility } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DEMO_USER = {
  email: "demo@sozlik.uz",
  username: "demo",
  name: "Demo Foydalanuvchi",
  password: "demo12345",
};

const SET_TITLE = "Kundalik so'zlar";
const SET_DESCRIPTION =
  "Har kuni ishlatiladigan 30 ta inglizcha so'z va ularning o'zbekcha tarjimasi.";

const WORDS: [term: string, definition: string][] = [
  ["apple", "olma"],
  ["book", "kitob"],
  ["water", "suv"],
  ["bread", "non"],
  ["house", "uy"],
  ["family", "oila"],
  ["friend", "do'st"],
  ["teacher", "o'qituvchi"],
  ["student", "talaba"],
  ["school", "maktab"],
  ["city", "shahar"],
  ["street", "ko'cha"],
  ["window", "deraza"],
  ["door", "eshik"],
  ["table", "stol"],
  ["chair", "stul"],
  ["morning", "ertalab"],
  ["evening", "kechqurun"],
  ["today", "bugun"],
  ["tomorrow", "ertaga"],
  ["yesterday", "kecha"],
  ["beautiful", "chiroyli"],
  ["happy", "baxtli"],
  ["big", "katta"],
  ["small", "kichik"],
  ["to read", "o'qimoq"],
  ["to write", "yozmoq"],
  ["to speak", "gapirmoq"],
  ["to learn", "o'rganmoq"],
  ["to help", "yordam bermoq"],
];

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEMO_USER.password, 12);
  const user = await db.user.upsert({
    where: { email: DEMO_USER.email },
    update: { name: DEMO_USER.name, username: DEMO_USER.username, passwordHash },
    create: {
      email: DEMO_USER.email,
      username: DEMO_USER.username,
      name: DEMO_USER.name,
      passwordHash,
    },
  });

  // Re-running the seed restores the demo set instead of duplicating it.
  await db.set.deleteMany({ where: { ownerId: user.id, title: SET_TITLE } });
  const set = await db.set.create({
    data: {
      ownerId: user.id,
      title: SET_TITLE,
      description: SET_DESCRIPTION,
      visibility: Visibility.PUBLIC,
      cards: {
        create: WORDS.map(([term, definition], position) => ({ term, definition, position })),
      },
    },
    include: { _count: { select: { cards: true } } },
  });

  console.log(`Demo foydalanuvchi: ${DEMO_USER.email} / ${DEMO_USER.password}`);
  console.log(`To'plam: "${set.title}" (${set._count.cards} ta so'z)`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => void db.$disconnect());
