import { PageWithCursor } from "puppeteer-real-browser";

export interface SearchResult {
  url: string;
  title: string;
  imagePath: string | null;
}

export interface Article {
  url: string;
  paragraphs: string[];
  publishDate: string;
  author: string;
}

export abstract class PublisherPage {
  constructor(readonly page: PageWithCursor) {
  }

  abstract getSearchResult(query: string): Promise<SearchResult[]>;

  abstract getArticle(searchResult: SearchResult): Promise<Article>;

  async acceptGoogleConsent() {
    const possibleSelectors = [
      'button[aria-label="Consent"]',
      'button.fc-button-label',
    ]

    for (const selector of possibleSelectors) {
      console.log(`Checking consent button for: ${selector}`)
      try {
        let consentButton = await this.page.waitForSelector(selector, {timeout: 2_000});

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
