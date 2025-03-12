import { DostorClient } from "@/clients/DostorClient";
import { StorageProvider } from "@/storage/StorageProvider";
import { GERD } from "@/search/i18n";
import { SearchResultInsert } from "@/storage/schema";
import { AlmasryAlyoumClient } from "@/clients/AlmasryAlyoumClient";

export const initialArticlesListFetch = async (
  publisherName: string,
  client: DostorClient | AlmasryAlyoumClient,
) => {
  const storage = new StorageProvider();

  let pageNum = 1;
  while (true) {
    console.log(`Fetching page ${pageNum}`);
    const articles = await client.getSearchResult(GERD.renaissanceDam, pageNum);

    if (articles.length === 0) {
      console.log("No more articles found.");
      break;
    }

    const dbRows: SearchResultInsert[] = articles.map((result) => ({
      ...result,
      publisherName: publisherName,
      publisherArticleId: parseInt(result.publisherArticleId || "-1"),
    }));

    console.log(`Saving ${dbRows.length} results`);
    await storage.saveSearchResult(dbRows);

    pageNum++;
  }
};

export const fetchArticles = async (
  publisherName: string,
  client: DostorClient | AlmasryAlyoumClient,
) => {
  const storage = new StorageProvider();

  const toScrape = await storage.getSearchResultsWithoutArticles(publisherName);

  if (!toScrape) {
    console.log("No articles to scrape");
    return;
  }

  for (const article of toScrape) {
    console.log(`[${article.id}] Scraping article ${article.url}`);

    if (!article.url) {
      console.warn(`[${article.id}] Article has no URL`, article);
      continue;
    }

    if (!article.publisherArticleId) {
      console.warn(
        `[${article.id}] Article has no publisherArticleId`,
        article,
      );
      continue;
    }

    try {
      const articleData = await client.getArticle({
        url: article.url,
        title: article.title || "",
        imagePath: article.imagePath,
        publisherArticleId: article.publisherArticleId.toString(),
      });

      if (!articleData) {
        console.error(`[${article.id}] Article was invalid, skipping`);

        await storage.updateSearchResultTimestamp(article.id);

        continue;
      }

      await storage.saveArticle({
        ...articleData,
        paragraphs: JSON.stringify(articleData.paragraphs),
        searchResultId: article.id,
        publisherArticleId: article.publisherArticleId,
        title: article.title,
      });

      const newTimeout = Math.max(client.typicalNetworkTimeout - 1_000, 1_000);

      if (client.typicalNetworkTimeout !== newTimeout) {
        console.log(
          `[${article.id}] Decreasing network timeout to ${newTimeout / 1000}s`,
        );
        client.typicalNetworkTimeout = newTimeout;
      }
    } catch (error) {
      const newTimeout = Math.min(client.typicalNetworkTimeout + 2_000, 7_000);

      console.error(
        `[${article.id}] Error scraping article, increasing network idle timeout to ${newTimeout / 1000}s`,
      );

      client.typicalNetworkTimeout = newTimeout;

      console.error(error);
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    }
  }
};
