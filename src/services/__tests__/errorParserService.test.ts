import { ErrorParserService } from '../errorParserService';
import { ParsedError } from '../../models/error.model';

describe('ErrorParserService', () => {
  let service: ErrorParserService;

  beforeEach(() => {
    service = new ErrorParserService();
  });

  describe('parseError', () => {
    it('should return null for empty input', () => {
      const result = service.parseError('');
      expect(result).toBeNull();
    });

    it('should return null for whitespace-only input', () => {
      const result = service.parseError('   \n\t  ');
      expect(result).toBeNull();
    });

    it('should return null when no error pattern matches', () => {
      const output = 'This is just regular terminal output\nNo errors here';
      const result = service.parseError(output);
      expect(result).toBeNull();
    });
  });

  describe('JavaScript errors', () => {
    it('should parse basic JavaScript TypeError', () => {
      const output = `TypeError: Cannot read property 'foo' of undefined
    at Object.<anonymous> (/home/user/project/index.js:10:15)
    at Module._compile (internal/modules/cjs/loader.js:999:30)`;

      const result = service.parseError(output);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('TypeError');
      expect(result?.message).toBe("Cannot read property 'foo' of undefined");
      expect(result?.language).toBe('JavaScript');
      expect(result?.filePath).toBe('/home/user/project/index.js');
      expect(result?.lineNumber).toBe(10);
      expect(result?.columnNumber).toBe(15);
      expect(result?.rawOutput).toBe(output);
    });

    it('should parse JavaScript ReferenceError', () => {
      const output = `ReferenceError: foo is not defined
    at /home/user/app.js:25:3`;

      const result = service.parseError(output);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('ReferenceError');
      expect(result?.message).toBe('foo is not defined');
      expect(result?.filePath).toBe('/home/user/app.js');
      expect(result?.lineNumber).toBe(25);
      expect(result?.columnNumber).toBe(3);
    });

    it('should parse JavaScript SyntaxError', () => {
      const output = `SyntaxError: Unexpected token '}'
    at Module._compile (internal/modules/cjs/loader.js:895:18)`;

      const result = service.parseError(output);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('SyntaxError');
      expect(result?.message).toBe("Unexpected token '}'");
    });

    it('should handle JavaScript error without location', () => {
      const output = `RangeError: Maximum call stack size exceeded`;

      const result = service.parseError(output);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('RangeError');
      expect(result?.filePath).toBeNull();
      expect(result?.lineNumber).toBeNull();
      expect(result?.columnNumber).toBeNull();
    });
  });

  describe('TypeScript errors', () => {
    it('should parse TypeScript compiler error', () => {
      const output = `src/app.ts(15,10): error TS2339: Property 'bar' does not exist on type 'Foo'.`;

      const result = service.parseError(output);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('TS2339');
      expect(result?.message).toBe("Property 'bar' does not exist on type 'Foo'.");
      expect(result?.language).toBe('TypeScript');
      expect(result?.filePath).toBe('src/app.ts');
      expect(result?.lineNumber).toBe(15);
      expect(result?.columnNumber).toBe(10);
    });

    it('should parse TypeScript type error', () => {
      const output = `components/Button.tsx(42,7): error TS2322: Type 'string' is not assignable to type 'number'.`;

      const result = service.parseError(output);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('TS2322');
      expect(result?.filePath).toBe('components/Button.tsx');
      expect(result?.lineNumber).toBe(42);
      expect(result?.columnNumber).toBe(7);
    });
  });

  describe('Python errors', () => {
    it('should parse Python NameError with location', () => {
      const output = `Traceback (most recent call last):
  File "/home/user/script.py", line 12, in <module>
    print(unknown_variable)
NameError: name 'unknown_variable' is not defined`;

      const result = service.parseError(output);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('NameError');
      expect(result?.message).toBe("name 'unknown_variable' is not defined");
      expect(result?.language).toBe('Python');
      expect(result?.filePath).toBe('/home/user/script.py');
      expect(result?.lineNumber).toBe(12);
      expect(result?.columnNumber).toBeNull();
    });

    it('should parse Python TypeError', () => {
      const output = `Traceback (most recent call last):
  File "main.py", line 5, in calculate
    result = x + y
TypeError: unsupported operand type(s) for +: 'int' and 'str'`;

      const result = service.parseError(output);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('TypeError');
      expect(result?.filePath).toBe('main.py');
      expect(result?.lineNumber).toBe(5);
    });

    it('should parse Python AttributeError', () => {
      const output = `AttributeError: 'NoneType' object has no attribute 'split'`;

      const result = service.parseError(output);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('AttributeError');
      expect(result?.message).toBe("'NoneType' object has no attribute 'split'");
    });
  });

  describe('Java errors', () => {
    it('should parse Java NullPointerException', () => {
      const output = `Exception in thread "main" java.lang.NullPointerException: Cannot invoke method on null object
        at com.example.Main.process(Main.java:45)
        at com.example.Main.main(Main.java:12)`;

      const result = service.parseError(output);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('java.lang.NullPointerException');
      expect(result?.message).toBe('Cannot invoke method on null object');
      expect(result?.language).toBe('Java');
      expect(result?.filePath).toBe('Main.java');
      expect(result?.lineNumber).toBe(45);
    });

    it('should parse Java ArrayIndexOutOfBoundsException', () => {
      const output = `java.lang.ArrayIndexOutOfBoundsException: Index 5 out of bounds for length 3
        at Application.getData(Application.java:89)`;

      const result = service.parseError(output);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('java.lang.ArrayIndexOutOfBoundsException');
      expect(result?.filePath).toBe('Application.java');
      expect(result?.lineNumber).toBe(89);
    });
  });

  describe('C# errors', () => {
    it('should parse C# compiler error', () => {
      const output = `Program.cs(23,17): error CS0103: The name 'Console' does not exist in the current context`;

      const result = service.parseError(output);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('CS0103');
      expect(result?.message).toBe("The name 'Console' does not exist in the current context");
      expect(result?.language).toBe('C#');
      expect(result?.filePath).toBe('Program.cs');
      expect(result?.lineNumber).toBe(23);
      expect(result?.columnNumber).toBe(17);
    });

    it('should parse C# syntax error', () => {
      const output = `Controllers/UserController.cs(55,1): error CS1002: ; expected`;

      const result = service.parseError(output);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('CS1002');
      expect(result?.message).toBe('; expected');
      expect(result?.filePath).toBe('Controllers/UserController.cs');
    });
  });

  describe('Go errors', () => {
    it('should parse Go compile error', () => {
      const output = `main.go:15:10: undefined: fmt.Printl`;

      const result = service.parseError(output);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('CompileError');
      expect(result?.message).toBe('undefined: fmt.Printl');
      expect(result?.language).toBe('Go');
      expect(result?.filePath).toBe('main.go');
      expect(result?.lineNumber).toBe(15);
      expect(result?.columnNumber).toBe(10);
    });

    it('should parse Go syntax error', () => {
      const output = `server/handler.go:42:5: syntax error: unexpected newline, expecting comma or }`;

      const result = service.parseError(output);

      expect(result).not.toBeNull();
      expect(result?.filePath).toBe('server/handler.go');
      expect(result?.lineNumber).toBe(42);
      expect(result?.columnNumber).toBe(5);
    });
  });

  describe('Rust errors', () => {
    it('should parse Rust compile error with code', () => {
      const output = `error[E0425]: cannot find value 'x' in this scope
 --> src/main.rs:10:13
  |
10 |     println!("{}", x);
  |             ^ not found in this scope`;

      const result = service.parseError(output);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('CompileError');
      expect(result?.message).toBe("cannot find value 'x' in this scope");
      expect(result?.language).toBe('Rust');
      expect(result?.filePath).toBe('src/main.rs');
      expect(result?.lineNumber).toBe(10);
      expect(result?.columnNumber).toBe(13);
    });

    it('should parse Rust error without error code', () => {
      const output = `error: expected ';', found 'let'
 --> src/lib.rs:25:5
  |
25 |     let x = 5
  |              ^ help: add ';' here`;

      const result = service.parseError(output);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('CompileError');
      expect(result?.filePath).toBe('src/lib.rs');
      expect(result?.lineNumber).toBe(25);
      expect(result?.columnNumber).toBe(5);
    });
  });

  describe('Stack trace extraction', () => {
    it('should extract full stack trace for JavaScript error', () => {
      const output = `TypeError: Cannot read property 'x' of null
    at processData (/app/utils.js:10:5)
    at main (/app/index.js:25:3)
    at Module._compile (internal/modules/cjs/loader.js:999:30)`;

      const result = service.parseError(output);

      expect(result).not.toBeNull();
      expect(result?.stackTrace).toContain('TypeError');
      expect(result?.stackTrace).toContain('processData');
      expect(result?.stackTrace).toContain('main');
    });

    it('should limit stack trace to 20 lines', () => {
      const lines = ['TypeError: Test error'];
      for (let i = 0; i < 30; i++) {
        lines.push(`    at function${i} (file.js:${i}:1)`);
      }
      const output = lines.join('\n');

      const result = service.parseError(output);

      expect(result).not.toBeNull();
      const stackLines = result?.stackTrace.split('\n') || [];
      expect(stackLines.length).toBeLessThanOrEqual(20);
    });
  });

  describe('Multiple errors in output', () => {
    it('should parse first matching error', () => {
      const output = `Some build output...
TypeError: First error
    at file1.js:10:5
ReferenceError: Second error
    at file2.js:20:10`;

      const result = service.parseError(output);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('TypeError');
      expect(result?.message).toBe('First error');
    });
  });

  describe('Raw output preservation', () => {
    it('should preserve complete raw output', () => {
      const output = `Build started...
Compiling...
TypeError: Something went wrong
    at main.js:5:10
Build failed!`;

      const result = service.parseError(output);

      expect(result).not.toBeNull();
      expect(result?.rawOutput).toBe(output);
      expect(result?.rawOutput).toContain('Build started');
      expect(result?.rawOutput).toContain('Build failed');
    });
  });
});