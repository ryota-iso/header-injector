import { describe, expect, it } from "vitest";

import { toValidationMessage } from "./validation-messages";

describe("validation-messages", () => {
  it("empty-header-nameを日本語メッセージへ変換する", () => {
    expect(toValidationMessage({ type: "empty-header-name", entryId: "header-1" })).toBe("header名を入力してください");
  });

  it("duplicate-headerを日本語メッセージへ変換する", () => {
    expect(toValidationMessage({ type: "duplicate-header", entryId: "header-1", name: "X-Test" })).toBe("header名が重複している");
  });

  it("invalid-patternを日本語メッセージへ変換する", () => {
    expect(toValidationMessage({ type: "invalid-pattern", field: "includePatterns", pattern: "bad-pattern" })).toBe(
      "一致パターンが不正です",
    );
  });
});
