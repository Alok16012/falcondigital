import cron from "node-cron";
import { processDuePosts } from "@/lib/scheduler";
import { runCatchUp } from "@/lib/automation";

const g = globalThis as unknown as { __sellerhubCron?: boolean };

export function startCron() {
  if (g.__sellerhubCron) return;
  g.__sellerhubCron = true;

  // Every minute: publish any pending posts whose scheduled time has passed.
  cron.schedule("* * * * *", async () => {
    try {
      const { processed } = await processDuePosts();
      if (processed > 0) {
        console.log(`[cron] published ${processed} scheduled post(s)`);
      }
    } catch (e) {
      console.error("[cron] error", e);
    }
  });

  // Daily 9 AM IST: catch-up — auto post + list any product missed by the
  // instant pipeline (e.g. added while platforms weren't configured).
  cron.schedule(
    "0 9 * * *",
    async () => {
      try {
        const { processed } = await runCatchUp();
        if (processed.length > 0) {
          console.log(`[cron] daily catch-up processed ${processed.length} product(s)`);
        }
      } catch (e) {
        console.error("[cron] daily catch-up error", e);
      }
    },
    { timezone: "Asia/Kolkata" },
  );

  console.log("[cron] scheduler started (every minute + daily 9AM catch-up)");
}
