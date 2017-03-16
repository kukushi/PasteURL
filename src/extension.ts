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
        var _this = this
        var headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/602.3.12 (KHTML, like Gecko) Version/10.0.2 Safari/602.3.12"
        }
        if (!url.startsWith("http")) {
            url = "http://" + url
        }
        const stream = hyperquest(url, { headers: headers }, function (err, response) {
            if (err) {
                _this.showMessage('Error happened when fetching title')
            }
        })

        getTitle(stream).then(title => {
            title = this.processTitle(title, url)
            var result = '[' + title + ']' + '(' + url + ')'
            this.writeToEditor(result)
        })
    }

    writeToEditor(content) {
        vscode.window.activeTextEditor.edit((editBuilder) => {
            let startLine = vscode.window.activeTextEditor.selection.start.line;
            let lastCharIndex = vscode.window.activeTextEditor.document.lineAt(startLine).text.length;
            let position = new vscode.Position(startLine, lastCharIndex);
            editBuilder.insert(position, content);
        });
    }

    processTitle(title, url) {
        if (title == undefined) {
            return url
        }
    }

    showMessage(content) {
        this._statusBarItem.text = "Paste URL: " + content
        this._statusBarItem.show()
        setTimeout(() => {
            this._statusBarItem.hide()
        }, 3000);
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}