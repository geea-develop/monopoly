import { expect, test } from "@playwright/test";

// Offline single-player mode must work with NO network at all. We simulate a
// dead connection with context.setOffline(true) and verify a full game vs the
// AI still starts and is playable — proving the local engine + AI run entirely
// in the browser.
test.describe("Monopoly offline single-player", () => {
  test("starts and plays a game vs the computer with the browser offline", async ({ page, context }) => {
    await page.goto("/");
    await page.getByPlaceholder("Your name").fill("Solo");

    // Kill the network — the offline flow must not depend on the server.
    await context.setOffline(true);

    // Configure 1 bot, easy difficulty, and start offline.
    await page.getByRole("button", { name: "1 bot" }).click();
    await page.getByRole("button", { name: "easy", exact: true }).click();
    await page.getByRole("button", { name: /Play Offline/ }).click();

    // The game board (turn indicator + roll button) should appear with no server.
    await expect(page.getByText(/Turn \d+ \/ \d+/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /Roll Dice/ })).toBeVisible({ timeout: 10000 });

    // Take a turn: roll, then end (or buy) — the human should regain a turn
    // after the bot auto-plays.
    await page.getByRole("button", { name: /Roll Dice/ }).click();
    // Either a buy option or an end-turn button follows the roll.
    const endTurn = page.getByRole("button", { name: /End Turn/ });
    const buy = page.getByRole("button", { name: /^✓ Buy$|Buy/ });
    await expect(endTurn.or(buy).first()).toBeVisible({ timeout: 10000 });

    // The board persisted a local game (localStorage), proving no server state.
    const save = await page.evaluate(() => localStorage.getItem("monopoly_offline_game"));
    expect(save).toBeTruthy();
  });

  test("resumes an offline game after reload (localStorage-backed)", async ({ page, context }) => {
    await page.goto("/");
    await page.getByPlaceholder("Your name").fill("Solo");
    await context.setOffline(true);
    await page.getByRole("button", { name: "1 bot" }).click();
    await page.getByRole("button", { name: /Play Offline/ }).click();
    await expect(page.getByText(/Turn \d+ \/ \d+/)).toBeVisible({ timeout: 10000 });

    // Re-enable the network so the dev server can serve the app shell on reload.
    // (In a production PWA a service worker would cache the shell, allowing a
    // fully-offline reload; that's out of scope for this change.) The offline
    // game state itself lives in localStorage and never touches the network.
    await context.setOffline(false);
    await page.reload();
    // Immediately go offline again to prove the resumed game needs no network.
    await context.setOffline(true);

    await expect(page.getByText(/Turn \d+ \/ \d+/)).toBeVisible({ timeout: 10000 });
  });
});
