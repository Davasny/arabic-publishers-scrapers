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

  // todo: implement pagination
  async getSearchResult(query: string): Promise<SearchResult[]> {
    const queryString = this.prepareQuery(query);
    await this.goto(
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
