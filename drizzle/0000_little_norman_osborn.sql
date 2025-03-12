CREATE TABLE `search_results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`publisherName` text,
	`url` text,
	`title` text,
	`imagePath` text,
	`publisherArticleId` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `search_results_publisherName_publisherArticleId_unique` ON `search_results` (`publisherName`,`publisherArticleId`);