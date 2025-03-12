CREATE TABLE `articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`searchResultId` integer,
	`publisherArticleId` integer,
	`publishDate` text,
	`title` text,
	`paragraphs` text,
	`author` text,
	FOREIGN KEY (`searchResultId`) REFERENCES `search_results`(`id`) ON UPDATE no action ON DELETE no action
);
