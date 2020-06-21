'use strict';

import { window, StatusBarItem, StatusBarAlignment, Position, Range } from 'vscode';
import * as vscode from 'vscode';
import * as copyPaste from 'copy-paste';
import * as getTitle from 'get-title';
import * as request from 'request';
import * as hyperquest from 'hyperquest';

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

interface ILinkFormatter {
    formatLink(text: string, url: string): string;
}

class MarkdownLinkFormatter implements ILinkFormatter {
    formatLink(text: string, url: string): string {
        return '[' + text + ']' + '(' + url + ')';
    }
}

class RestructuredTextLinkFormatter implements ILinkFormatter {
    formatLink(text: string, url: string): string {
        return '`' + text + ' <' + url + '>`_';
    }
}

class AsciidocLinkFormatter implements ILinkFormatter {
    formatLink(text: string, url: string): string {
        return url + '[' + text + ']';
    }
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
                this.showMessage('[PasteURL]: Not a URL.')
            }
        })
    }

    getLanguage() {
        var filename = vscode.window.activeTextEditor.document.fileName
        if (filename.endsWith(".rst") ||
            filename.endsWith(".rest") ||
            filename.endsWith(".restx")) {
            return 'restructuredtext';
        }
        if (filename.endsWith(".asciidoc") ||
            filename.endsWith(".adoc") ||
            filename.endsWith(".asc")) {
            return 'asciidoc';
        }

        return vscode.window.activeTextEditor.document.languageId.toLowerCase();
    }

    getLinkFormatter() {
        var language = this.getLanguage();
        if (language == 'restructuredtext') {
            return new RestructuredTextLinkFormatter();
        } else if (language == 'asciidoc') {
            return new AsciidocLinkFormatter();
        } else {
            return new MarkdownLinkFormatter();
        }
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
        var formattedLink = this.getLinkFormatter().formatLink(text, url)
        vscode.window.activeTextEditor.edit((editBuilder) => {
            editBuilder.replace(selection, formattedLink);
        })
    }

    composeTitleAndSelection(url) {
        var _this = this
        var headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Safari/605.1.15"
        }
        if (!url.startsWith("http")) {
            url = "http://" + url
        }
        var date = new Date()
        var seconds = date.getSeconds()
        var padding = seconds < 10 ? '0' : ''
        var timestamp = date.getMinutes() + ':' + padding + seconds
        var fetchingTitle = 'Getting Title at ' + timestamp
        var formattedLink = this.getLinkFormatter().formatLink(fetchingTitle, url)
        _this.writeToEditor(formattedLink).then(function (result) {
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
        return title.trim()
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

function isProxyConfigured() {
    return vscode.workspace.getConfiguration('http') != undefined;
}

function configureHttpRequest() {
    let httpSettings = vscode.workspace.getConfiguration('http');
    if (httpSettings != undefined) {
        let proxy = `${httpSettings.get('proxy')}`

        if (proxy != undefined && proxy.length != 0) {
            if (!proxy.startsWith("http")) {
                proxy = "http://" + proxy
            }
            baseRequest = request.defaults({'proxy': proxy});
        }
    }

    if (baseRequest == undefined) {
        baseRequest = hyperquest
    }
}