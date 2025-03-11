import { Article, PublisherPage, SearchResult } from "@/clients/PublisherPage";
import { PageWithCursor } from "puppeteer-real-browser";

export class Dostor extends PublisherPage {
  private readonly url = "https://www.dostor.org";

  constructor(page: PageWithCursor) {
    super(page);
  }

  async getSearchResult(query: string, page = 1): Promise<SearchResult[]> {
    await this.goto(`${this.url}/search/term?page=${page}&w=${query}`);

    const mainContent = await this.page.$(".right-col");

    if (!mainContent) {
      throw new Error(".right-col class not found");
    }

    const foundArticles = await mainContent.$$(".cont .item-li.lg");
    // articles with shown author have a different class and are nested
    const foundArticlesWithAuthor = await mainContent.$$(".cont .item-article");

    const newsData = await Promise.all(
      [...foundArticles, ...foundArticlesWithAuthor].map(async (article) => {
        const link = await article.$("a");
        if (!link) return null;

        const href = await link.evaluate((el) => el.href);

        const title = await article.$("h3");
        if (!title) return null;

        const titleText = await title.evaluate((el) => el.innerText.trim());

        const publisherArticleId = href.replace("/", "");

        const image = await article.$("img");
        const imagePath = image ? await image.evaluate((el) => el.src) : null;

        const searchResult: SearchResult = {
          url: href,
          title: titleText,
          publisherArticleId: publisherArticleId,
          imagePath: imagePath,
        };

        return searchResult;
      }),
    );

    return newsData.filter((news) => news !== null);
  }

  async getArticle(searchResult: SearchResult): Promise<Article> {
    await this.goto(searchResult.url);

    const articleBlock = await this.page.$(".block.news-article .cont");

    const title = await articleBlock?.$("h1");

    // await new Promise((resolve) => setTimeout(resolve, 10_000));

    if (!title) {
      throw new Error("Title not found");
    }

    const publishDate = await articleBlock?.$(".publish time span");

    if (!publishDate) {
      throw new Error("Publish date not found");
    }

    const publishDateString = await publishDate.evaluate((el) =>
      el.innerText.trim(),
    );
    const publishDateObject = new Date(`${publishDateString} UTC`);

    const titleText = await title.evaluate((el) => el.innerText.trim());

    const articleParagraphsElements = await articleBlock?.$$(
      ".paragraph-list > *",
    );

    if (!articleParagraphsElements) {
      throw new Error("Paragraphs not found");
    }

    const paragraphs: (string | null)[] = await Promise.all(
      articleParagraphsElements.map((p) =>
        p.evaluate((el) => el.textContent?.trim() || null),
      ),
    );

    let author = null;
    const authorElement = await articleBlock?.$(".article-author .name");
    if (authorElement) {
      author = await authorElement.evaluate(
        (el) => el.textContent?.trim() || null,
      );
    }

    const article: Article = {
      url: searchResult.url,
      author: author,
      publishDate: publishDateObject.toISOString(),
      paragraphs: paragraphs.filter((p) => p !== null),
      title: titleText,
    };

    return article;
  }

  static convertArabicDateToJSDate(dateString: string): Date {
    // Expected format: "الجمعة 31/01/2025 07:23 م"
    // Split by space to extract parts.
    const parts = dateString.trim().split(" ");
    if (parts.length < 4) {
      throw new Error("Invalid date string format");
    }

    // parts[0] is the day name (ignored), parts[1] is the date, parts[2] is the time, and parts[3] is the meridiem ("م" for PM, "ص" for AM)
    const datePart = parts[1]; // e.g., "31/01/2025"
    const timePart = parts[2]; // e.g., "07:23"
    const meridiem = parts[3]; // e.g., "م"

    // Parse date parts (assumes format dd/mm/yyyy)
    const [dayStr, monthStr, yearStr] = datePart.split("/");
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10) - 1; // JavaScript Date months are 0-indexed
    const year = parseInt(yearStr, 10);

    // Parse time parts (assumes format hh:mm)
    let [hourStr, minuteStr] = timePart.split(":");
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    // Adjust hours based on the meridiem.
    // Arabic "م" stands for مساء (PM) and "ص" stands for صباح (AM).
    if (meridiem === "م") {
      // PM
      if (hour < 12) {
        hour += 12;
      }
    } else if (meridiem === "ص") {
      // AM
      if (hour === 12) {
        hour = 0;
      }
    } else {
      throw new Error("Unknown meridiem in date string");
    }

    // Create a UTC timestamp from the parsed values.
    const utcTimestamp = Date.UTC(year, month, day, hour, minute);
    return new Date(utcTimestamp);
  }
}
