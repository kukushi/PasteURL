'use strict';

import { window, StatusBarItem, StatusBarAlignment } from 'vscode';
import * as vscode from 'vscode';
import * as copyPaste from 'copy-paste';
import * as getTitle from 'get-title';
import * as hyperquest from 'hyperquest';

export function activate(context: vscode.ExtensionContext) {

    let paster = new Paster();
    let disposable = vscode.commands.registerCommand('extension.pasteURL', () => {
        paster.paste()
    });

    context.subscriptions.push(disposable);
}

class Paster {
    private _statusBarItem: vscode.StatusBarItem;

    public paste() {
        if (!this._statusBarItem) {
            this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        }

        copyPaste.paste((error, content) => {
            if (content) {
                this.generateMarkDownStyleLink(content)
                this.showMessage('Getting title from URL...')
            } else {
                this.showMessage('Not a URL.')
            }
        })
    }

    generateMarkDownStyleLink(url) {
        const stream = hyperquest(url)
        try {
            getTitle(stream).then(title => {
               var result = '[' + title + ']' + '(' + url + ')'
               this.writeToEditor(result)
            })
        }
        catch (e) {
            this.showMessage('Error')
        }
    }

    writeToEditor(content) {
        vscode.window.activeTextEditor.edit((editBuilder) => {
            let startLine = vscode.window.activeTextEditor.selection.start.line;
            let lastCharIndex = vscode.window.activeTextEditor.document.lineAt(startLine).text.length;
            let position = new vscode.Position(startLine, lastCharIndex);
            editBuilder.insert(position, content);
        });
    }

    showMessage(content) {
        this._statusBarItem.text = "Paste URL: " + content 
        this._statusBarItem.show()
        setTimeout(() => {
            this._statusBarItem.hide()
        },3000);
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}