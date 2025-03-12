import * as t from "drizzle-orm/sqlite-core";
import { integer, sqliteTable, unique } from "drizzle-orm/sqlite-core";

export const searchResultsTable = sqliteTable(
  "search_results",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    publisherName: t.text(),
    url: t.text(),
    title: t.text(),
    imagePath: t.text(),
    publisherArticleId: t.integer(),
  },
  (t) => [unique().on(t.publisherName, t.publisherArticleId)],
);

export type SearchResultSelect = typeof searchResultsTable.$inferSelect;
export type SearchResultInsert = typeof searchResultsTable.$inferInsert;

export const articlesTable = sqliteTable("articles", {
  id: integer().primaryKey({ autoIncrement: true }),
  searchResultId: t
    .integer()
    .references(() => searchResultsTable.id)
    .unique(),
  publisherArticleId: t.integer(),
  publishDate: t.text(),
  title: t.text(),
  /**
   * JSON stringified array of paragraphs
   * */
  paragraphs: t.text(),
  author: t.text(),
});

export type ArticleSelect = typeof articlesTable.$inferSelect;
export type ArticleInsert = typeof articlesTable.$inferInsert;
