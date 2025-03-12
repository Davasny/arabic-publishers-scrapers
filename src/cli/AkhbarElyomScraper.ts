import { AkhbarElyomClient } from "@/clients/AkhbarElyomClient";
import { getBrowser } from "@/clients/BrowserFactory";
import { GERD } from "@/search/i18n";
import { StorageProvider } from "@/storage/StorageProvider";
import { SearchResultInsert } from "@/storage/schema";

const PUBLISHER_NAME = "AkhbarElyom";

const fetchArticlesFromPast = async () => {
  const { page, browser } = await getBrowser({ openDevTools: false });

  const storage = new StorageProvider();
  const client = new AkhbarElyomClient(page);

  // fetches articles from past
  // starts in past and goes to the oldest possible
  const oldestKnownResult = await storage.getOldestSearchResult(PUBLISHER_NAME);
  let lastId = oldestKnownResult ? oldestKnownResult.publisherArticleId : null;
  if (lastId === null) {
    const firstResult = await client.getFirstResult(GERD.renaissanceDam);
    if (!firstResult.publisherArticleId) {
      throw new Error("First result has no ID");
    }

    lastId = parseInt(firstResult.publisherArticleId);
  }

  while (true) {
    const newResults = await client.getSearchPage(
      GERD.renaissanceDam,
      lastId.toString(),
    );

    if (newResults.length === 0) {
      break;
    }

    const lastNewId = newResults[newResults.length - 1].publisherArticleId;

    if (!lastNewId || parseInt(lastNewId) === lastId) {
      break;
    }

    lastId = parseInt(lastNewId);

    const dbRows: SearchResultInsert[] = newResults.map((result) => ({
      ...result,
      publisherName: PUBLISHER_NAME,
      publisherArticleId: parseInt(result.publisherArticleId || "-1"),
    }));

    console.log(`Saving ${dbRows.length} results`);

    await storage.saveSearchResult(dbRows);
  }

  await browser.close();
};

const fetchLatestArticles = async () => {
  // gets newest id from database
  // fetches from now to the newest possible

  const { page, browser } = await getBrowser({ openDevTools: false });

  const storage = new StorageProvider();
  const client = new AkhbarElyomClient(page);

  const newestKnownResult = await storage.getNewestSearchResult(PUBLISHER_NAME);
  let newestId = newestKnownResult
    ? newestKnownResult.publisherArticleId
    : null;

  const firstResult = await client.getFirstResult(GERD.renaissanceDam);

  if (newestId === firstResult.publisherArticleId) {
    console.log("No new articles to scrape");
    return;
  }

  while (true) {
    const newResults = await client.getSearchPage(
      GERD.renaissanceDam,
      firstResult.toString(),
    );

    if (newResults.length === 0) {
      break;
    }

    const dbRows: SearchResultInsert[] = newResults.map((result) => ({
      ...result,
      publisherName: PUBLISHER_NAME,
      publisherArticleId: parseInt(result.publisherArticleId || "-1"),
    }));

    console.log(`Saving ${dbRows.length} results`);

    await storage.saveSearchResult(dbRows);

    const alreadyFetched = newResults.some(
      (r) => parseInt(r.publisherArticleId || "-1") === newestId,
    );

    if (alreadyFetched) {
      console.log("Fetched all new articles");
      break;
    }
  }

  await browser.close();
};

const getArticles = async () => {
  const { page, browser } = await getBrowser({ openDevTools: false });

  const storage = new StorageProvider();

  const toScrape =
    await storage.getSearchResultsWithoutArticles(PUBLISHER_NAME);

  if (!toScrape) {
    console.log("No articles to scrape");
    return;
  }

  const client = new AkhbarElyomClient(page);

  for (const article of toScrape) {
    console.log(`Scraping article ${article.url}`);

    if (!article.url) {
      console.warn("Article has no URL", article);
      continue;
    }

    if (!article.publisherArticleId) {
      console.warn("Article has no publisherArticleId", article);
      continue;
    }

    const articleData = await client.getArticle({
      url: article.url,
      title: article.title || "",
      imagePath: article.imagePath,
      publisherArticleId: article.publisherArticleId.toString(),
    });

    await storage.saveArticle({
      ...articleData,
      paragraphs: JSON.stringify(articleData.paragraphs),
      searchResultId: article.id,
      publisherArticleId: article.publisherArticleId,
      title: article.title,
    });
  }

  await browser.close();
};

fetchLatestArticles();
