import { headers } from "next/headers";
import { redis } from "./redis";

const THREAD_COOLDOWN_SECONDS = 60;
const REPLY_COOLDOWN_SECONDS = 7;
const DUPLICATE_COOLDOWN_SECONDS = 60;

export async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip")?.trim() ||
    h.get("cf-connecting-ip")?.trim() ||
    "127.0.0.1"
  );
}

function hashComment(text: string): string {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, " ");
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36) + "_" + normalized.length;
}

const cooldownKey = (ip: string, isThread: boolean) => `ratelimit:ip:${ip}:${isThread ? "thread" : "reply"}`;
const dupKey = (ip: string, comment: string) => `ratelimit:dup:${ip}:${hashComment(comment)}`;

export async function checkPostRateLimit(ip: string, isThread: boolean, comment: string): Promise<void> {
  const ttl = await redis.ttl(cooldownKey(ip, isThread));
  if (ttl > 0) {
    throw new Error(`Cooldown active: Please wait ${ttl}s before ${isThread ? "starting a new thread" : "posting a reply"}, Anon.`);
  }
  if (comment.trim() && (await redis.exists(dupKey(ip, comment)))) {
    throw new Error("Duplicate post detected. Please wait a minute before repeating yourself, Anon.");
  }
}

export async function recordPostRateLimit(ip: string, isThread: boolean, comment: string): Promise<void> {
  const pipe = redis.pipeline();
  pipe.set(cooldownKey(ip, isThread), "1", { ex: isThread ? THREAD_COOLDOWN_SECONDS : REPLY_COOLDOWN_SECONDS });
  if (comment.trim()) pipe.set(dupKey(ip, comment), "1", { ex: DUPLICATE_COOLDOWN_SECONDS });
  await pipe.exec();
}
