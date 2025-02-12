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
  constructor(readonly page: PageWithCursor) {}

  abstract getSearchResult(query: string): Promise<SearchResult[]>;

  abstract getArticle(searchResult: SearchResult): Promise<Article>;
}
