import baseWretch, { Wretch } from "wretch";
import QueryStringAddon from "wretch/addons/queryString";
import { BingNewsApiQueryParams } from "./queryTypes";
import { SearchResponse } from "./responseTypes";
import { CAIRO_COORDS } from "../consts";
import { GERD } from "../i18n";

export class BingClient {
  private readonly client: Wretch;

  constructor() {
    const BING_API_KEY = process.env.BING_API_KEY;
    if (!BING_API_KEY) {
      throw new Error("BING_API_KEY not set");
    }

    this.client = baseWretch(
      "https://api.bing.microsoft.com/v7.0/news/search",
    ).headers({
      "Ocp-Apim-Subscription-Key": BING_API_KEY,
      "X-MSEdge-ClientID": "1",
      "X-Search-Location": `lat:${CAIRO_COORDS.lat};long:${CAIRO_COORDS.long};re:5000`,
    });
  }

  async getNews() {
    const perPage = 100;

    const query = `${GERD.fullNameArabic}`;

    const params: BingNewsApiQueryParams = {
      q: query,
      sortBy: "Relevance",
      count: perPage,
      offset: 800,
      setLang: "en",
    };

    return await this.client
      .addon(QueryStringAddon)
      .query(params)
      .get()
      .json<SearchResponse>();
  }
}
