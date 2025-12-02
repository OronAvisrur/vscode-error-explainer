export enum StatusBarAlignment {
    Left = 1,
    Right = 2
}

export const window = {
    createStatusBarItem: jest.fn(),
    activeTerminal: undefined,
    onDidChangeActiveTerminal: jest.fn(),
    showWarningMessage: jest.fn(),
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
};

export const commands = {
    executeCommand: jest.fn(),
};

export const env = {
    clipboard: {
        readText: jest.fn(),
    },
};

export const workspace = {
    getConfiguration: jest.fn(),
};