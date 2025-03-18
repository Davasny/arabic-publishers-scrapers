# arabic publishers scrapers

This repository contains set of scrapers for arabic publishers websites. Currently supported are:

- [Al-Ahram (الأهرام)](https://gate.ahram.org.eg/)
- [Akhbar El-Yom (أخبار اليوم)](https://akhbarelyom.com/)
- [Al-Masry Al-Youm (المصري اليوم)](https://www.almasryalyoum.com/)
- [Al-Dostor (الدستور)](https://www.dostor.org/)

## Installation

```bash
pnpm install

# generate empty database
drizzle-kit push
```

## Usage

All my usages are saved in [src/cli](./src/cli) directory. I'm not providing any single point of entry for this
project as if you need to use this project for some reason, you should first understand how does it work and what
consequences it may have.

## Helpful commands

```bash
# run in-browser drizzle studio and see whats in the database
drizzle-kit studio

# create new migration after changing the schema.ts
drizzle-kit generate

# apply migrations
drizzle-kit push
```

## Testing

```bash
pnpm test
```
