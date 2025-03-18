import { afterAll, assert, beforeAll, describe, expect, it } from "vitest";
import { ConnectResult, PageWithCursor } from "puppeteer-real-browser";
import { getBrowser } from "@/clients/BrowserFactory";
import { i18n } from "@/consts/i18n";
import { AhramClient } from "@/clients/AhramClient";
import { SearchResult } from "@/clients/PublisherPage";

describe("Check AhramClient date helpers", async () => {
  it("Should return valid date for for PM", () => {
    const dateString = "30-5-2024 | 22:08";

    const date = AhramClient.parseDate(dateString);

    expect(date).toEqual(new Date("2024-05-30T22:08:00.000Z"));
  });

  it("Should return valid date for for AM", () => {
    const dateString = "30-5-2024 | 10:08";

    const date = AhramClient.parseDate(dateString);

    expect(date).toEqual(new Date("2024-05-30T10:08:00.000Z"));
  });
});

describe("Check AhramClient scraper", async () => {
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

  it("Ensures search page results returns valid number of records", async () => {
    const client = new AhramClient(page);
    const result = await client.getSearchResult(i18n.renaissanceDam);

    // number per page has to be configured in client code
    expect(result.length).toBe(20);
  });

  it("Ensures article is parsed correctly", async () => {
    const searchResult: SearchResult = {
      url: "https://gate.ahram.org.eg/News/4815678.aspx",
      title:
        "عضو بالشيوخ: كلمة الرئيس السيسي في المنتدى العربي الصيني وضعت النقاط فوق الحروف في الأزمة الراهنة بغزة",
      imagePath: null,
      publisherArticleId: "4815678",
    };

    const client = new AhramClient(page);
    const article = await client.getArticle(searchResult);

    assert(article);

    expect(article.paragraphs.length).toBe(4);
    expect(article.publishDate).toBe("2024-05-30T22:08:00.000Z");
    expect(article.author).toBe("محمد الإشعابي");
  });
});
