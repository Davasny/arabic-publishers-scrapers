import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AkhbarElyomClient } from "./AkhbarElyomClient";
import { ConnectResult, PageWithCursor } from "puppeteer-real-browser";
import { SearchResult } from "./PublisherPage";
import { getBrowser } from "./BrowserFactory";
import { i18n } from "@/consts/i18n";

describe("Check AkhbarElyomClient date helper", () => {
  it("Should return valid date for for PM", () => {
    const arabicDate = "الثلاثاء، 31 ديسمبر 2024 - 11:59 م";
    const convertedDate =
      AkhbarElyomClient.convertArabicDateToJSDate(arabicDate);

    expect(convertedDate).toEqual(new Date("2024-12-31T23:59:00.000Z"));
  });

  it("Should return valid date for for AM", () => {
    const arabicDate = "السبت، 01 يناير 2000 - 01:01 ص";
    const convertedDate =
      AkhbarElyomClient.convertArabicDateToJSDate(arabicDate);

    expect(convertedDate).toEqual(new Date("2000-01-01T01:01:00.000Z"));
  });
});

describe("Check AkhbarElyomClient scraper", async () => {
  let page: PageWithCursor;
  let browser: ConnectResult["browser"];

  beforeAll(async () => {
    const result = await getBrowser({});

    page = result.page;
    browser = result.browser;
  });

  afterAll(async () => {
    await browser.close();
  });

  it("Checks if first search result is returned", async () => {
    const ae = new AkhbarElyomClient(page);
    const result = await ae.getFirstResult(i18n.fullNameArabic);

    expect(result.title).toBeDefined();
    expect(result.url).toBeDefined();
  });

  it("Checks if search pagination endpoint returns proper results", async () => {
    const ae = new AkhbarElyomClient(page);

    const firstSearchResult: SearchResult = {
      url: "https://akhbarelyom.com/news/newdetails/4020261/1/8-%D8%AA%D8%AD%D8%AF%D9%8A%D8%A7%D8%AA-%D8%A3%D9%85%D8%A7%D9%85-%D8%A7%D9%84%D8%B1%D8%A6%D8%A7%D8%B3%D8%A9-%D8%A7%D9%84%D8%AC%D8%AF%D9%8A%D8%AF%D8%A9-%D9%84%D9%84%D8%A7%D8%AA%D8%AD%D8%A7%D8%AF-%D8%A7%D9%84",
      title: "8 تحديات أمام الرئاسة الجديدة للاتحاد الإفريقى",
      imagePath:
        "https://images.akhbarelyom.com/images/images/medium/20230217182616529.jpg",
      publisherArticleId: "4020261",
    };

    const result = await ae.getSearchPage(
      i18n.fullNameArabic,
      firstSearchResult.publisherArticleId,
    );

    expect(result.length).toBe(6);
  });

  it("Checks if getSearchResult returns valid non-duplicated results", async () => {
    const ae = new AkhbarElyomClient(page);
    const results = await ae.getSearchResult(i18n.fullNameArabic);

    expect(results.length).toBeGreaterThan(1);
    const firstResult = results[0];
    const secondResult = results[1];

    expect(firstResult.title).not.toEqual(secondResult.title);
  });

  it("Checks if article is parsed correctly", async () => {
    const ae = new AkhbarElyomClient(page);
    const searchResult: SearchResult = {
      url: "https://akhbarelyom.com/news/newdetails/3878112/1/محمد-بركات-يكتب-السد-الإثيوبى",
      title: "محمد بركات يكتب: السد الإثيوبى",
      imagePath: null,
      publisherArticleId: null,
    };

    const article = await ae.getArticle(searchResult);

    expect(article.publishDate).toEqual("2022-09-12T18:09:00.000Z");
    expect(article.author).toEqual("محمد بركات");
    expect(article.paragraphs.length).toEqual(7);
  });
});
