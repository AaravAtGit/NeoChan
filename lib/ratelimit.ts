import { headers } from "next/headers";
import { redis } from "./redis";

export const THREAD_COOLDOWN_SECONDS = 60;
export const REPLY_COOLDOWN_SECONDS = 7;
export const DUPLICATE_COOLDOWN_SECONDS = 60;

export async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0].trim();
      if (first) return first;
    }
    const realIp = headerList.get("x-real-ip");
    if (realIp) return realIp.trim();

    const cfIp = headerList.get("cf-connecting-ip");
    if (cfIp) return cfIp.trim();

    return "127.0.0.1";
  } catch {
    return "127.0.0.1";
  }
}

function hashComment(text: string): string {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, " ");
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36) + "_" + normalized.length;
}

export async function checkPostRateLimit(
  ip: string,
  isThread: boolean,
  comment: string
): Promise<void> {
  const actionKey = isThread ? `ratelimit:ip:${ip}:thread` : `ratelimit:ip:${ip}:reply`;
  const actionName = isThread ? "starting a new thread" : "posting a reply";

  const ttl = await redis.ttl(actionKey);
  if (ttl > 0) {
    throw new Error(`Cooldown active: Please wait ${ttl}s before ${actionName}, Anon.`);
  }

  if (comment?.trim()) {
    const commentHash = hashComment(comment);
    const dupKey = `ratelimit:dup:${ip}:${commentHash}`;
    const isDuplicate = await redis.exists(dupKey);
    if (isDuplicate) {
      throw new Error("Duplicate post detected. Please wait a minute before repeating yourself, Anon.");
    }
  }
}

export async function recordPostRateLimit(
  ip: string,
  isThread: boolean,
  comment: string
): Promise<void> {
  const actionKey = isThread ? `ratelimit:ip:${ip}:thread` : `ratelimit:ip:${ip}:reply`;
  const cooldownSecs = isThread ? THREAD_COOLDOWN_SECONDS : REPLY_COOLDOWN_SECONDS;

  const pipe = redis.pipeline();
  pipe.set(actionKey, "1", { ex: cooldownSecs });

  if (comment?.trim()) {
    const commentHash = hashComment(comment);
    const dupKey = `ratelimit:dup:${ip}:${commentHash}`;
    pipe.set(dupKey, "1", { ex: DUPLICATE_COOLDOWN_SECONDS });
  }

  await pipe.exec();
}
