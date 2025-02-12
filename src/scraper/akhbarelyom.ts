import { PageWithCursor } from "puppeteer-real-browser";
import { Article, PublisherPage, SearchResult } from "./publisherPage";
import { arabicMonths } from "../search/consts";

export function convertArabicDateToJSDate(arabicDateString: string) {
  // Extract the Arabic month and replace it with English
  let regex = /(\d{1,2}) (\p{L}+) (\d{4}) - (\d{2}):(\d{2}) (\p{L}+)/u;
  let match = arabicDateString.match(regex);

  if (!match) {
    console.error("Invalid date format");
    return null;
  }

  let [, day, arabicMonth, year, hours, minutes, period] = match;

  // Convert Arabic month to English
  let englishMonth = arabicMonths[arabicMonth as keyof typeof arabicMonths];

  if (!englishMonth) {
    console.error("Unknown Arabic month:", arabicMonth);
    return null;
  }

  // Convert 12-hour format to 24-hour format
  if (period === "م") {
    // مساء (PM)
    hours = `${parseInt(hours, 10) + (hours !== "12" ? 12 : 0)}`;
  } else if (period === "ص") {
    // صباحًا (AM)
    hours = hours === "12" ? "00" : hours;
  }

  // Create a new Date object
  let dateString = `${year} ${englishMonth} ${day} ${hours}:${minutes}:00`;
  return new Date(dateString);
}

export class AkhbarElyom extends PublisherPage {
  private readonly url = "https://akhbarelyom.com";

  constructor(page: PageWithCursor) {
    super(page);
  }

  private prepareQuery(query: string): string {
    return query.replace(" ", "+");
  }

  async acceptGoogleConsent() {
    await this.page.waitForNetworkIdle();
    await this.page.waitForSelector('button[aria-label="Consent"]');
    await this.page.click('button[aria-label="Consent"]');
  }

  async getSearchResult(query: string): Promise<SearchResult[]> {
    const queryString = this.prepareQuery(query);
    await this.page.goto(
      `${this.url}/News/Search/1?JournalID=1&query=${queryString}`,
    );

    await this.acceptGoogleConsent();

    // scroll to bottom
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // load more results
    await this.page.waitForSelector('.more-btn input[type="submit"]');
    await this.page.click('.more-btn input[type="submit"]');
    await this.page.waitForNetworkIdle();

    // scroll to bottom
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

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
        };

        return article;
      }),
    );

    return linkData.filter((link) => link !== null);
  }

  async getArticle(searchResult: SearchResult): Promise<Article> {
    await this.page.goto(searchResult.url);

    const publishedTime = await this.page.evaluate(() => {
      const metaTag = document.querySelector(
        'meta[property="article:published_time"]',
      );

      return metaTag ? metaTag.getAttribute("content") : null;
    });

    if (!publishedTime) {
      throw new Error("Published time not found");
    }

    const publishedTimeParsed = convertArabicDateToJSDate(publishedTime);

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
}
