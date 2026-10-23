# Assets

Brand images made for the app, kept here as standalone files.

| File | What |
| --- | --- |
| `logos/my-funko-collection-logo.png` | The round logo, centred on a square (top of the main README). |
| `logo-face.png` | The Pop! face from the app icon, cut out with a clear background (sidebar and top bar logo). |
| `funko-waiting-{light,dark}.svg` | The face as a dashed outline: no photo yet, nothing here yet. |
| `funko-searching-{light,dark}.svg` | Holding a magnifying glass, like the logo's figure: before a search. |
| `funko-not-found-{light,dark}.svg` | Glass, frown and a question mark: a search that found nothing. |

The app itself draws the funko from `web/src/common/components/FunkoFigureArt` in the theme's colours; these SVGs
are fixed-colour copies (stone and teal from the palette) for use outside the app. If the drawing changes, regenerate
them to match.
