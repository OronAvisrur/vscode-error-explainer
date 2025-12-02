import * as vscode from 'vscode';

export class ExplainErrorCommand {
    public async execute(): Promise<void> {
        const activeTerminal = vscode.window.activeTerminal;

        if (!activeTerminal) {
            vscode.window.showWarningMessage('No active terminal found');
            return;
        }

        vscode.window.showInformationMessage(
            `Error Explainer activated! Terminal: ${activeTerminal.name}`
        );
    }
}