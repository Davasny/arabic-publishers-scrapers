import { BingClient } from "./bing/bingClient";
import fs from "fs";
import path from "path";
import "dotenv/config";

const main = async () => {
  const bing = new BingClient();

  try {
    const result = await bing.getNews();

    // Get the current timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    // Define the downloads directory
    const downloadsDir = path.join(__dirname, "downloads");

    // Check if the downloads directory exists, if not, create it
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    // Define the file path with the current timestamp
    const filePath = path.join(downloadsDir, `${timestamp}.json`);

    // Dump the result into the JSON file
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2), "utf-8");

    console.log(`File saved successfully to ${filePath}`);
  } catch (error) {
    console.error("An error occurred:", error);
  }
};

main();
