import { connect } from "puppeteer-real-browser";
import { GERD } from "./search/i18n";
import { AkhbarElyom } from "./scraper/akhbarelyom";

const main = async () => {
  const { page } = await connect({
    headless: false,
    turnstile: true,
  });

  await page.setViewport({ width: 1024, height: 1024 });

  const ae = new AkhbarElyom(page);
  const results = await ae.getSearchResult(GERD.fullNameArabic);

  console.log(`Opening ${results[0].url}`);

  await page.goto(results[0].url);

  console.log("Done");
};

main();
