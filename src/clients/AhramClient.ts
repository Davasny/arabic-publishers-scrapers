import { Article, PublisherPage, SearchResult } from "@/clients/PublisherPage";
import { PageWithCursor } from "puppeteer-real-browser";

export class AhramClient extends PublisherPage {
  private readonly url = "https://gate.ahram.org.eg";

  constructor(page: PageWithCursor) {
    super(page);
  }

  async getSearchResult(
    query: string,
    pageNumber = 1,
  ): Promise<SearchResult[]> {
    const parsedQuery = query.replace(" ", "-");
    const perPage = 20;

    await this.goto(
      `${this.url}/Search/${query}.aspx?StartRowIndex=${pageNumber * perPage}`,
      {
        waitUntil: "domcontentloaded",
      },
    );

    const searchResults = await this.page.$$(
      "#search > div > div > div > div.col-lg-9.p-right.nopadding-mob > div:nth-child(4) > div",
    );

    const newsData = await Promise.all(
      searchResults.map(async (news) => {
        const linkElement = await news.$("a");

        if (!linkElement) return null;

        const url = await linkElement.evaluate((el) => el.href);
        const title = await linkElement.evaluate((el) => el.innerText.trim());

        if (!url || !title) {
          return null;
        }

        const searchResult: SearchResult = {
          url,
          title,
          imagePath: null,
          publisherArticleId: AhramClient.extractIdFromUrl(url),
        };

        return searchResult;
      }),
    );

    return newsData.filter((news) => news !== null);
  }

  async getArticle(searchResult: SearchResult): Promise<Article | null> {
    await this.goto(searchResult.url);

    const publishDateContainer = await this.page.$(
      "#ContentPlaceHolder1_divdate > span",
    );

    const publishDateText = await publishDateContainer?.evaluate(
      (publishDate) => publishDate.innerText,
    );

    if (!publishDateText) {
      throw new Error("Publish date not found");
    }

    const authorElement = await this.page.$("#ContentPlaceHolder1_spnSource");
    const author = await authorElement?.evaluate((a) => a.textContent?.trim());

    const articleParagraphsElements = await this.page.$$(
      "#ContentPlaceHolder1_divContent > p:not(.st-inarticle-paragraph)",
    );

    if (!articleParagraphsElements) {
      throw new Error("Paragraphs not found");
    }

    const paragraphs: (string | null)[] = await Promise.all(
      articleParagraphsElements.map((p) =>
        p.evaluate((el) => el.textContent?.trim() || null),
      ),
    );

    const article: Article = {
      url: searchResult.url,
      author: author || null,
      publishDate: AhramClient.parseDate(publishDateText).toISOString(),
      paragraphs: paragraphs.filter((p) => p !== null),
      title: searchResult.title,
    };

    return article;
  }

  static extractIdFromUrl(url: string): string | null {
    const regex = /\/News\/(\d+)\.aspx/;
    const match = url.match(regex);

    // Return the captured group (the ID) if found, otherwise null
    return match ? match[1] : null;
  }

  static parseDate(dateString: string): Date {
    // Regular expression to match "day-month-year | hour:minute"
    const regex = /^(\d{1,2})-(\d{1,2})-(\d{4})\s*\|\s*(\d{1,2}):(\d{2})$/;
    const match = dateString.match(regex);

    if (!match) {
      throw new Error("Invalid date string format");
    }

    // Extracting values from regex groups
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10); // month in JavaScript Date is 0-indexed
    const year = parseInt(match[3], 10);
    const hour = parseInt(match[4], 10);
    const minute = parseInt(match[5], 10);

    // Create a Date object in UTC
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
    return utcDate;
  }
}
