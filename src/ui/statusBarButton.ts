import * as vscode from 'vscode';

export class StatusBarButton {
    private statusBarItem: vscode.StatusBarItem;

    constructor(context: vscode.ExtensionContext) {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        
        this.statusBarItem.command = 'errorExplainer.explainError';
        this.statusBarItem.text = '$(bug) Explain Error';
        this.statusBarItem.tooltip = 'Explain the last terminal error using AI';
        
        this.updateVisibility();
        
        context.subscriptions.push(this.statusBarItem);
        
        vscode.window.onDidChangeActiveTerminal(() => {
            this.updateVisibility();
        });
    }

    private updateVisibility(): void {
        const activeTerminal = vscode.window.activeTerminal;
        
        if (activeTerminal) {
            this.statusBarItem.show();
        } else {
            this.statusBarItem.hide();
        }
    }

    public dispose(): void {
        this.statusBarItem.dispose();
    }
}