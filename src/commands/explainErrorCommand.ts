import * as vscode from 'vscode';
import { TerminalService } from '../services/terminalService';

export class ExplainErrorCommand {
    private terminalService: TerminalService;

    constructor() {
        this.terminalService = new TerminalService();
    }

    public async execute(): Promise<void> {
        try {
            const terminal = this.terminalService.getActiveTerminal();
            
            if (!terminal) {
                vscode.window.showWarningMessage('No active terminal found. Please open a terminal first.');
                return;
            }

            const hasContent = await this.terminalService.hasContent(terminal);
            if (!hasContent) {
                vscode.window.showWarningMessage('Terminal is empty. Run a command first to generate output.');
                return;
            }

            vscode.window.showInformationMessage('Reading terminal output...');
            const output = await this.terminalService.getLastLines(terminal, 50);

            const preview = output.length > 200 
                ? output.substring(0, 200) + '...' 
                : output;
            
            vscode.window.showInformationMessage(
                `Terminal output captured (${output.split('\n').length} lines). Preview: ${preview}`
            );

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Error reading terminal: ${message}`);
        }
    }
}