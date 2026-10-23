# Assets

Brand images made for the app, kept here as standalone files.

| File | What |
| --- | --- |
| `logos/my-funko-collection-logo.png` | The round logo, centred on a square (top of the main README). |
| `logos/my-funko-collection-row.png` | The face, the database and the magnifying glass beside the name, in one row. |
| `logos/my-funko-collection-icon.jpeg` | The full-size app icon artwork the icons below are made from. |
| `logo-face.png` | The Pop! face from the app icon, cut out with a clear background (sidebar and top bar logo). |
| `funko-waiting-{light,dark}.svg` | The face as a dashed outline: no photo yet, nothing here yet. |
| `funko-searching-{light,dark}.svg` | Holding a magnifying glass, like the logo's figure: before a search. |
| `funko-not-found-{light,dark}.svg` | Glass, frown and a question mark: a search that found nothing. |
| `icons/favicon-32.png`, `icons/favicon-48.png` | The browser-tab icon (the face). |
| `icons/apple-touch-icon.png` | 180 px, for _Add to Home Screen_ on iPhone and iPad. |
| `icons/icon-192.png`, `icons/icon-512.png` | The installed app's icons (manifest). |
| `icons/icon-maskable-512.png` | The same with padding, for Android's round and squircle masks. |

The icons are copies of `web/public/icons/`, which is what the app serves; change both together.

The app itself draws the funko from `web/src/common/components/FunkoFigureArt` in the theme's colours; these SVGs
are fixed-colour copies (stone and teal from the palette) for use outside the app. If the drawing changes, regenerate
them to match.
