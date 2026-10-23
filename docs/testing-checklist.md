# Manual testing checklist

Everything a tester should try before a release. Tick each box on every device in the matrix below. When a check
fails, note the device, the browser, the page address and the steps.

The automated tests (`yarn test` and `yarn test-e2e` in `web/`, `yarn test` in `api/`) cover the logic; this list
covers what only a person notices: how it looks, feels, reads and recovers.

## Before you start

- **Data.** Use a database with plenty in it: 300+ funkos, several images each, every category, series and tag in
  use. Without a server, `yarn dev:big` in `web/` gives 330 sample funkos in the browser.
- **Fresh start.** Keep one empty database too, for the first-run and empty states.
- **Devices.** Test on each of these:

  | Device              | Browser          | Why                                       |
  | ------------------- | ---------------- | ----------------------------------------- |
  | iPhone              | Safari           | The main way in: scanning, one-handed use |
  | Android phone       | Chrome           | The other camera stack                    |
  | Tablet (portrait)   | Safari or Chrome | The in-between layout                     |
  | Laptop              | Chrome, Firefox  | Desktop layout, keyboard, scrollbars      |
  | Mac                 | Safari           | WebKit on desktop                         |
  | Installed app (PWA) | Home-screen icon | No browser bar, its own window            |

- **Settings to vary.** Light and dark mode, _Reduce motion_ on and off, text size larger (200% zoom on desktop,
  the largest Dynamic Type on iPhone), and a slow network (browser dev tools, "Slow 4G").

## 1. First run and the basics

- [ ] On an empty database, Owned and Wishlist already exist, and Owned is the default.
- [ ] Home on an empty database shows friendly empty states, each with a next step (add, scan).
- [ ] The browser tab shows the logo face favicon; _Add to Home Screen_ uses the face icon.
- [ ] The first load shows the logo and a spinner (only if it is slow), never a blank page.
- [ ] Opening the bare address goes straight to Home.

### Signing in (passkeys)

- [ ] On an empty database the app asks for the setup link the server printed; without it, no one can set up.
- [ ] The setup link creates the first passkey (Face ID, Touch ID, Windows Hello, a phone, or a password manager
      like Bitwarden) and signs you in. It works once.
- [ ] Reloading, closing the browser and coming back keeps you signed in; after a week unused it asks again.
- [ ] Signed out, every page goes to the sign-in page, and after signing in you land on the page you asked for.
- [ ] _Settings → Security_ lists the passkeys; another one can be added (after confirming with an existing one),
      and one can be removed (never the last).
- [ ] _Sign out_ ends this browser's session; _Sign out everywhere_ ends all of them.
- [ ] Locked out: `yarn auth:reset` (or the README's container command) removes every passkey and prints a new
      setup link; the collection itself is untouched.

## 2. Navigation

- [ ] **Desktop sidebar:** Home, Funkos, Collections, Search; then Categories, Series, Tags, Images; Settings at
      the bottom. The current page is highlighted.
- [ ] The sidebar collapses to icons and expands again from its edge (the arrow on hover or keyboard focus), smoothly,
      with no bounce or jump in the page. Collapsed, it is wide enough not to be clicked by mistake.
- [ ] Collapsed, each icon still shows its name in a tooltip.
- [ ] _Settings → Sidebar starts_ (expanded or collapsed) is how it opens next time.
- [ ] **Phone bottom bar:** Home, Funkos, Collections, Search; the current tab is highlighted.
- [ ] **Phone menu (☰):** reaches every page the sidebar does, including Settings.
- [ ] The bottom bar never covers the last row of a list or a form's Save button.
- [ ] Moving between pages cross-fades; the sidebar and page headers stay perfectly still.
- [ ] A thin teal bar shows at the top while a slow page loads (try "Slow 4G"), and disappears when it arrives.
- [ ] Browser Back and Forward go where you expect, and a list comes back with the same items and scroll position.
- [ ] The **Back** button on a funko's or a collection's page goes back to where you came from (a collection,
      Search, Home); opened from a shared link, it goes to the Funkos or Collections list.
- [ ] Every page title has its page's icon on the left, as in the navigation.
- [ ] Copy any address (a funko, a filtered list, a collection), open it in a new tab: the same view appears.
- [ ] Refresh on any page keeps you there.
- [ ] An address that does not exist shows the "This shelf is empty" page with Box 404, a link home and Search.
- [ ] Pages never shift sideways when a scrollbar appears or goes.

## 3. Home

- [ ] The stats tiles show the right totals (funkos, items, money spent, images and their size).
- [ ] Each linked tile opens the matching page (the Images tile opens the Images page).
- [ ] Recently added shows the newest funkos; each opens its page.
- [ ] Collections overview and the category bars match the real counts; their links open the filtered lists.
- [ ] **Scan** opens the scanner page.

## 4. Funkos list

- [ ] The header shows "N in your catalog", or "N matching" while searching or filtering.
- [ ] **Search** narrows as you type (after a short pause); Enter searches at once; ✕ clears it.
- [ ] Search finds by name, box number (with or without #), barcode, category, series, tag and collection name.
- [ ] **Sort field:** Name, Number, Date added, Category, Series. Each starts in its natural order (newest first for
      dates). While searching, Best match appears and is the default.
- [ ] **Sort direction:** the arrow button flips the order, the arrow turns over smoothly, and its tooltip says the
      current order and what a press gives ("A–Z, switch to Z–A"). With Best match it is disabled with a reason.
- [ ] Results cross-fade when the sort or a filter changes; typing in search does not freeze the text.
- [ ] **Filters panel** (popover on desktop, bottom drawer on phones): Category, Series, Type, Chase, Collection,
      Tag, Images.
- [ ] Series, Collection and Tag each offer Any, None ("No series", "No collections", "No tags") and every value.
- [ ] Picking "None" then a value (and back) never leaves both applied.
- [ ] Every applied filter shows as a chip; ✕ on a chip removes it; _Clear all_ removes them all.
- [ ] The filters button shows how many are on.
- [ ] **Quick filters** (Owned, Wishlist, other collections, Chase, No images) toggle on and off, and do not
      repeat as chips.
- [ ] **Layouts:** large grid, small grid, list. The choice is remembered after a reload, and the starting layout
      follows _Settings → Layouts_.
- [ ] Grid cards: the whole card opens the funko; Chase and exclusive badges show; hover and keyboard focus
      outline the photo.
- [ ] List view: columns appear as the window widens; a funko in many collections shows "+N" with the full list in
      its tooltip.
- [ ] **Infinite scroll:** scrolling near the end loads more, with placeholder cards (the dashed Pop! figure) or
      placeholder rows while loading.
- [ ] The footer says "Showing 60 of N funkos", then "All N funkos" at the end.
- [ ] _Load more_ works with the keyboard alone, and is disabled with a reason while loading.
- [ ] A new search, filter or sort starts again from the top.
- [ ] Open a funko far down, go Back: the same funkos are loaded and the scroll position is restored.
- [ ] No results shows an empty state with a way to clear the search and filters.
- [ ] **New** opens the add page; **Scan** opens the scanner.

## 5. A funko's page

- [ ] The title, number, category and series show; the series links to the list filtered by it.
- [ ] Details (type, variant, barcode, date added) are right.
- [ ] **Gallery:** the main image shows first and fits without stretching; thumbnails swap the big image with a
      fade; the selected thumbnail is marked.
- [ ] Clicking the big image opens the full-size viewer: arrows, keyboard arrows, swipe on touch, Escape and ✕ close.
- [ ] A funko with no images shows the placeholder, and the frame explains why it cannot open.
- [ ] **Download** (corner of the big image) saves the shown image as a JPEG named after the funko
      ("grogu-12-1.jpg"), and it opens in the phone's Photos and on Windows.
- [ ] **Owned / Wishlist toggles** flip at once with a small bounce, show a toast, and survive a reload.
- [ ] If the save fails (stop the server), the toggle flips back and an error shows.
- [ ] **⋯ menu:** Edit, Lists (add to or remove from any collection), Export (spreadsheet, CSV, JSON), Delete.
- [ ] A delete that fails (still in a collection without ticking the box, or the server stopped) shows why inside
      the dialog.
- [ ] **Collections tile:** one accordion row per collection. Folded: the name and a quick look on the same row
      ("×1 · Out of box · 9,99 € · Box 3"). Unfolded, smoothly: quantity, condition, paid, bought on, tags and
      notes, each with its label, "Not set" when empty.
- [ ] With many collections the tile scrolls inside itself on desktop, and the page does not.
- [ ] A row's **⋯** offers Edit and Remove. Remove dims the row, shows a toast with **Undo**, and Undo puts it back
      with all its data.
- [ ] Edit opens that item's editor **over the funko page** (not the collection page); closing it returns to the
      funko.
- [ ] Tag chips stay easy to see in dark mode.

## 6. Adding a funko

### Scanning (needs HTTPS or localhost, and a real phone)

- [ ] The first scan asks for camera permission; refusing shows how to allow it and a way to type the code.
- [ ] A box's barcode is read within a couple of seconds; a glossy or curved box still works.
- [ ] A 12-digit UPC and the same code as 13-digit EAN find the same funko.
- [ ] **Already in the catalog:** the found card shows it, lets you pick collections, and **+1** adds a copy.
- [ ] The scanner and the form are pages of their own on every screen (no dialog), with the Funkos icon by the
      title.
- [ ] **Not in the catalog:** the form opens with the barcode filled in.
- [ ] _Add without a barcode_ switches to the empty form.

### The form

- [ ] Three sections, each with its icon: **Images** first, then **Details** (open book), then **Collections**.
- [ ] Name, number, type, category and at least one image are required; each missing one says so under its field.
- [ ] Saving without an image says "Add at least one image".
- [ ] **New category / New series** buttons open a small box: type a name, Enter or Create saves it and selects it,
      without leaving the form. An empty name keeps Create disabled with a reason.
- [ ] **Tags:** typing a new name offers _Create "X"_, which creates and adds it.
- [ ] **Images:** choose several files, take a photo (phones); thumbnails appear; ✕ removes one; the most at once is
      enforced with a reason. A big phone photo (10 MB and more) is still accepted: it is shrunk before upload.
- [ ] The first image is labelled **Main**; the star on another makes it main, and it glides to the front with
      focus following it. Clicking a thumbnail opens it big, with arrows through the rest.
- [ ] Adding or removing images (down to none) makes the section grow or shrink smoothly; the star and ✕ never
      overlap, also on a phone.
- [ ] **Collections:** each picked collection gets its own card with quantity, condition, paid, bought on, tags and
      notes. Picking another collection adds its card open and folds the others; ✕ on a card unpicks it; none
      picked says it goes to the catalog only. Cards appear, fold and go smoothly.
- [ ] A folded card shows what it holds on its title row ("×2 · Mint in box · 14,99 €"). A folded card with a
      mistake (a price like "lots") opens on Save, with the error under the field.
- [ ] **Save column:** beside the form on desktop it stays in view and shows the first photo (or the placeholder),
      "Saving to Catalog, Owned, …" and Save. On phones Save sticks above the bottom bar.
- [ ] The same funko twice, or a barcode already used, is refused with an **Open it** link to the existing one.
- [ ] All or nothing: if the images or a collection fail to save (stop the server mid-save), nothing is left
      half-saved and the form says why.
- [ ] After Save: the saved card shows the funko, where it went, and _Add another_ / _Scan another_. Each
      collection's item has the details typed in its card (check its page).
- [ ] _Add another_ opens a fresh form at the top, remembering the collections, tags and last category.
- [ ] The default collections and tags for new funkos follow _Settings → Adding to_.

## 7. Editing a funko

- [ ] Every field comes filled in; Save with no changes just closes, with no request and no toast.
- [ ] Changing the category, series (including back to None), name or number saves and shows on the page.
- [ ] **Images:** upload more, make one the main image, move left and right, rotate, delete; each acts at once.
- [ ] Menu items that cannot apply (move the first one left, make the main one main) are disabled with a reason.
- [ ] **Delete funko:** while in a collection, it asks first and names the collections; confirming removes it from
      all of them and deletes its images.

## 8. Collections

- [ ] The list shows each collection with counts and money spent, as cards or a table.
- [ ] **New** creates a collection; a duplicate name is refused.
- [ ] Edit renames it and changes its notes, in a dialog over the page you are on (it does not jump to the
      Collections page).
- [ ] _Make default_ moves the default mark; Home's counts follow.
- [ ] Deleting a collection removes its items but never the funkos themselves; the default cannot be deleted
      (with a reason).
- [ ] **A collection's page:** its items with search, filters (category, tag, condition), sort, layouts, page links
      at the bottom, and the same empty states.
- [ ] **Item menu:** Edit (quantity, condition, price, currency, date, tags, notes), Move to another collection
      (keeps everything), Remove (with Undo).
- [ ] **All items** (`/items`) lists items across collections with a Collection filter.

## 9. Categories, series and tags

- [ ] Each page lists its entries with how many funkos or items use them.
- [ ] **New** (the + button) adds one; a duplicate name is refused, also when renaming.
- [ ] The + beside Category and Series in the funko form creates one on the spot.
- [ ] The pencil switches the row to an edit form with a soft fade, and back on Save or Cancel.
- [ ] **Category:** cannot be deleted while funkos use it (disabled, with the reason).
- [ ] **Series:** deleting it keeps its funkos, now with no series.
- [ ] **Tag:** deleting it only removes the label from items.

## 10. Images page

- [ ] The list shows facts only (no pictures): funko, file name, dimensions, size, date, and labels Main,
      Not being used, "1 of 3 sizes".
- [ ] The default sort is Size, biggest first; Date added and Name work both ways.
- [ ] Search finds by funko name and by file name.
- [ ] **Funko filter:** Any, Being used, Not being used.
- [ ] Clicking anywhere on a row opens the preview with the picture, _Open funko_ and Download.
- [ ] **Group by funko:** one row per funko with image count, total size and newest date; files nothing uses form
      one group at the end; the arrow opens a funko's images underneath.
- [ ] Sorting by size while grouped puts the funkos using the most space first.
- [ ] The view choice survives a reload; infinite scroll works in both views.

## 11. Search

- [ ] **⌘K / Ctrl+K** opens the search box from any page; Escape closes it.
- [ ] Results appear as you type, grouped: Funkos, Categories, Series, Collections, Tags.
- [ ] Each result opens the right page or filtered list; _All results_ opens the catalog search.
- [ ] The Search tab (phones) works the same, with a scan shortcut.
- [ ] No match shows "Try another word, a number or a barcode" with the not-found figure.

## 12. Settings

- [ ] **Appearance:** Light, Dark, System; System follows the device live; the switch fades colours smoothly. The
      sidebar's Theme menu closes as soon as one is picked.
- [ ] **Sidebar starts:** expanded or collapsed (computers).
- [ ] **Layouts:** the starting layout of Funkos, Collections and Images.
- [ ] **Shortcuts:** lists the keyboard shortcuts (⌘K / Ctrl+K and the rest) and each one works.
- [ ] **Security:** see _Signing in_ above.
- [ ] **Default collection** can be changed here too.
- [ ] **Adding to:** the collections and tags new funkos go to, kept on this device.
- [ ] **Configuration** links to Categories, Series and Tags (phones).
- [ ] **Data:** _Export JSON_ downloads everything; _Export CSV_ opens in Excel, Numbers and Google Sheets with
      accents and € intact. (The other exports are in _19. Exports_.)
- [ ] **About** shows the version.

## 13. Feedback, errors and recovery

- [ ] Every save, move or delete shows a toast; removals offer Undo; toasts can be swiped away on phones.
- [ ] **Every disabled control explains why** in a tooltip, on hover, keyboard focus and tap.
- [ ] Field errors fade in under their field and are read out by screen readers.
- [ ] **Server stopped:** pages show a friendly error with _Try again_; nothing shows raw error text or request
      details.
- [ ] **Slow network:** buttons show a spinner while saving, and a second click does not save twice.
- [ ] Two tabs open: a change in one shows in the other after a reload, with no crash.
- [ ] Very long names, numbers and notes wrap or truncate cleanly everywhere (cards, rows, titles, chips).
- [ ] Accents, emoji and symbols in names (Pokémon, Ragnarök, ’) save, search and export correctly.

## 14. Motion

- [ ] New pages, Add steps, rows, chips, alerts and images fade or rise in; nothing jumps or bounces.
- [ ] Folding and unfolding (Add page cards, the funko page's collections) eases open and shut.
- [ ] Rows that come and go glide instead of jumping: a funko page's collection row (Owned / Wishlist, ⋯ → Lists),
      a collection's items on Remove and Undo (grid, table and phone list), Categories / Series / Tags on add and
      delete, and filter chips; the rows around them slide into place.
- [ ] Typing in a search box never animates or freezes what you type; the console shows no errors from any of it.
- [ ] Lists dim while new results load and come back when they arrive.
- [ ] With **Reduce motion** on, all of it is instant; nothing slides, pulses or spins except a loading spinner.

## 15. Accessibility

- [ ] Everything works with the keyboard alone, in a sensible order, with a visible focus ring on every control.
- [ ] Dialogs keep focus inside, return it on close, and close with Escape.
- [ ] With a screen reader (VoiceOver, TalkBack, NVDA): every button and link has a clear name, each page has one
      main heading, images have descriptions, and "Showing 60 of N" is announced as the list grows.
- [ ] Nothing relies on colour alone: chips, badges and states also have words.
- [ ] Text and controls stay readable at 200% zoom and the largest text size, with no clipped or overlapping text.
- [ ] Tap targets are at least about a fingertip (24 px) with space around them, including icon buttons in rows.
- [ ] Colour contrast is fine in light and dark mode (check muted text, placeholders and the demo banner).

## 16. Phones and screens

- [ ] Portrait and landscape both work; rotating mid-form keeps what you typed.
- [ ] Nothing is hidden under the notch, the home indicator or the on-screen keyboard.
- [ ] Forms on phones are their own page with Back; desktop shows them as dialogs over the page (Add is a page
      everywhere).
- [ ] Pull-to-refresh and swipe-back (iOS) behave and do not lose data.
- [ ] The installed app opens on Home, in its own window, with the right icon and name.

## 17. Data safety (server)

- [ ] Restart the containers: everything is still there.
- [ ] Back up with the README's commands, restore to a fresh folder: the app shows the same collection and images.
- [ ] `yarn images:prune` removes only files the Images page lists as "Not being used".
- [ ] Uploading a non-image file, or one over 5 MB after the browser has shrunk it, is refused with a clear message.

## 18. Public demo (GitHub Pages)

- [ ] The demo banner shows on every page and says changes reset on reload.
- [ ] Opening a deep link (a funko's address) directly, and refreshing on it, both work.
- [ ] Icons, favicon and the scanner load from the sub-folder; nothing points at the site root.
- [ ] Adding, editing and deleting work, and a reload brings the original data back.

## 19. Exports

- [ ] **Header Export** (an icon with a tooltip) on Categories, Series, Collections and Tags offers spreadsheet, CSV
      and JSON, and an **Include their funkos** switch that looks and works like a switch.
- [ ] Each row's ⋯ (a category, series, collection or tag) exports just its funkos.
- [ ] On phones the Export icon sits at the end of the title's row.
- [ ] A funko's ⋯ → Export: the spreadsheet has its images embedded on a second sheet; CSV and JSON carry the
      image links.
- [ ] **Images page** Export lists the images' data with a link to each, not the files.
- [ ] Spreadsheets open in Excel, Numbers, LibreOffice and Google Sheets without a repair prompt: a teal header,
      filters, stripes, Chase rows marked, text wrapped (no overflowing Tags or Images), one "Open" link per image.
- [ ] With **Include their funkos**, each entry is a row that folds open (the + in the margin, also in
      LibreOffice) to show its funkos underneath.
- [ ] Downloads work in the demo too.

