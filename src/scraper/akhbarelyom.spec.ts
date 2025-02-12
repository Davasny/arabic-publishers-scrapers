import { afterAll, describe, expect, it } from "vitest";
import { AkhbarElyom, convertArabicDateToJSDate } from "./akhbarelyom";
import { connect } from "puppeteer-real-browser";
import { SearchResult } from "./publisherPage";

describe("Check AkhbarElyom date helper", () => {
  it("Should return valid date for for PM", () => {
    const arabicDate = "الثلاثاء، 31 ديسمبر 2024 - 11:59 م";
    const convertedDate = convertArabicDateToJSDate(arabicDate);

    expect(convertedDate).toEqual(new Date("2024-12-31T23:59:00.000Z"));
  });

  it("Should return valid date for for AM", () => {
    const arabicDate = "السبت، 01 يناير 2000 - 01:01 ص";
    const convertedDate = convertArabicDateToJSDate(arabicDate);

    expect(convertedDate).toEqual(new Date("2000-01-01T01:01:00.000Z"));
  });
});

describe("Check AkhbarElyom scraper", async () => {
  const { page, browser } = await connect({
    headless: false,
    turnstile: true,
  });

  afterAll(async () => {
    await browser.close();
  }, 30_000);

  it("Checks if article is parsed correctly", async () => {
    const ae = new AkhbarElyom(page);
    const searchResult: SearchResult = {
      url: "https://akhbarelyom.com/news/newdetails/3878112/1/محمد-بركات-يكتب-السد-الإثيوبى",
      title: "محمد بركات يكتب: السد الإثيوبى",
      imagePath: null,
    };

    const article = await ae.getArticle(searchResult);

    expect(article.publishDate).toEqual("2022-09-12T16:09:00.000Z");
    expect(article.author).toEqual("محمد بركات");
    expect(article.paragraphs.length).toEqual(7);
  });
});
