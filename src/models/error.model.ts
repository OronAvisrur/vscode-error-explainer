export interface ParsedError {
  type: string;
  message: string;
  stackTrace: string;
  filePath: string | null;
  lineNumber: number | null;
  columnNumber: number | null;
  language: string;
  rawOutput: string;
}

export interface ErrorPattern {
  language: string;
  regex: RegExp;
  extractor: (match: RegExpMatchArray, fullText: string) => ParsedError | null;
}