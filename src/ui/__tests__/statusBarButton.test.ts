import * as vscode from 'vscode';
import { StatusBarButton } from '../statusBarButton';

describe('StatusBarButton', () => {
    let statusBarButton: StatusBarButton;
    let mockStatusBarItem: any;
    let mockContext: vscode.ExtensionContext;
    let onDidChangeActiveTerminalCallback: ((terminal: vscode.Terminal | undefined) => void) | undefined;

    beforeEach(() => {
        jest.clearAllMocks();

        mockStatusBarItem = {
            command: undefined,
            text: '',
            tooltip: '',
            show: jest.fn(),
            hide: jest.fn(),
            dispose: jest.fn(),
        };

        (vscode.window.createStatusBarItem as jest.Mock).mockReturnValue(mockStatusBarItem);

        (vscode.window.onDidChangeActiveTerminal as jest.Mock).mockImplementation((callback) => {
            onDidChangeActiveTerminalCallback = callback;
            return { dispose: jest.fn() };
        });

        mockContext = {
            subscriptions: [],
        } as any;

        (vscode.window as any).activeTerminal = undefined;
    });

    describe('constructor', () => {
        it('should create status bar item with correct configuration', () => {
            statusBarButton = new StatusBarButton(mockContext);

            expect(vscode.window.createStatusBarItem).toHaveBeenCalledWith(
                vscode.StatusBarAlignment.Right,
                100
            );
            expect(mockStatusBarItem.command).toBe('errorExplainer.explainError');
            expect(mockStatusBarItem.text).toBe('$(bug) Explain Error');
            expect(mockStatusBarItem.tooltip).toBe('Explain the last terminal error using AI');
        });

        it('should register status bar item in context subscriptions', () => {
            statusBarButton = new StatusBarButton(mockContext);

            expect(mockContext.subscriptions).toContain(mockStatusBarItem);
        });

        it('should register onDidChangeActiveTerminal listener', () => {
            statusBarButton = new StatusBarButton(mockContext);

            expect(vscode.window.onDidChangeActiveTerminal).toHaveBeenCalled();
        });

        it('should show button when terminal is active on initialization', () => {
            const mockTerminal = { name: 'Test' } as vscode.Terminal;
            (vscode.window as any).activeTerminal = mockTerminal;

            statusBarButton = new StatusBarButton(mockContext);

            expect(mockStatusBarItem.show).toHaveBeenCalled();
        });

        it('should hide button when no terminal is active on initialization', () => {
            (vscode.window as any).activeTerminal = undefined;

            statusBarButton = new StatusBarButton(mockContext);

            expect(mockStatusBarItem.hide).toHaveBeenCalled();
        });
    });

    describe('terminal change handling', () => {
        beforeEach(() => {
            (vscode.window as any).activeTerminal = undefined;
            statusBarButton = new StatusBarButton(mockContext);
            jest.clearAllMocks();
        });

        it('should show button when terminal becomes active', () => {
            const mockTerminal = { name: 'Test' } as vscode.Terminal;
            (vscode.window as any).activeTerminal = mockTerminal;

            if (onDidChangeActiveTerminalCallback) {
                onDidChangeActiveTerminalCallback(mockTerminal);
            }

            expect(mockStatusBarItem.show).toHaveBeenCalled();
        });

        it('should hide button when terminal becomes inactive', () => {
            (vscode.window as any).activeTerminal = undefined;

            if (onDidChangeActiveTerminalCallback) {
                onDidChangeActiveTerminalCallback(undefined);
            }

            expect(mockStatusBarItem.hide).toHaveBeenCalled();
        });

        it('should update visibility multiple times on terminal changes', () => {
            const mockTerminal = { name: 'Test' } as vscode.Terminal;

            (vscode.window as any).activeTerminal = mockTerminal;
            if (onDidChangeActiveTerminalCallback) {
                onDidChangeActiveTerminalCallback(mockTerminal);
            }

            (vscode.window as any).activeTerminal = undefined;
            if (onDidChangeActiveTerminalCallback) {
                onDidChangeActiveTerminalCallback(undefined);
            }

            expect(mockStatusBarItem.show).toHaveBeenCalledTimes(1);
            expect(mockStatusBarItem.hide).toHaveBeenCalledTimes(1);
        });
    });

    describe('dispose', () => {
        it('should dispose status bar item', () => {
            statusBarButton = new StatusBarButton(mockContext);

            statusBarButton.dispose();

            expect(mockStatusBarItem.dispose).toHaveBeenCalled();
        });
    });
});