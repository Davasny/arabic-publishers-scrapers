import { DostorClient } from "@/clients/DostorClient";
import { getBrowser } from "@/clients/BrowserFactory";
import { GERD } from "@/search/i18n";
import { StorageProvider } from "@/storage/StorageProvider";
import { SearchResultInsert } from "@/storage/schema";

const PUBLISHER_NAME = "Dostor";

const initialArticlesListFetch = async () => {
  const { page, browser } = await getBrowser({ openDevTools: false });
  const client = new DostorClient(page);
  const storage = new StorageProvider();

  let pageNum = 1;
  while (true) {
    const articles = await client.getSearchResult(GERD.renaissanceDam, pageNum);

    if (articles.length === 0) {
      console.log("No more articles found.");
      break;
    }

    const dbRows: SearchResultInsert[] = articles.map((result) => ({
      ...result,
      publisherName: PUBLISHER_NAME,
      publisherArticleId: parseInt(result.publisherArticleId || "-1"),
    }));

    console.log(`Saving ${dbRows.length} results`);
    await storage.saveSearchResult(dbRows);

    pageNum++;
  }

  await browser.close();
};

const fetchArticles = async () => {
  const { page, browser } = await getBrowser({ openDevTools: false });
  const storage = new StorageProvider();

  const toScrape =
    await storage.getSearchResultsWithoutArticles(PUBLISHER_NAME);

  if (!toScrape) {
    console.log("No articles to scrape");
    return;
  }

  const client = new DostorClient(page);

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

    try {
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

      const newTimeout = Math.max(client.typicalNetworkTimeout - 1_000, 1_000);

      if (client.typicalNetworkTimeout !== newTimeout) {
        console.log(`Decreasing network timeout to ${newTimeout / 1000}s`);
        client.typicalNetworkTimeout = newTimeout;
      }
    } catch (error) {
      const newTimeout = Math.min(client.typicalNetworkTimeout + 2_000, 7_000);

      console.error(
        `Error scraping article, increasing network idle timeout to ${newTimeout / 1000}s`,
      );

      client.typicalNetworkTimeout = newTimeout;

      console.error(error);
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    }
  }

  await browser.close();
};

fetchArticles();
