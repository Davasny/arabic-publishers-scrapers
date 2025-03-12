import { Article, PublisherPage, SearchResult } from "./PublisherPage";
import { PageWithCursor } from "puppeteer-real-browser";

export class AlmasryAlyoumClient extends PublisherPage {
  private readonly url = "https://www.almasryalyoum.com";

  constructor(page: PageWithCursor) {
    super(page);
  }

  async getSearchResult(
    query: string,
    pageNumber = 1,
  ): Promise<SearchResult[]> {
    await this.goto(
      `${this.url}/news/index?srchall=True&typeid=1&page=${pageNumber}&keyword=${query}`,
      { waitUntil: "domcontentloaded" },
    );

    const newsElements = await this.page.$$(".town_wrap .news");

    const newsData = await Promise.all(
      newsElements.map(async (news) => {
        const linkElement = await news.$("a");
        const imgElement = await news.$("img");
        const titleElement = await news.$("p");

        const url = linkElement
          ? await linkElement.evaluate((el) => el.href)
          : null;
        const imagePath = imgElement
          ? await imgElement.evaluate((el) => el.src)
          : null;
        const title = titleElement
          ? await titleElement.evaluate((el) => el.innerText.trim())
          : null;

        if (!url || !title) {
          return null;
        }

        const searchResult: SearchResult = {
          url,
          title,
          imagePath,
          // todo: check if AlmasryAlyoumClient has some way to extract id
          publisherArticleId: null,
        };

        return searchResult;
      }),
    );

    return newsData.filter((news) => news !== null);
  }

  async getArticle(searchResult: SearchResult): Promise<Article> {
    await this.goto(searchResult.url, { waitUntil: "domcontentloaded" });

    const jsonLdData = await this.page.evaluate(() => {
      const scriptTag = document.querySelector(
        'script[type="application/ld+json"]',
      );
      const content = scriptTag ? scriptTag.textContent : null;
      if (content) {
        return JSON.parse(content);
      }
      return null;
    });

    let author = null;
    if ("author" in jsonLdData && "name" in jsonLdData.author) {
      author = jsonLdData.author.name;
    }

    let publishDate = null;
    if ("datePublished" in jsonLdData) {
      publishDate = AlmasryAlyoumClient.convertStringToDate(
        jsonLdData.datePublished,
      );
    }

    const paragraphs = await this.page.evaluate(() => {
      const newsStory = document.querySelector("#NewsStory");
      if (!newsStory) return [];

      return (
        Array.from(newsStory.querySelectorAll("p"))
          .filter(
            (p) =>
              p.textContent?.trim() !== "" &&
              !p.classList.contains("min_related"),
          )
          // there is a lot of paragraphs in article but only article content has textAlign as inline style
          // otherwise paragraph with some video loading error is considered as valid paragraph
          .filter((p) => p.style.textAlign === "justify")
          .map((p) => p.textContent?.trim())
      );
    });

    return {
      url: searchResult.url,
      paragraphs: paragraphs.filter((p) => p !== undefined),
      publishDate: publishDate?.toISOString() ?? "",
      author: author,
    };
  }

  /**
   * 12/10/2024 3:29:39 PM -> Date object
   * */
  static convertStringToDate(dateString: string): Date {
    const dateTimeRegex =
      /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2}) (AM|PM)$/;
    const match = dateString.match(dateTimeRegex);

    if (!match) {
      throw new Error("Invalid date format");
    }

    let [, month, day, year, hours, minutes, seconds, meridian] = match;

    let monthNum = parseInt(month, 10) - 1;
    let dayNum = parseInt(day, 10);
    let yearNum = parseInt(year, 10);
    let hoursNum = parseInt(hours, 10);
    let minutesNum = parseInt(minutes, 10);
    let secondsNum = parseInt(seconds, 10);

    // Convert 12-hour format to 24-hour format
    if (meridian === "PM" && hoursNum !== 12) {
      hoursNum += 12;
    } else if (meridian === "AM" && hoursNum === 12) {
      hoursNum = 0;
    }

    // Create a Date object in UTC
    return new Date(
      Date.UTC(yearNum, monthNum, dayNum, hoursNum, minutesNum, secondsNum),
    );
  }
}
