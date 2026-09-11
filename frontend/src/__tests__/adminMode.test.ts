import { describe, it, expect } from "vitest";
import { isAdminFromSearch } from "../adminMode";

describe("isAdminFromSearch", () => {
  it("admin パラメータが無ければ false", () => {
    expect(isAdminFromSearch("")).toBe(false);
    expect(isAdminFromSearch("?artist=kinggnu")).toBe(false);
  });

  it("?admin が付いていれば true（値なしでも可）", () => {
    expect(isAdminFromSearch("?admin")).toBe(true);
    expect(isAdminFromSearch("?admin=1")).toBe(true);
  });

  it("artist 選択と共存できる", () => {
    expect(isAdminFromSearch("?artist=kinggnu&admin")).toBe(true);
  });

  it("先頭の ? が無い search 文字列でも判定できる", () => {
    expect(isAdminFromSearch("admin=1")).toBe(true);
  });
});
