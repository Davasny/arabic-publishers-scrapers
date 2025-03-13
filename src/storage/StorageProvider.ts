import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import { and, asc, desc, eq, gte, isNull, lte } from "drizzle-orm";
import {
  ArticleInsert,
  articlesTable,
  SearchResultInsert,
  SearchResultSelect,
  searchResultsTable,
} from "@/storage/schema";

export class StorageProvider {
  private readonly db: LibSQLDatabase;

  constructor() {
    this.db = drizzle("file:storage.db");
  }

  async saveSearchResult(searchResult: SearchResultInsert[]): Promise<void> {
    await this.db
      .insert(searchResultsTable)
      .values(searchResult)
      .onConflictDoNothing();
  }

  async getArticles({
    startDate,
    endDate,
  }: {
    startDate: Date;
    endDate: Date;
  }): Promise<ArticleInsert[]> {
    return this.db
      .select()
      .from(articlesTable)
      .where(
        and(
          gte(articlesTable.publishDate, startDate.toISOString()),
          lte(articlesTable.publishDate, endDate.toISOString()),
        ),
      );
  }

  async getOldestSearchResult(
    publisherName: string,
  ): Promise<SearchResultSelect | null> {
    const result = await this.db
      .select()
      .from(searchResultsTable)
      .where(eq(searchResultsTable.publisherName, publisherName))
      .orderBy(desc(searchResultsTable.publisherArticleId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0];
  }

  async getNewestSearchResult(
    publisherName: string,
  ): Promise<SearchResultSelect | null> {
    const result = await this.db
      .select()
      .from(searchResultsTable)
      .where(eq(searchResultsTable.publisherName, publisherName))
      .orderBy(desc(searchResultsTable.publisherArticleId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0];
  }

  async saveArticle(article: ArticleInsert): Promise<void> {
    await this.db.insert(articlesTable).values(article).onConflictDoNothing();
  }

  async getSearchResultsWithoutArticles(
    publisherName: string,
  ): Promise<SearchResultSelect[] | null> {
    const results = await this.db
      .select()
      .from(searchResultsTable)
      .leftJoin(
        articlesTable,
        eq(searchResultsTable.id, articlesTable.searchResultId),
      )
      .where(
        and(
          eq(searchResultsTable.publisherName, publisherName),
          isNull(articlesTable.id),
          isNull(searchResultsTable.lastScrapeTimestamp),
        ),
      )
      .orderBy(asc(searchResultsTable.id));

    if (results.length === 0) {
      return null;
    }

    return results.map((result) => result.search_results);
  }

  async updateSearchResultTimestamp(searchResultId: number): Promise<void> {
    await this.db
      .update(searchResultsTable)
      .set({ lastScrapeTimestamp: Date.now() })
      .where(eq(searchResultsTable.id, searchResultId));
  }
}
