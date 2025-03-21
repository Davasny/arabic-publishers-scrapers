import {
  fetchArticles,
  initialArticlesListFetch,
} from "@/cli/paginatedScraper";
import { getBrowser } from "@/clients/BrowserFactory";
import { DostorClient } from "@/clients/DostorClient";

const PUBLISHER_NAME = "Dostor";

const dostorInitialArticlesListFetch = async () => {
  const { page, browser } = await getBrowser({ openDevTools: false });
  const client = new DostorClient(page);

  await initialArticlesListFetch(PUBLISHER_NAME, client);

  await browser.close();
};

const dostorFetchArticles = async () => {
  const { page, browser } = await getBrowser({ openDevTools: false });
  const client = new DostorClient(page);

  await fetchArticles(PUBLISHER_NAME, client);

  await browser.close();
};

dostorFetchArticles();
