'use strict';

import { window, StatusBarItem, StatusBarAlignment, Position, Range } from 'vscode';
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

export class Paster {
    private _statusBarItem: vscode.StatusBarItem;

    public paste() {
        if (!this._statusBarItem) {
            this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        }

        copyPaste.paste((error, content) => {
            if (content) {
                this.generateMarkDownStyleLink(content)
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

        var fetchingTitle = 'Fetching Title...'
        _this.writeToEditor('[' + fetchingTitle + '](' + url + ')').then(function (result) {
            // Editing is done async, so we need to make sure previous editing is finished
            const stream = hyperquest(url, { headers: headers }, function (err, response) {
                if (err) {
                    _this.replaceWith(fetchingTitle, 'Error Happened')
                }
            })

            getTitle(stream).then(title => {
                title = _this.processTitle(title, url)
                _this.replaceWith(fetchingTitle, title)
            })
        });
    }

    writeToEditor(content): Thenable<boolean> {
        let startLine = vscode.window.activeTextEditor.selection.start.line;
        let lastCharIndex = vscode.window.activeTextEditor.document.lineAt(startLine).text.length;
        let position = new vscode.Position(startLine, lastCharIndex);
        return vscode.window.activeTextEditor.edit((editBuilder) => {
            editBuilder.insert(position, content);
        });
    }

    replaceWith(originalContent, newContent) {
        let document = vscode.window.activeTextEditor.document
        var range: vscode.Range;
        var line: String;
        for (var i = 0; i < document.lineCount; i++) {
            line = document.lineAt(i).text

            if (line.includes(originalContent)) {
                range = document.lineAt(i).range
                break
            }
        }

        if (range == undefined) {
            return
        }

        var start = new Position(range.start.line, line.indexOf(originalContent));
        var end = new Position(range.start.line, range.start.character + originalContent.length);

        var newRange = new Range(start, end);
        var text = document.getText(newRange);
        vscode.window.activeTextEditor.edit((editBuilder) => {
            editBuilder.replace(newRange, newContent);
        })
    }

    processTitle(title, url) {
        if (title == undefined) {
            return url
        }
        return title
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