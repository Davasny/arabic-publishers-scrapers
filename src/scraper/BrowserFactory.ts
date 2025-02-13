import { connect, ConnectResult, PageWithCursor } from "puppeteer-real-browser";

interface GetBrowserOptions {
  openDevTools?: boolean;
}

interface GetBrowserResult {
  page: PageWithCursor;
  browser: ConnectResult["browser"];
}

export const getBrowser = async ({
  openDevTools = true,
}: GetBrowserOptions): Promise<GetBrowserResult> => {
  const chromiumArgs = [];

  if (openDevTools) {
    chromiumArgs.push("--auto-open-devtools-for-tabs");
  }

  const { page, browser } = await connect({
    headless: false,
    turnstile: true,
    args: chromiumArgs,
  });

  await page.setViewport({ width: 1024, height: 1024 });

  return {
    page,
    browser,
  };
};
