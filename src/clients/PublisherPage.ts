import { PageWithCursor } from "puppeteer-real-browser";
import { GoToOptions } from "rebrowser-puppeteer-core";

export interface SearchResult {
  url: string;
  title: string;
  imagePath: string | null;
  publisherArticleId: string | null;
}

export interface Article {
  url: string;
  // todo: implement title in AkhbarElyom and AlmasryAlyoum
  title?: string;
  paragraphs: string[];
  publishDate: string;
  author: string | null;
}

export abstract class PublisherPage {
  protected constructor(readonly page: PageWithCursor) {}

  abstract getSearchResult(query: string): Promise<SearchResult[]>;

  abstract getArticle(searchResult: SearchResult): Promise<Article>;

  async goto(url: string, options?: GoToOptions & { skipConsent?: boolean }) {
    const result = await this.page.goto(url, {
      ...options,
      waitUntil: "domcontentloaded",
    });

    // some pages have a lot of pending requests, there is no need to wait for them
    try {
      await this.page.waitForNetworkIdle({ timeout: 1_000 });
    } catch (e) {
      console.log("Network wasn't idle for more than 5s");
    }

    if (!options?.skipConsent) {
      await this.acceptGoogleConsent();
    }

    return result;
  }

  private async acceptGoogleConsent() {
    const cookies = await this.page.cookies();
    // FCCDCF is Google Consent cookie name
    const googleConsentCookie = cookies.find(
      (cookie) => cookie.name === "FCCDCF",
    );

    if (googleConsentCookie) {
      console.log("Consent already.");
      // If the cookie is found, assume consent is already given.
      return;
    }

    const possibleSelectors = [
      'button[aria-label="Consent"]',
      "button.fc-button-label",
    ];

    for (const selector of possibleSelectors) {
      console.log(`Checking consent button for: ${selector}`);
      try {
        let consentButton = await this.page.waitForSelector(selector, {
          timeout: 2_000,
        });

        // If the button is found, click it.
        if (consentButton) {
          await consentButton.click();
          console.log("Consent accepted.");
          return;
        }
      } catch (error) {
        // If the button is not found within 5 seconds, assume consent is not needed.
        console.log("Consent not needed, skipping...");
      }
    }
  }
}
