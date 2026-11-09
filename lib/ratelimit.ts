import { createHash } from "crypto";
import { headers } from "next/headers";
import { redis } from "./redis";

const THREAD_COOLDOWN = 60;
const REPLY_COOLDOWN = 7;
const DUPLICATE_COOLDOWN = 60;

export async function getClientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "127.0.0.1";
}

const cooldownKey = (ip: string, isThread: boolean) => `ratelimit:ip:${ip}:${isThread ? "thread" : "reply"}`;

// same comment from the same ip = dupe, ignoring case and whitespace
function dupKey(ip: string, comment: string) {
  const normalized = comment.trim().toLowerCase().replace(/\s+/g, " ");
  return `ratelimit:dup:${ip}:${createHash("sha1").update(normalized).digest("hex")}`;
}

export async function checkPostRateLimit(ip: string, isThread: boolean, comment: string) {
  const ttl = await redis.ttl(cooldownKey(ip, isThread));
  if (ttl > 0) throw new Error(`Slow down anon, wait ${ttl}s before ${isThread ? "making another thread" : "replying again"}.`);

  if (await redis.exists(dupKey(ip, comment))) {
    throw new Error("You just posted that, anon. Wait a minute before repeating yourself.");
  }
}

export async function recordPostRateLimit(ip: string, isThread: boolean, comment: string) {
  await redis
    .pipeline()
    .set(cooldownKey(ip, isThread), "1", { ex: isThread ? THREAD_COOLDOWN : REPLY_COOLDOWN })
    .set(dupKey(ip, comment), "1", { ex: DUPLICATE_COOLDOWN })
    .exec();
}
