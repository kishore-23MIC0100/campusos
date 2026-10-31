import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import type { PureDatabase } from "./db.js";
import { logAudit } from "./middleware/auth.js";

export const portalRoles = [
  "SUPER_ADMIN",
  "SCHOOL_ADMIN",
  "TEACHER",
  "STAFF",
  "STUDENT",
  "PARENT",
] as const;
export type SharedPortalConfig = {
  version: 1;
  revision: string;
  email: string;
  fullName: string;
  passwordHash: string;
};

/** Provisioning is explicit server configuration; authentication still uses the
 * ordinary database, account-status checks, password verification and role policy. */
export async function createSharedPortalConfig(input: {
  email: string;
  fullName: string;
  password: string;
  allowShortPassword?: boolean;
}): Promise<SharedPortalConfig> {
  const email =
    typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const fullName =
    typeof input.fullName === "string" ? input.fullName.trim() : "";
  const minimum = input.allowShortPassword === true ? 8 : 12;
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    !fullName ||
    fullName.length > 120
  )
    throw new Error(
      "Supply a valid email and a full name under 120 characters.",
    );
  if (
    typeof input.password !== "string" ||
    input.password.length < minimum ||
    input.password.length > 128
  )
    throw new Error(
      `The operator password must contain ${minimum} to 128 characters.`,
    );
  return {
    version: 1,
    revision: randomUUID(),
    email,
    fullName,
    passwordHash: await bcrypt.hash(input.password, 12),
  };
}
export function encodeSharedPortalConfig(config: SharedPortalConfig): string {
  return Buffer.from(JSON.stringify(config), "utf8").toString("base64url");
}
export function readSharedPortalConfig(
  value = process.env.CAMPUSOS_SHARED_PORTAL_ACCOUNTS,
): SharedPortalConfig | null {
  if (!value) return null;
  try {
    const config = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as SharedPortalConfig;
    if (
      config.version !== 1 ||
      !/^[a-f0-9-]{36}$/.test(config.revision) ||
      typeof config.email !== "string" ||
      config.email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email) ||
      typeof config.fullName !== "string" ||
      !config.fullName ||
      config.fullName.length > 120 ||
      !/^\$2[ab]\$(1[2-5])\$[./A-Za-z0-9]{53}$/.test(config.passwordHash)
    )
      throw new Error();
    return config;
  } catch {
    throw new Error(
      "The shared portal account configuration is invalid. Reconfigure it with configure:portals.",
    );
  }
}
export function applySharedPortalAccounts(
  db: PureDatabase,
  config: SharedPortalConfig | null,
) {
  if (!config) return { created: 0, updated: 0, unchanged: 0 };
  const email = config.email.toLowerCase();
  const users = db.prepare("SELECT * FROM users").all();
  const targets = portalRoles.map((role) => {
    const matches = users.filter(
      (user) =>
        String(user.email || "").toLowerCase() === email && user.role === role,
    );
    if (matches.length > 1)
      throw new Error(
        `More than one matching ${role} account exists. Resolve the duplicate before provisioning.`,
      );
    return { role, user: matches[0] };
  });
  const counts = { created: 0, updated: 0, unchanged: 0 };
  for (const { role, user } of targets) {
    if (user?.portal_account_revision === config.revision) {
      counts.unchanged++;
      continue;
    }
    let target = user;
    if (!target) {
      const id = `usr_${randomUUID()}`;
      const username = `portal.${role.toLowerCase()}.${randomUUID().slice(0, 8)}`;
      db.prepare(
        "INSERT INTO users (id, email, username, password_hash, role, full_name, status, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(
        id,
        email,
        username,
        config.passwordHash,
        role,
        config.fullName,
        "APPROVED",
        null,
      );
      target = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      counts.created++;
    } else {
      db.prepare(
        "UPDATE users SET password_hash = ?, token_version = ?, status = ? WHERE id = ?",
      ).run(
        config.passwordHash,
        Number(target.token_version || 0) + 1,
        "APPROVED",
        target.id,
      );
      counts.updated++;
    }
    target.portal_account_revision = config.revision;
    db.scheduleSave();
    logAudit(
      null,
      "Portal account provisioning",
      "SYSTEM",
      user ? "PORTAL_CREDENTIALS_UPDATED" : "PORTAL_ACCOUNT_CREATED",
      "USER",
      target.id,
      `${role} portal credentials ${user ? "updated" : "created"} for ${email}. Existing accounts for other users were preserved.`,
      "server",
      "Scholaxys account configuration",
    );
  }
  return counts;
}
