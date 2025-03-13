import {
  fetchArticles,
  initialArticlesListFetch,
} from "@/cli/paginatedScraper";
import { getBrowser } from "@/clients/BrowserFactory";
import { AhramClient } from "@/clients/AhramClient";

const PUBLISHER_NAME = "Ahram";

const ahramInitialArticlesListFetch = async () => {
  const { page, browser } = await getBrowser({ openDevTools: false });
  const client = new AhramClient(page);

  await initialArticlesListFetch(PUBLISHER_NAME, client);

  await browser.close();
};

const ahramFetchArticles = async () => {
  const { page, browser } = await getBrowser({ openDevTools: false });
  const client = new AhramClient(page);

  await fetchArticles(PUBLISHER_NAME, client);

  await browser.close();
};

ahramFetchArticles();
