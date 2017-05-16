'use strict';

import { window, StatusBarItem, StatusBarAlignment, Position, Range } from 'vscode';
import * as vscode from 'vscode';
import * as copyPaste from 'copy-paste';
import * as getTitle from 'get-title';
import * as request from 'request';

var baseRequest;

export function activate(context: vscode.ExtensionContext) {

    configureHttpRequest();
	vscode.workspace.onDidChangeConfiguration(e => configureHttpRequest());

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
        var document = vscode.window.activeTextEditor.document
        var selection = vscode.window.activeTextEditor.selection
        var selectedText = document.getText(selection)
        var isSelectionEmpty = selectedText.length == 0 // || selectedText == ' '

        if (isSelectionEmpty) {
            this.composeTitleAndSelection(url)
        } else {
            this.replaceSelectionWithTitleURL(selection, url)
        }
    }

    replaceSelectionWithTitleURL(selection, url) {
        var text = vscode.window.activeTextEditor.document.getText(selection)
        var markdownLink = '[' + text + ']' + '(' + url + ')'
        vscode.window.activeTextEditor.edit((editBuilder) => {
            editBuilder.replace(selection, markdownLink);
        })
    }

    composeTitleAndSelection(url) {
        var _this = this
        var headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/602.3.12 (KHTML, like Gecko) Version/10.0.2 Safari/602.3.12"
        }
        if (!url.startsWith("http")) {
            url = "http://" + url
        }

        var date = new Date()
        var seconds = date.getSeconds()
        var padding = seconds < 10 ? '0' : ''
        var timestamp = date.getMinutes() + ':' + padding + seconds
        var fetchingTitle = 'Fetching Title on ' + timestamp
        _this.writeToEditor('[' + fetchingTitle + '](' + url + ')').then(function (result) {
            // Editing is done async, so we need to make sure previous editing is finished
            const stream = baseRequest(url, { headers: headers }, function (err, response) {
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
        var selection = vscode.window.activeTextEditor.selection
        let position = new vscode.Position(startLine, selection.start.character);
        return vscode.window.activeTextEditor.edit((editBuilder) => {
            editBuilder.insert(position, content);
        });
    }

    replaceWith(originalContent, newContent) {
        let document = vscode.window.activeTextEditor.document
        var range: Range;
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
        var end = new Position(range.start.line, start.character + originalContent.length);
        var newRange = new Range(start, end);
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

function configureHttpRequest() {
	let httpSettings = vscode.workspace.getConfiguration('http');
    baseRequest = request.defaults({'proxy': `${httpSettings.get('proxy')}`});
}