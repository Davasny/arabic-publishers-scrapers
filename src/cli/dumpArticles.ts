import { StorageProvider } from "@/storage/StorageProvider";
import { writeFileSync } from "fs";

const main = async () => {
  const storage = new StorageProvider();

  const articles = await storage.getArticles({
    startDate: new Date("2021-01-01"),
    endDate: new Date("2024-12-31"),
  });

  const fileLines: string[] = articles.flatMap((a) => {
    if (typeof a.paragraphs === "string") {
      return JSON.parse(a.paragraphs).join("\n");
    }

    return [];
  });

  const filePath = "articles.txt";

  writeFileSync(filePath, fileLines.join("\n"), "utf-8");

  console.log(`Articles saved to ${filePath}`);
};

main();
