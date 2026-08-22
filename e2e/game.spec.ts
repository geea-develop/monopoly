import { expect, test } from "@playwright/test";

test.describe("Monopoly lobby and game flow", () => {
  test("shows a connected landing page and validates required player name", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Monopoly/ })).toBeVisible();
    await expect(page.getByText("Connected")).toBeVisible();

    const create = page.getByRole("button", { name: "Create New Game" });
    await expect(create).toBeDisabled();
    await page.getByPlaceholder("Your name").fill("Alice");
    await expect(create).toBeEnabled();
  });

  test("creates a lobby, joins a second player, and starts the game", async ({ browser, page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Your name").fill("Alice");
    await page.getByRole("button", { name: "Create New Game" }).click();

    const lobby = page.getByTestId("game-lobby");
    await expect(lobby).toBeVisible();
    const gameCode = await page.getByTestId("game-code").textContent();
    expect(gameCode).toBeTruthy();

    const guest = await browser.newContext();
    const guestPage = await guest.newPage();
    try {
      await guestPage.goto(`/?game=${encodeURIComponent(gameCode!.trim())}`);
      await guestPage.getByPlaceholder("Your name").fill("Bob");
      await guestPage.getByRole("button", { name: new RegExp(`Join Game ${gameCode!.trim()}`) }).click();
      await expect(guestPage.getByTestId("game-lobby")).toContainText("Alice");
      await expect(guestPage.getByTestId("game-lobby")).toContainText("Bob");

      await expect(lobby).toContainText("Bob");
      const start = page.getByRole("button", { name: "Start Game" });
      await expect(start).toBeEnabled();
      await start.click();

      await expect(page.getByText(/Turn \d+ \/ \d+/)).toBeVisible();
      await expect(guestPage.getByText(/Turn \d+ \/ \d+/)).toBeVisible();
      await expect(page.getByRole("button", { name: /Roll Dice/ })).toBeVisible();
    } finally {
      await guest.close();
    }
  });

  test("reports an invalid invite code without entering a game", async ({ page }) => {
    await page.goto("/?game=missing-game-code");
    await expect(page.getByPlaceholder("Your name")).toBeVisible();
    await page.getByPlaceholder("Your name").fill("Alice");
    await page.getByRole("button", { name: /Join Game missing-game-code/ }).click();
    await expect(page.getByText(/not found|failed|invalid/i)).toBeVisible({ timeout: 5000 });
  });

  test("rejoins the existing lobby after a page reload", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Your name").fill("Alice");
    await page.getByRole("button", { name: "Create New Game" }).click();

    const lobby = page.getByTestId("game-lobby");
    await expect(lobby).toBeVisible();
    const gameCode = (await page.getByTestId("game-code").textContent())?.trim();
    expect(gameCode).toBeTruthy();
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("monopoly_session"))).toContain(gameCode!);

    await page.reload();

    await expect(page.getByTestId("game-lobby")).toBeVisible();
    await expect(page.getByTestId("game-code")).toHaveText(gameCode!);
    await expect(page.getByTestId("game-lobby")).toContainText("Alice");
  });

  test("shows connection loss and recovers when the browser comes back online", async ({ page, context }) => {
    await page.goto("/");
    await expect(page.getByText("Connected")).toBeVisible();

    await context.setOffline(true);
    await expect(page.getByText(/Disconnected — retrying/)).toBeVisible({ timeout: 5000 });

    await context.setOffline(false);
    await expect(page.getByText("Connected")).toBeVisible({ timeout: 10000 });
  });

  test("synchronizes a roll and turn handoff across both players", async ({ browser, page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Your name").fill("Alice");
    await page.getByRole("button", { name: "Create New Game" }).click();
    const code = (await page.getByTestId("game-code").textContent())!.trim();

    const guest = await browser.newContext();
    const guestPage = await guest.newPage();
    try {
      await guestPage.goto(`/?game=${encodeURIComponent(code)}`);
      await guestPage.getByPlaceholder("Your name").fill("Bob");
      await guestPage.getByRole("button", { name: new RegExp(`Join Game ${code}`) }).click();
      await expect(page.getByRole("button", { name: "Start Game" })).toBeEnabled();
      await page.getByRole("button", { name: "Start Game" }).click();

      await page.getByRole("button", { name: /Roll Dice/ }).click();
      await expect(guestPage.getByText(/Last roll: \d+ \+ \d+ = \d+/)).toBeVisible({ timeout: 5000 });
      await page.getByRole("button", { name: /End Turn/ }).click();
      await expect(guestPage.getByText("Your turn!")).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/Current turn.*Bob/)).toBeVisible({ timeout: 5000 });
    } finally {
      await guest.close();
    }
  });

  test("supports buying a property and synchronizes ownership and balance", async ({ browser, page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Your name").fill("Alice");
    await page.getByRole("button", { name: "Create New Game" }).click();
    const code = (await page.getByTestId("game-code").textContent())!.trim();

    const guest = await browser.newContext();
    const guestPage = await guest.newPage();
    try {
      await guestPage.goto(`/?game=${encodeURIComponent(code)}`);
      await guestPage.getByPlaceholder("Your name").fill("Bob");
      await guestPage.getByRole("button", { name: new RegExp(`Join Game ${code}`) }).click();
      await expect(page.getByRole("button", { name: "Start Game" })).toBeEnabled();
      await page.getByRole("button", { name: "Start Game" }).click();

      await page.getByRole("button", { name: /Roll Dice/ }).click();
      const buyButton = page.getByRole("button", { name: /Buy/ });
      await expect(buyButton).toBeVisible({ timeout: 5000 });
      await buyButton.click();

      await expect(page.getByText("1 properties")).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("$1,400")).toBeVisible();
      await expect(guestPage.getByText("1 properties")).toBeVisible({ timeout: 5000 });
      await expect(guestPage.getByText("$1,400")).toBeVisible();
    } finally {
      await guest.close();
    }
  });
});
