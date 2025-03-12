ALTER TABLE `search_results` ADD `lastScrapeTimestamp` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `articles_searchResultId_unique` ON `articles` (`searchResultId`);