import { afterAll, assert, beforeAll, describe, expect, it } from "vitest";
import { PageWithCursor, ConnectResult } from "puppeteer-real-browser";
import { AlmasryAlyoumClient } from "./AlmasryAlyoumClient";
import { GERD } from "@/search/i18n";
import { SearchResult } from "./PublisherPage";
import { getBrowser } from "./BrowserFactory";

describe("Check AlmasryAlyoumClient helpers", () => {
  it("Checks if date string is parsed correctly PM", () => {
    const result = AlmasryAlyoumClient.convertStringToDate(
      "12/10/2024 3:29:39 PM",
    );
    expect(result).toEqual(new Date("2024-12-10T15:29:39.000Z"));
  });

  it("Checks if date string is parsed correctly AM", () => {
    const result = AlmasryAlyoumClient.convertStringToDate(
      "5/20/2023 2:17:02 AM",
    );
    expect(result).toEqual(new Date("2023-05-20T02:17:02.000Z"));
  });
});

describe("Check AlmasryAlyoumClient scraper", async () => {
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

  it("Checks if search page is parsed correctly", async () => {
    const aa = new AlmasryAlyoumClient(page);
    const searchResults = await aa.getSearchResult(GERD.fullNameArabic);

    expect(searchResults.length).toBe(12);

    const ids = searchResults.map((s) => s.publisherArticleId);
    expect(ids).not.toContain(null);
  });

  it("Checks if article page is parsed correctly", async () => {
    const aa = new AlmasryAlyoumClient(page);

    const searchResult: SearchResult = {
      imagePath:
        "https://mediaaws.almasryalyoum.com/news/small/2024/09/01/2475851_0.jpg",
      title: "هل بدأت إثيوبيا بتفريغ سد النهضة؟.. عباس شراقي يوضح",
      url: "https://www.almasryalyoum.com/news/details/3326339",
      publisherArticleId: "3326339",
    };

    const article = await aa.getArticle(searchResult);

    assert(article);

    expect(article.author).toBe("بسام رمضان");
    expect(article.paragraphs.length).toBe(9);
    expect(article.publishDate).toBe("2024-12-10T15:29:39.000Z");
  });

  it("Checks if article page is parsed correctly 2", async () => {
    const aa = new AlmasryAlyoumClient(page);

    const searchResult: SearchResult = {
      imagePath:
        "https://mediaaws.almasryalyoum.com/news/small/2025/02/03/2598095_0.jpeg",
      title:
        "«سياسي أم فني؟».. وزير الري يكشف الهدف من إنشاء أثيوبيا لسد النهضة (فيديو)",
      url: "https://www.almasryalyoum.com/news/details/3386277",
      publisherArticleId: "3386277",
    };

    const article = await aa.getArticle(searchResult);

    assert(article);

    expect(article.author).toBe("بشري عبدالمؤمن");
    expect(article.paragraphs.length).toBe(3);
    expect(article.publishDate).toBe("2025-02-25T02:36:42.000Z");
  });
});
