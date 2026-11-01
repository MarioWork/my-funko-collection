# My Funko Collection

A tracker for the Funko Pops of a few people who share one app: what figures exist, which lists each person keeps them in, and where each one is stored.

## Language

### The figure

**Funko**:
One figure as Funko made it, the same for everyone who owns it. Owning two of them is still one funko.
_Avoid_: Pop, figure, product, catalog entry

**Number**:
The number printed on the box, as text ("01", "1300", "SE"). It repeats across categories, so it does not name a funko on its own.
_Avoid_: ID, box number

**Type**:
The kind of product: a regular Pop, a Deluxe, a Ride, a Soda, a Bitty Pop, and so on.
_Avoid_: Format, style

**Category**:
Funko's own line printed on the box, such as "Pop! Marvel" or "Pop! Star Wars". Every funko has exactly one.
_Avoid_: Line, franchise, collection

**Series**:
The show, film or game a funko comes from, such as "Spider-Man: No Way Home" (category "Pop! Marvel"). Optional.
_Avoid_: Show, franchise, category

**Variant**:
A special version of a funko, such as a chase, glow-in-the-dark or flocked one. A variant is its own funko.
_Avoid_: Edition, version. Never use it for the sizes an image is kept in.

**Chase**:
A rare variant, shipped in small numbers next to the regular funko.
_Avoid_: Rare, limited

**Exclusive**:
The store or event a funko was sold through only, such as "SDCC 2024" or "Hot Topic". None means a regular release.
_Avoid_: Sticker, retailer

**Barcode**:
The code printed on the box, always in its 13-digit form. Many funkos have none.
_Avoid_: UPC, EAN, SKU

**Catalogue**:
Every funko in the app. One catalogue, shared by all users.
_Avoid_: Database, library, collection

**Submission**:
A funko a member added, waiting for an admin. The member can use it in their own collections right away; nobody else sees it until it is approved.
_Avoid_: Request, proposal, draft

**Orphan submission**:
A submission whose sender was removed. It shows as sent by a Removed user, stays waiting until an admin approves or merges it, and is deleted if rejected.
_Avoid_: Abandoned, ownerless submission

**Approve**:
An admin accepts a submission, and the funko joins the catalogue for everyone.
_Avoid_: Publish, accept

**Reject**:
An admin turns a submission down.
_Avoid_: Decline, deny

**Merge**:
An admin finds that a submission is a funko already in the catalogue, and moves the member's items onto that funko instead. Where the member already had that funko in the same collection, the two items become one. The admin picks, field by field and image by image, what the catalogue funko keeps. The submission stays, as merged and as its sender sent it, so its sender sees where it went.
_Avoid_: Combine, dedupe

**Original**:
In a merge, the catalogue funko the submission merges into, beside the submission. It keeps its own details and images unless the admin picks the submission's.
_Avoid_: Target (in the app's words), master, canonical

**Image**:
A picture of a funko, taken by a user. A funko can have several, in a chosen order.
_Avoid_: Photo, picture

**Uploader**:
The user who added an image, kept with the time they added it. Images from before this was recorded belong to the first admin.
_Avoid_: Owner, author, creator

### The lists

**Collection**:
One of a user's own lists, such as "Owned" or "Wishlist". Only that user sees it. A funko can be in many.
_Avoid_: List, shelf, category

**Default collection**:
The collection new funkos go into unless the user picks another. "Owned" from the start; each user always has exactly one.
_Avoid_: Main list, primary

**Item**:
One funko inside one collection, with its quantity, condition, price, date, notes and tags.
_Avoid_: Entry, copy, ownership

**Quantity**:
How many of the same funko an item holds. Doubles raise the quantity; they never make a second item.
_Avoid_: Count, copies

**Condition**:
The state of what the user has: mint in box, box damaged, or out of box. Empty on an item not bought yet.
_Avoid_: Grade, state

**Tag**:
A label a user puts on their own items, mainly the storage box ("Box 3"). An item can have many.
_Avoid_: Label, box, location

### People and sign-in

**User**:
A person who can sign in. Each user has their own collections, items and tags.
_Avoid_: Account, member (that is a role)

**Removed user**:
How the app names a user who no longer exists, where something they left behind is still shown, such as the uploader of an image.
_Avoid_: Deleted account, unknown user, ghost

**Admin**:
A user who manages users, images, submissions and the catalogue. Only an admin can create a user. There is always at least one who is not read-only. An admin never sees other users' collections.
_Avoid_: Owner, superuser

**Member**:
A user who is not an admin.
_Avoid_: Normal user, regular user

**Read-only**:
A user an admin has limited to looking. They can still sign in, see their own collections and the catalogue, and look after their own password and passkeys, but change nothing else.
_Avoid_: Disabled, suspended, banned

**Notification**:
A message inside the app telling a user something happened to them: a submission approved, rejected or merged, a new submission waiting (for admins), or a funko of theirs removed from the catalogue, with the reason. Kept for 90 days.
_Avoid_: Alert, message, email

**Username**:
The name a user signs in with.
_Avoid_: Login, email, handle

**Password**:
One way to sign in. At least 15 characters and not a common one.
_Avoid_: PIN, passphrase

**Temporary password**:
The password an admin gives a new user, or one who forgot theirs. The user must replace it before they can do anything else.
_Avoid_: Reset password, initial password

**Passkey**:
The other way to sign in. Tied to the app's host name, so changing that name makes every passkey useless.
_Avoid_: Login, key

**Recent sign-in**:
A user proved it's them within the last 10 minutes, with a passkey or their password. Only risky actions need one: passkeys, passwords and managing users.
_Avoid_: Reauth, fresh sign-in, re-login

**Persona**:
A seeded user who shows one set of screens, only in development: an admin, a member, a read-only one of each, a new user with a temporary password, the last admin. They exist in the mock data and in a locally seeded database, all with the same dev password.
_Avoid_: Test user, demo account, fake user

**Setup link**:
A one-time link, printed by the server, that lets the first admin sign in for the first time, or after every admin is locked out.
_Avoid_: Invite, reset link
