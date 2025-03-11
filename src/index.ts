import { GERD } from "./search/i18n";
import { AkhbarElyom } from "@/clients/AkhbarElyom";
import { getBrowser } from "@/clients/BrowserFactory";

const main = async () => {
  const { page } = await getBrowser({});

  const ae = new AkhbarElyom(page);
  const results = await ae.getSearchResult(GERD.fullNameArabic);

  console.log(`Opening ${results[0].url}`);

  await page.goto(results[0].url);

  console.log("Done");
};

main();
