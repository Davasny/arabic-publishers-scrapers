import { StorageProvider } from "@/storage/StorageProvider";
import { writeFileSync } from "fs";
import { ArticleInsert } from "@/storage/schema";

const getArticleParagraphs = (article: ArticleInsert): string => {
  if (typeof article.paragraphs === "string") {
    return JSON.parse(article.paragraphs).join("\n");
  }

  return "";
};

const main = async () => {
  const storage = new StorageProvider();

  const startDate = new Date("2021-01-01");
  const endDate = new Date("2024-12-31");

  const articles = await storage.getArticles({
    startDate,
    endDate,
  });

  const filePath = "articles-all.txt";
  const lines = articles.map(getArticleParagraphs).join("\n");
  writeFileSync(filePath, lines, "utf-8");

  console.log(`Articles saved to ${filePath}`);

  // --- create file per publisher --- #

  const publishers = await storage.getAvailablePublishers();
  console.log("Available publishers:", publishers);

  for (const publisher of publishers) {
    const publisherArticles = await storage.getArticles({
      startDate,
      endDate,
      publisherName: publisher,
    });

    const publisherLines = publisherArticles
      .map(getArticleParagraphs)
      .join("\n");

    const filePath = `articles-${publisher}.txt`;
    console.log(`Saving publisher file: ${filePath}`);
    writeFileSync(filePath, publisherLines, "utf-8");
  }
};

main();
