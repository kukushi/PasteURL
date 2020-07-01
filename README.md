# PasteURL

`PasteURL` is a simple extension that generating Markdown or reStructuredText style link when pasting URL.

## Features

A Markdown or reStructuredText inline-style link will be generated when pasting a URL into the file with corresponding active language.

For example, you copied the below URL:

    https://code.visualstudio.com

When pasting with `Paste URL`, you will get:

    [Visual Studio Code - Code Editing. Redefined](https://code.visualstudio.com)

One gif is worth a thousand words.

![feature](images/screenshot.gif)

## Usage

For Ubuntu Linux make sure that xclip package is installed, see http://github.com/xavi-/node-copy-paste for details.

- Hit `"Control + Alt + P"` (Recommended)
- Hit `"Command + Shift + P"` and then type `Paste URL` and hit enter.

Selection will be used as the title if possible.

You can change the default shortcut to whatever you like by editing the `Code > Preferences > Keyboard Shortcuts`    (`File > Preferences > Keyboard Shortcuts` on Windows):

```json
[
    {"key": "ctrl+alt+p", "command": "pasteURL.PasteURL"}
]
```

## Known Issues

- Fetching title from some URLs may take longer than expected.

## Source

[GitHub](https://github.com/kukushi/PasteURL)

## License

[MIT](https://github.com/kukushi/PasteURL/blob/master/LICENSE)