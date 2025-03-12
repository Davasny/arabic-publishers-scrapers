import { StorageProvider } from "@/storage/StorageProvider";
import { writeFileSync } from "fs";

const main = async () => {
  const storage = new StorageProvider();

  const articles = await storage.getAllArticles();

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
