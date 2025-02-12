export type BingNewsApiQueryParams = {
  /**
   * A 2-character country code of the country where the results come from.
   * Mutually exclusive with the `mkt` parameter.
   * Example: 'US', 'FR'.
   */
  cc?: string;

  /**
   * The category of news articles to return, e.g., 'Sports', 'Entertainment'.
   * Only used with the /news endpoint.
   */
  category?: string;

  /**
   * The number of news articles to return in the response.
   * Default: 10. Maximum: 100.
   */
  count?: number;

  /**
   * Filter news articles by age.
   * Allowed values: 'Day' | 'Week' | 'Month'.
   */
  freshness?: "Day" | "Week" | "Month";

  /**
   * The market where the results come from, in the form `<language>-<country/region>`.
   * Example: 'en-US', 'fr-FR'.
   * Mutually exclusive with the `cc` parameter.
   */
  mkt?: string;

  /**
   * The zero-based offset for pagination.
   * Use with `count` to manage pagination.
   */
  offset?: number;

  /**
   * A Boolean indicating whether to include the original image URL (contentUrl).
   * Default: false.
   */
  originalImg?: boolean;

  /**
   * The user's search query term.
   * Required for the /news/search endpoint.
   */
  q: string;

  /**
   * Filter news articles for adult content.
   * Allowed values: 'Off' | 'Moderate' | 'Strict'.
   * Default: 'Moderate'.
   */
  safeSearch?: "Off" | "Moderate" | "Strict";

  /**
   * The language for user interface strings.
   * Example: 'en', 'en-US', 'fr-CA'.
   */
  setLang?: string;

  /**
   * The UNIX epoch time (timestamp) to filter trending topics.
   * Requires `sortBy` to be set to 'Date'.
   */
  since?: number;

  /**
   * The order to return news topics in.
   * Allowed values: 'Date' | 'Relevance'.
   */
  sortBy?: "Date" | "Relevance";

  /**
   * A Boolean indicating whether to include text decoration markers.
   * Default: false.
   */
  textDecorations?: boolean;

  /**
   * The type of markers to use for text decorations.
   * Allowed values: 'Raw' | 'HTML'.
   * Default: 'Raw'.
   */
  textFormat?: "Raw" | "HTML";
};
