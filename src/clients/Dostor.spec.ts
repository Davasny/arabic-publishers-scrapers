import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ConnectResult, PageWithCursor } from "puppeteer-real-browser";
import { getBrowser } from "@/clients/BrowserFactory";
import { Dostor } from "@/clients/Dostor";
import { SearchResult } from "@/clients/PublisherPage";

describe("Check dostor helpers", () => {
  it("Checks date conversion PM", () => {
    const result = Dostor.convertArabicDateToJSDate(
      "الجمعة 31/01/2025 07:23 م",
    );
    expect(result).toEqual(new Date("2025-01-31T19:23:00.000Z"));
  });

  it("Checks date conversion AM", () => {
    const result = Dostor.convertArabicDateToJSDate(
      "الجمعة 31/01/2025 07:23 ص",
    );
    expect(result).toEqual(new Date("2025-01-31T07:23:00.000Z"));
  });
});

describe("Check Dostor scraper", async () => {
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

  it("Checks if getSearchResult returns valid data", async () => {
    const dostor = new Dostor(page);
    const result = await dostor.getSearchResult("الكبير"); // full name of GERD returns only few results

    expect(result.length).toBe(30);
  });

  it("Checks if scraper returns valid article without author", async () => {
    const dostor = new Dostor(page);

    const searchResult: SearchResult = {
      url: "https://www.dostor.org/4963336",
      title:
        "تعرف على الفئات المستثناة من دفع تذاكر الدخول للمتحف المصري الكبير",
      imagePath: null,
      publisherArticleId: "4963336",
    };

    const result = await dostor.getArticle(searchResult);

    expect(result.paragraphs.length).toBe(16);
    expect(result.publishDate).toBe("2025-02-12T17:51:30.000Z");
  });

  it("Checks if scraper returns valid article with author details", async () => {
    const dostor = new Dostor(page);

    const searchResult: SearchResult = {
      url: "https://www.dostor.org/4960728",
      title: "مشربية توماس جورجيسيان",
      imagePath: null,
      publisherArticleId: "4960728",
    };

    const result = await dostor.getArticle(searchResult);

    expect(result.author).toBe("إبراهيم داود");
    expect(result.publishDate).toBe("2025-02-10T19:57:09.000Z");
  });
});
