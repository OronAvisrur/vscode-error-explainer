import * as vscode from 'vscode';
import { StatusBarButton } from './ui/statusBarButton';
import { ExplainErrorCommand } from './commands/explainErrorCommand';

let statusBarButton: StatusBarButton | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Error Explainer extension is now active');

    const explainErrorCommand = new ExplainErrorCommand();
    
    const disposable = vscode.commands.registerCommand(
        'errorExplainer.explainError',
        () => explainErrorCommand.execute()
    );

    const config = vscode.workspace.getConfiguration('errorExplainer');
    const showInStatusBar = config.get<boolean>('showInStatusBar', true);

    if (showInStatusBar) {
        statusBarButton = new StatusBarButton(context);
    }

    context.subscriptions.push(disposable);
}

export function deactivate() {
    if (statusBarButton) {
        statusBarButton.dispose();
    }
}