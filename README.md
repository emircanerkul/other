# Code Grepper

> [!WARNING]
> **This extension is broken — CodeGrepper is dead.**
> [codegrepper.com](https://www.codegrepper.com) has been shut down: the site and its public API
> (`https://www.codegrepper.com/api/get_answers_1.php`), which this extension used to fetch code
> examples, now simply redirect to [you.com](https://you.com) and no longer return any data.
> Because of this, the extension can no longer return any code examples.
> The project is kept here for archival purposes only.

Get code examples instantly, right from [Raycast](https://www.raycast.com).

Code Grepper was a Raycast extension that searched [CodeGrepper](https://www.codegrepper.com) and
listed code examples with a detail view, so you could grab a snippet without ever leaving the
launcher.

## Screenshots

| Empty search | Search results |
| :---: | :---: |
| ![Empty search — enter a query to search code examples on codegrepper.com](assets/ss-home.png) | ![Search results for "php fibonacci" with fallback web search actions](assets/ss-search.png) |
| **Code example detail** | **No results found** |
| ![Detail view of a code example with Copy to Clipboard action](assets/ss-detail.png) | ![No code example found, with fallback web search actions](assets/ss-empty-search.png) |

## Features

- 🔍 Search code examples on CodeGrepper straight from Raycast
- ⚡ Live results as you type, with request throttling and caching
- 📝 Detail view rendering snippets as Markdown
- 📋 Copy any example to your clipboard
- 🔗 Visit the author's profile or donate to them
- 🌐 Fallback **Search in Google / DuckDuckGo / Bing** actions when nothing was found

## Development

> The extension no longer works — see the warning above. These instructions are kept for reference.

```bash
npm install
npm run dev     # start developing the extension
npm run build   # production build
npm run lint    # lint and fix
```

## License

MIT — see [package.json](package.json).
