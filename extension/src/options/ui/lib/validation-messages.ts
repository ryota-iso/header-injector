import type { ValidationIssue } from "../../../lib";

export function toValidationMessage(issue: ValidationIssue): string {
  switch (issue.type) {
    case "empty-header-name":
      return "header名を入力してください";
    case "duplicate-header":
      return "header名が重複している";
    case "invalid-pattern":
      return "一致パターンが不正です";
  }
}
