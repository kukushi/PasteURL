# PasteURL

`PasteURL` is a simple extension that generating markdown-style link when pasting URL.

## Feature

When pasting, automatically converting url to markdown style link.

For example, you have the below URL in your clipboard:

    https://code.visualstudio.com

When pasting wtih `Paste URL`, you will get

    [Visual Studio Code - Code Editing. Redefined](https://code.visualstudio.com)

One gif is worth a thousand words.

![feature](images/screenshot.gif)

## Usage

Hit `"Command+Shift+P"` and then type `Paste URL` and hit enter.
You can checking the status in the status bar in the bottom of VSCode window.

## Known Issues

- Some special characters may not processed correctly.
- Fetching title from some URLs may take longer than expected.

## Source

[GitHub](https://github.com/kukushi/PasteURL)

## License

[MIT](https://github.com/kukushi/PasteURL/blob/master/LICENSE)