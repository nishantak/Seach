import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('seach.findAll', () => {
        const openEditors = vscode.window.visibleTextEditors;

        vscode.window.showInputBox({ prompt: "Find All" }).then(searchText => {
            if (!searchText) {
                return;
            }

            const matches: vscode.Range[] = [];

            openEditors.forEach(editor => {
                const occurrences = findText(searchText, editor.document.getText());
                occurrences.forEach(position => {
                    const startPos = editor.document.positionAt(position);
                    const endPos = editor.document.positionAt(position + searchText.length);
                    matches.push(new vscode.Range(startPos, endPos));
                });
            });

            if (matches.length > 0) {
                vscode.window.visibleTextEditors.forEach(editor => {
                    editor.setDecorations(
                        vscode.window.createTextEditorDecorationType({
                            backgroundColor: '#67381A',
                        }),
                        matches
                    );
                });
                vscode.window.showInformationMessage(`${matches.length} matches`);
            } else {
                vscode.window.showInformationMessage('No results');
            }
        });
    });

    context.subscriptions.push(disposable);
}

function findText(pattern: string, text: string): number[] {
    const n = text.length;
    const m = pattern.length;
    const occurrences: number[] = [];

    const skip: { [key: string]: number } = {};
    for (let i = 0; i < m - 1; i++) {
        skip[pattern[i]] = m - 1 - i;
    }

    let i = 0;
    while (i <= n - m) {
        let j = m - 1;
        while (j >= 0 && pattern[j] === text[i + j]) {
            j--;
        }
        if (j < 0) {
            occurrences.push(i);
            i += skip[text[i + m - 1]] || m;
        } else {
            i += skip[text[i + m - 1]] || m;
        }
    }

    return occurrences;
}
