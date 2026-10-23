import "server-only";

import { headers } from "next/headers";

import { db } from "@/lib/db";

/** Matches the JWT lifetime: older rows belong to expired sign-ins. */
export const DEVICE_SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
/** How often a token re-checks that its device row still exists (when the token can be saved). */
export const DEVICE_CHECK_INTERVAL_MS = 60 * 1000;
/** `lastSeenAt` is written at most this often per device. */
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

const clip = (value: string | null, max: number) => (value ? value.slice(0, max) : null);

/** Records a new sign-in for this browser and returns its id; also drops the user's stale rows. */
export async function startDeviceSession(userId: string): Promise<string> {
  let userAgent: string | null = null;
  let city: string | null = null;
  let country: string | null = null;
  try {
    const h = await headers();
    userAgent = clip(h.get("user-agent"), 512);
    city = clip(h.get("x-vercel-ip-city"), 120);
    country = clip(h.get("x-vercel-ip-country"), 8);
  } catch {
    // Outside a request (should not happen during sign-in): store the row without details.
  }
  const now = new Date();
  await db.deviceSession.deleteMany({
    where: { userId, lastSeenAt: { lt: new Date(now.getTime() - DEVICE_SESSION_MAX_AGE_MS) } },
  });
  const row = await db.deviceSession.create({
    data: { userId, userAgent, city, country, createdAt: now, lastSeenAt: now },
    select: { id: true },
  });
  return row.id;
}

/** True if the device is still signed in; refreshes its "last seen" time now and then. */
export async function touchDeviceSession(id: string, userId: string): Promise<boolean> {
  const row = await db.deviceSession.findUnique({
    where: { id },
    select: { userId: true, lastSeenAt: true },
  });
  if (!row || row.userId !== userId) return false;
  const now = Date.now();
  if (now - row.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await db.deviceSession.updateMany({ where: { id }, data: { lastSeenAt: new Date(now) } });
  }
  return true;
}

export async function endDeviceSession(id: string): Promise<void> {
  await db.deviceSession.deleteMany({ where: { id } });
}

/** Signs out every device of the user except `keepId` (all of them when `keepId` is undefined). */
export async function endOtherDeviceSessions(userId: string, keepId: string | undefined) {
  const { count } = await db.deviceSession.deleteMany({
    where: { userId, ...(keepId && { id: { not: keepId } }) },
  });
  return count;
}

export type DeviceSessionRow = {
  id: string;
  userAgent: string | null;
  city: string | null;
  country: string | null;
  createdAt: Date;
  lastSeenAt: Date;
};

export async function listDeviceSessions(userId: string): Promise<DeviceSessionRow[]> {
  return db.deviceSession.findMany({
    where: {
      userId,
      lastSeenAt: { gte: new Date(Date.now() - DEVICE_SESSION_MAX_AGE_MS) },
    },
    orderBy: { lastSeenAt: "desc" },
    take: 50,
    select: {
      id: true,
      userAgent: true,
      city: true,
      country: true,
      createdAt: true,
      lastSeenAt: true,
    },
  });
}
