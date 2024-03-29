import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext){
    let disposable = vscode.commands.registerCommand('seach.findAll', () => {
        const searchWorkspaceFolder = vscode.workspace.workspaceFolders;
        if (!searchWorkspaceFolder) {
            vscode.window.showErrorMessage("No workspace folder opened.");
            return;
        }

        vscode.window.showInputBox({ prompt: "Enter text to find:" }).then(searchText => {
            if (!searchText){
				return;
			}

            const matches: vscode.Range[] = [];

            searchWorkspaceFolder.forEach(workspaceFolder => {
                const folderPath = workspaceFolder.uri.fsPath;
                findInDirectory(folderPath, searchText, matches);
            });

            if (matches.length > 0){
                const activeEditor = vscode.window.activeTextEditor;
                if (activeEditor){
                    activeEditor.setDecorations(
                        vscode.window.createTextEditorDecorationType({
                            backgroundColor: '#67381A',
                        }), 
						matches
					);
                } vscode.window.showInformationMessage(`${matches.length} matches found.`);
            } else{
                vscode.window.showInformationMessage('No matches found.');
            }
        });
    }); context.subscriptions.push(disposable);
}

function findInDirectory(directoryPath: string, searchText: string, matches: vscode.Range[]){
    fs.readdirSync(directoryPath).forEach((file) => {

        const filePath = path.join(directoryPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()){
            findInDirectory(filePath, searchText, matches);
        } else if (stats.isFile()){
            const fileContents = fs.readFileSync(filePath, 'utf-8');
            const occurrences = findText(searchText, fileContents);

            occurrences.forEach(position => {
                const startPos = new vscode.Position(position, 0);
                const endPos = new vscode.Position(position, 0);
                matches.push(new vscode.Range(startPos, endPos));

            });
    	}
    });
}

// Search Function, Boyer-Moore Algorithm
function findText(text_toMatch: string, document: string): number[]{
    const n = document.length;
    const m = text_toMatch.length;

    const occurrences: number[] = [];

    // Bad character heuristic
    const skip: { [key: string]: number }={};
    for (let i = 0; i < 256; i++){
        skip[String.fromCharCode(i)] = -1;
	} 
	for (let i=0; i<m; i++){
        skip[text_toMatch[i]] = i;
	}

    let s = 0; //shift
    while (s <= n-m){
        let j = m-1;
        while (j >= 0 && text_toMatch[j] === document[s+j]){
			j--;
		} if (j<0){
            occurrences.push(s);
            s += s+m < n ? m-skip[document[s+m]] : 1; // Next possible occurrence
        } else{
            s +=  Math.max(1, j-skip[document[s+j]]);
		}
    }

    return occurrences;
}
