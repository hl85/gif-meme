import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  googleId: text("google_id").unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    label: text("label").notNull(),
    searchQuery: text("search_query"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    seoKeywords: text("seo_keywords"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: integer("is_active").notNull().default(1),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    unq: uniqueIndex("categories_slug_unique").on(table.slug),
  })
);

export const categoryCards = sqliteTable(
  "category_cards",
  {
    id: text("id").primaryKey(),
    categorySlug: text("category_slug")
      .notNull()
      .references(() => categories.slug, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    imageUrl: text("image_url").notNull(),
    imageName: text("image_name"),
    linkUrl: text("link_url"),
    isActive: integer("is_active").notNull().default(1),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    unq: uniqueIndex("category_cards_slug_position_unique").on(
      table.categorySlug,
      table.position
    ),
  })
);

export const favorites = sqliteTable(
  "favorites",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemType: text("item_type", { enum: ["gif", "sticker"] }).notNull(),
    itemId: text("item_id").notNull(),
    itemTitle: text("item_title"),
    itemUrl: text("item_url"),
    itemPreviewUrl: text("item_preview_url"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    unq: uniqueIndex("favorites_user_item_unique").on(
      table.userId,
      table.itemType,
      table.itemId
    ),
  })
);
