import { PageWithCursor } from "puppeteer-real-browser";
import { Article, PublisherPage, SearchResult } from "./PublisherPage";
import { arabicMonths } from "@/search/consts";

export class AkhbarElyom extends PublisherPage {
  private readonly url = "https://akhbarelyom.com";

  constructor(page: PageWithCursor) {
    super(page);
  }

  private prepareQuery(query: string): string {
    return query.replace(" ", "+");
  }

  /**
   * Extracts id from /news/newdetails/4020261/1/8-تحديات-أمام-الرئاسة-الجديدة-للاتحاد-ال
   * */
  private getIdFromNewsUrl(url: string): string | null {
    // This regex looks for a pattern like "/news/newdetails/{id}/"
    const regex = /\/news\/newdetails\/(\d+)(\/|$)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  async getFirstResult(query: string): Promise<SearchResult> {
    const queryString = this.prepareQuery(query);
    await this.goto(
      `${this.url}/News/Search/1?JournalID=1&query=${queryString}`,
    );

    const firstSearchResult = await this.page.$(".entry-block-full");

    const titleElement = await firstSearchResult?.$("h3 a");
    const link = await titleElement?.evaluate((el) => el.href);
    const titleText = await titleElement?.evaluate((el) =>
      el.textContent?.trim(),
    );

    if (!link) {
      throw new Error("Title link not found");
    }

    if (!titleText) {
      throw new Error("Title text not found");
    }

    const image = await firstSearchResult?.$("img");
    const imageSrc = await image?.evaluate((i) => i.src);

    const publisherId = this.getIdFromNewsUrl(link);

    const firstItem: SearchResult = {
      url: link,
      title: titleText,
      imagePath: imageSrc || null,
      publisherArticleId: publisherId || null,
    };

    return firstItem;
  }

  async getSearchPage(
    query: string,
    lastKnownArticleId: SearchResult["publisherArticleId"],
  ): Promise<SearchResult[]> {
    const queryString = this.prepareQuery(query);

    // url found by clicking "load more" in search results
    await this.goto(
      `${this.url}/News/SearchPaging?JournalID=1&LastID=${lastKnownArticleId}&query=${queryString}&_=1739446961500`,
      { skipConsent: true }, // this endpoint doesn't load anything more than just simple html
    );

    const articleBlocks = await this.page.$$(".entry-block-small");

    const linkData = await Promise.all(
      articleBlocks.map(async (block) => {
        const image = await block.$(".entry-image img");
        const imageSrc = await image?.evaluate((el) => el.src);

        const link = await block.$(".entry-content a");
        const title = await link?.evaluate((el) => el.textContent?.trim());
        const href = await link?.evaluate((el) => el.href);

        if (!href || !title) {
          return null;
        }

        const article: SearchResult = {
          url: href,
          title: title,
          imagePath: imageSrc || null,
          publisherArticleId: this.getIdFromNewsUrl(href),
        };

        return article;
      }),
    );

    return linkData.filter((link) => link !== null);
  }

  async getSearchResult(query: string): Promise<SearchResult[]> {
    const firstResult = await this.getFirstResult(query);
    const results = await this.getSearchPage(
      query,
      firstResult.publisherArticleId,
    );

    // todo: iterate over pages
    // todo: find a way to decide about stopping the iteration

    return [firstResult, ...results];
  }

  async getArticle(searchResult: SearchResult): Promise<Article> {
    await this.goto(searchResult.url);

    const publishedTime = await this.page.evaluate(() => {
      const metaTag = document.querySelector(
        'meta[property="article:published_time"]',
      );

      return metaTag ? metaTag.getAttribute("content") : null;
    });

    if (!publishedTime) {
      throw new Error("Published time not found");
    }

    const publishedTimeParsed =
      AkhbarElyom.convertArabicDateToJSDate(publishedTime);

    if (!publishedTimeParsed) {
      throw new Error("Failed to parse published time");
    }

    const authorDiv = await this.page.$(".post-meta-author h5");
    const author = await authorDiv?.evaluate((el) => el.textContent?.trim());

    const paragraphs = await this.page.evaluate(() => {
      return Array.from(
        document.querySelectorAll(".entry-content.HtmlDecode p"),
      ).map((p) => {
        const text = p.textContent;
        if (!text) return "";
        return text.trim();
      });
    });

    const article: Article = {
      url: searchResult.url,
      author: author || "unknown",
      paragraphs: paragraphs,
      publishDate: publishedTimeParsed?.toISOString(),
    };

    return article;
  }

  static convertArabicDateToJSDate(arabicDateString: string) {
    // Extract the Arabic month and replace it with English
    let regex = /(\d{1,2}) (\p{L}+) (\d{4}) - (\d{2}):(\d{2}) (\p{L}+)/u;
    let match = arabicDateString.match(regex);

    if (!match) {
      console.error("Invalid date format");
      return null;
    }

    let [, day, arabicMonth, year, hours, minutes, meridian] = match;

    // Convert Arabic month to English
    let month = arabicMonths[arabicMonth as keyof typeof arabicMonths];

    if (!month) {
      console.error("Unknown Arabic month:", arabicMonth);
      return null;
    }

    let monthNum = month - 1;
    let dayNum = parseInt(day, 10);
    let yearNum = parseInt(year, 10);
    let hoursNum = parseInt(hours, 10);
    let minutesNum = parseInt(minutes, 10);
    let secondsNum = 0;

    // Convert 12-hour format to 24-hour format
    if (meridian === "م" && hoursNum !== 12) {
      hoursNum += 12;
    } else if (meridian === "ص" && hoursNum === 12) {
      hoursNum = 0;
    }

    // Create a new Date object
    return new Date(
      Date.UTC(yearNum, monthNum, dayNum, hoursNum, minutesNum, secondsNum),
    );
  }
}
