'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { window, StatusBarItem, StatusBarAlignment } from 'vscode';
import * as vscode from 'vscode'
import * as copyPaste from "copy-paste";

var isURL = require('is-url');
var request = require('request');

export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
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
            if (content && isURL(content)) {
                this.showMessage('Getting title from URL...')
            } else {
                this.showMessage('Not a URL.')
            }
        })
    }

    generateMarkDownStyleLink(url) {
        var _this = this;
        function requestResponseHandler(error, response, body) {
            var title;
            if (!error && response.statusCode === 200) {
                console.log(1)
                var re = /<title.*?>\s*(.*?)\s*<\/title/g;
                var match = re.exec(body)
                title = match[1]
                if (match.length > 1) {
                    var result = '[' + title + ']' + '(' + url + ')'
                    _this.writeToEditor(result)
                } else {
                    this.showMessage("Can't find title...")
                }
            } else {
                this.showMessage(error)
            }
        }

        request(url, requestResponseHandler);
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