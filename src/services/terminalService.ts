import * as vscode from 'vscode';

export class TerminalService {
    public getActiveTerminal(): vscode.Terminal | undefined {
        return vscode.window.activeTerminal;
    }
}