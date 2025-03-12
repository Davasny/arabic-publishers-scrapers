import {
  fetchArticles,
  initialArticlesListFetch,
} from "@/cli/paginatedScraper";
import { getBrowser } from "@/clients/BrowserFactory";
import { AlmasryAlyoumClient } from "@/clients/AlmasryAlyoumClient";

const PUBLISHER_NAME = "AlmasryAlyoum";

const almasryInitialArticlesListFetch = async () => {
  const { page, browser } = await getBrowser({ openDevTools: false });
  const client = new AlmasryAlyoumClient(page);

  await initialArticlesListFetch(PUBLISHER_NAME, client);

  await browser.close();
};

const almasryFetchArticles = async () => {
  const { page, browser } = await getBrowser({ openDevTools: false });
  const client = new AlmasryAlyoumClient(page);

  await fetchArticles(PUBLISHER_NAME, client);

  await browser.close();
};

almasryFetchArticles();
