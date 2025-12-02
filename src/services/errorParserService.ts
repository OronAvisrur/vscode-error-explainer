import { ParsedError, ErrorPattern } from '../models/error.model';

export class ErrorParserService {
  private patterns: ErrorPattern[];

  constructor() {
    this.patterns = this.initializePatterns();
  }

  public parseError(terminalOutput: string): ParsedError | null {
    if (!terminalOutput || terminalOutput.trim().length === 0) {
      return null;
    }

    for (const pattern of this.patterns) {
      const match = terminalOutput.match(pattern.regex);
      if (match) {
        const error = pattern.extractor(match, terminalOutput);
        if (error) {
          return error;
        }
      }
    }

    return null;
  }

  private initializePatterns(): ErrorPattern[] {
    return [
      this.createTypeScriptPattern(),
      this.createCSharpPattern(),
      this.createGoPattern(),
      this.createRustPattern(),
      this.createJavaPattern(),
      this.createPythonPattern(),
      this.createJavaScriptPattern(),
    ];
  }

  private createJavaScriptPattern(): ErrorPattern {
    return {
      language: 'JavaScript',
      regex: /^(\w+Error): (.+)$/m,
      extractor: (match, fullText) => {
        if (fullText.includes('Traceback') || fullText.includes('File "')) {
          return null;
        }

        const type = match[1];
        const message = match[2];
        const stackTrace = this.extractStackTrace(fullText, match.index || 0);
        const location = this.extractJavaScriptLocation(stackTrace);

        return {
          type,
          message,
          stackTrace,
          filePath: location.filePath,
          lineNumber: location.lineNumber,
          columnNumber: location.columnNumber,
          language: 'JavaScript',
          rawOutput: fullText,
        };
      },
    };
  }

  private createTypeScriptPattern(): ErrorPattern {
    return {
      language: 'TypeScript',
      regex: /^(.+\.tsx?)\((\d+),(\d+)\): error TS(\d+): (.+)$/m,
      extractor: (match, fullText) => {
        return {
          type: `TS${match[4]}`,
          message: match[5],
          stackTrace: this.extractStackTrace(fullText, match.index || 0),
          filePath: match[1],
          lineNumber: parseInt(match[2], 10),
          columnNumber: parseInt(match[3], 10),
          language: 'TypeScript',
          rawOutput: fullText,
        };
      },
    };
  }

  private createPythonPattern(): ErrorPattern {
    return {
      language: 'Python',
      regex: /^(\w+Error): (.+)$/m,
      extractor: (match, fullText) => {
        if (!fullText.includes('Traceback') && !fullText.includes('File "')) {
          return null;
        }

        const type = match[1];
        const message = match[2];
        const stackTrace = this.extractStackTrace(fullText, match.index || 0);
        const location = this.extractPythonLocation(fullText);

        return {
          type,
          message,
          stackTrace,
          filePath: location.filePath,
          lineNumber: location.lineNumber,
          columnNumber: null,
          language: 'Python',
          rawOutput: fullText,
        };
      },
    };
  }

  private createJavaPattern(): ErrorPattern {
    return {
      language: 'Java',
      regex: /([\w.]+Exception): (.+)$/m,
      extractor: (match, fullText) => {
        const type = match[1];
        const message = match[2];
        const stackTrace = this.extractStackTrace(fullText, match.index || 0);
        const location = this.extractJavaLocation(stackTrace);

        return {
          type,
          message,
          stackTrace,
          filePath: location.filePath,
          lineNumber: location.lineNumber,
          columnNumber: null,
          language: 'Java',
          rawOutput: fullText,
        };
      },
    };
  }

  private createCSharpPattern(): ErrorPattern {
    return {
      language: 'C#',
      regex: /^(.+\.cs)\((\d+),(\d+)\): error CS(\d+): (.+)$/m,
      extractor: (match, fullText) => {
        return {
          type: `CS${match[4]}`,
          message: match[5],
          stackTrace: this.extractStackTrace(fullText, match.index || 0),
          filePath: match[1],
          lineNumber: parseInt(match[2], 10),
          columnNumber: parseInt(match[3], 10),
          language: 'C#',
          rawOutput: fullText,
        };
      },
    };
  }

  private createGoPattern(): ErrorPattern {
    return {
      language: 'Go',
      regex: /^(.+\.go):(\d+):(\d+): (.+)$/m,
      extractor: (match, fullText) => {
        return {
          type: 'CompileError',
          message: match[4],
          stackTrace: this.extractStackTrace(fullText, match.index || 0),
          filePath: match[1],
          lineNumber: parseInt(match[2], 10),
          columnNumber: parseInt(match[3], 10),
          language: 'Go',
          rawOutput: fullText,
        };
      },
    };
  }

  private createRustPattern(): ErrorPattern {
    return {
      language: 'Rust',
      regex: /^error(?:\[E\d+\])?: (.+)$/m,
      extractor: (match, fullText) => {
        const message = match[1];
        const stackTrace = this.extractStackTrace(fullText, match.index || 0);
        const location = this.extractRustLocation(fullText);

        return {
          type: 'CompileError',
          message,
          stackTrace,
          filePath: location.filePath,
          lineNumber: location.lineNumber,
          columnNumber: location.columnNumber,
          language: 'Rust',
          rawOutput: fullText,
        };
      },
    };
  }

  private extractStackTrace(fullText: string, errorIndex: number): string {
    const lines = fullText.split('\n');
    let startLine = 0;
    let currentIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      if (currentIndex >= errorIndex) {
        startLine = i;
        break;
      }
      currentIndex += lines[i].length + 1;
    }

    const stackLines = [];
    for (let i = startLine; i < lines.length && i < startLine + 20; i++) {
      stackLines.push(lines[i]);
    }

    return stackLines.join('\n');
  }

  private extractJavaScriptLocation(stackTrace: string): {
    filePath: string | null;
    lineNumber: number | null;
    columnNumber: number | null;
  } {
    const locationMatch = stackTrace.match(/at .+ \((.+):(\d+):(\d+)\)/);
    if (locationMatch) {
      return {
        filePath: locationMatch[1],
        lineNumber: parseInt(locationMatch[2], 10),
        columnNumber: parseInt(locationMatch[3], 10),
      };
    }

    const simpleMatch = stackTrace.match(/at (.+):(\d+):(\d+)/);
    if (simpleMatch) {
      return {
        filePath: simpleMatch[1],
        lineNumber: parseInt(simpleMatch[2], 10),
        columnNumber: parseInt(simpleMatch[3], 10),
      };
    }

    return { filePath: null, lineNumber: null, columnNumber: null };
  }

  private extractPythonLocation(fullText: string): {
    filePath: string | null;
    lineNumber: number | null;
  } {
    const locationMatch = fullText.match(/File "(.+)", line (\d+)/);
    if (locationMatch) {
      return {
        filePath: locationMatch[1],
        lineNumber: parseInt(locationMatch[2], 10),
      };
    }

    return { filePath: null, lineNumber: null };
  }

  private extractJavaLocation(stackTrace: string): {
    filePath: string | null;
    lineNumber: number | null;
  } {
    const locationMatch = stackTrace.match(/at .+\((.+\.java):(\d+)\)/);
    if (locationMatch) {
      return {
        filePath: locationMatch[1],
        lineNumber: parseInt(locationMatch[2], 10),
      };
    }

    return { filePath: null, lineNumber: null };
  }

  private extractRustLocation(fullText: string): {
    filePath: string | null;
    lineNumber: number | null;
    columnNumber: number | null;
  } {
    const locationMatch = fullText.match(/-->\s+(.+):(\d+):(\d+)/);
    if (locationMatch) {
      return {
        filePath: locationMatch[1],
        lineNumber: parseInt(locationMatch[2], 10),
        columnNumber: parseInt(locationMatch[3], 10),
      };
    }

    return { filePath: null, lineNumber: null, columnNumber: null };
  }
}