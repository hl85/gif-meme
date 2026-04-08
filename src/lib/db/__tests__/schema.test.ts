import { expect, test, describe } from "vitest";
import { users, favorites } from "../schema";
import { getTableConfig } from "drizzle-orm/sqlite-core";

describe("Database Schema", () => {
  test("users table has correct columns", () => {
    const config = getTableConfig(users);
    const columnNames = config.columns.map((c) => c.name);

    expect(columnNames).toContain("id");
    expect(columnNames).toContain("email");
    expect(columnNames).toContain("name");
    expect(columnNames).toContain("avatar_url");
    expect(columnNames).toContain("google_id");
    expect(columnNames).toContain("created_at");
  });

  test("favorites table has correct columns", () => {
    const config = getTableConfig(favorites);
    const columnNames = config.columns.map((c) => c.name);

    expect(columnNames).toContain("id");
    expect(columnNames).toContain("user_id");
    expect(columnNames).toContain("item_type");
    expect(columnNames).toContain("item_id");
    expect(columnNames).toContain("item_title");
    expect(columnNames).toContain("item_url");
    expect(columnNames).toContain("item_preview_url");
    expect(columnNames).toContain("created_at");
  });

  test("favorites table has composite unique constraint", () => {
    const config = getTableConfig(favorites);
    const indexes = config.indexes;
    
    const uniqueIndex = indexes.find(idx => idx.config.name === "favorites_user_item_unique");
    expect(uniqueIndex).toBeDefined();
    expect(uniqueIndex?.config.unique).toBe(true);
  });
});
