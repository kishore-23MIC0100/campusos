import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import {
  createSharedPortalConfig,
  encodeSharedPortalConfig,
} from "./shared-portal-accounts.js";

const local = process.argv.includes("--local");
const output = process.argv.includes("--stdout");
if (!local && !output)
  throw new Error(
    "Choose --local to update the ignored server .env, or --stdout for a secure configuration pipeline.",
  );
if (process.stdin.isTTY) process.stdin.setRawMode(true);
console.log("Ready for portal configuration JSON on stdin (input is hidden).");
const reader = createInterface({ input: process.stdin, terminal: false });
const input = await new Promise<any>((resolve, reject) => {
  reader.once("line", (line) => {
    try {
      resolve(JSON.parse(line));
    } catch {
      reject(new Error("Supply one valid JSON object."));
    } finally {
      reader.close();
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
    }
  });
  reader.once("close", () =>
    reject(new Error("No portal configuration was supplied.")),
  );
});
const config = await createSharedPortalConfig(input);
const encoded = encodeSharedPortalConfig(config);
if (local) {
  const file = path.join(process.cwd(), ".env");
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const line = `CAMPUSOS_SHARED_PORTAL_ACCOUNTS=${encoded}`;
  const next = /^CAMPUSOS_SHARED_PORTAL_ACCOUNTS=.*$/m.test(current)
    ? current.replace(/^CAMPUSOS_SHARED_PORTAL_ACCOUNTS=.*$/m, line)
    : `${current.trimEnd()}${current.trimEnd() ? "\n" : ""}${line}\n`;
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, next, { mode: 0o600 });
  fs.renameSync(temporary, file);
  fs.chmodSync(file, 0o600);
  console.log(
    "Local shared portal configuration saved. Restart the API to apply it. Existing accounts are retained.",
  );
}
if (output) console.log(`PORTAL_CONFIG=${encoded}`);
