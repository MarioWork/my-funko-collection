# Lock the Funko tracker with passkeys

**The short answer:** use two locks, not one. Lock one is Tailscale. Only your own devices can even reach the app. Lock two is a passkey login inside the app. A passkey is a key your iPhone or Mac keeps, unlocked with Face ID or Touch ID. It cannot be phished or guessed. Behind the login, the API keeps a session in a small SQLite table and gives the browser a locked-down cookie. No JWT, no password, no TOTP by default. Every `/api` call and every `/uploads` image checks that cookie. One hard rule changes how you open the app today: **passkeys never work on a bare IP like `https://192.168.1.20`**. The spec forbids it, so the app needs a real name. The best one is your Tailscale name (`funko.<tailnet>.ts.net`). It has a real certificate, so the iPhone needs no extra trust setup. Before any of this, fix two small things in the API: set `trustProxy`, and turn CORS off in production. The notes disagreed on one point: is Tailscale alone enough? This report says Tailscale alone is fine for "good enough". You asked for "very secure", and that needs the passkey layer too.

## ELI5 plan: what to build, in order

Think of the house. Tailscale is the fence: strangers cannot reach the door. The passkey is the lock on the door: even someone inside the fence cannot walk in. The session cookie is the wristband you get after the lock opens. You do not have to unlock again every minute.

| Step | What | Why | Effort |
| --- | --- | --- | --- |
| 0 | Set `trustProxy` in `api/src/app.ts`. Turn CORS off in production. | Rate limits are broken today. CORS is not needed on one origin. | Tiny |
| 1 | Pick one name: `funko.<tailnet>.ts.net`. Stop using the IP. | Passkeys need a name. A real certificate means no setup on the iPhone. | Small |
| 2 | Make Caddy answer only on Tailscale (or keep the LAN, see below). | Strangers and LAN gadgets cannot reach the app. | Small |
| 3 | Add a `sessions` table and an `__Host-session` cookie. Check it on `/api/*` and `/uploads/*`. | This is the wristband. Logout deletes the row. | Medium |
| 4 | Add passkey login with SimpleWebAuthn. Enrol two passkeys. | Cannot be phished. The database only holds public keys. | Medium |
| 5 | First run: a one-time setup link printed in the server log. Recovery: `docker compose exec api yarn auth:reset`. | Nobody else can claim the account first. You can never be locked out for good. | Small |
| 6 | Add a CSRF check (one hook), a login rate limit, and security headers in the Caddyfile. | Stops other websites and guessing bots. | Small |

The two choices you must make, with my pick:

| Choice | Option A | Option B | Pick |
| --- | --- | --- | --- |
| How strong? | **Fence + lock** (Tailscale + passkeys) | Fence only (Tailscale, no login) | **A.** You said "very secure". B has zero code but trusts every device on the tailnet. |
| Which name? | **`funko.<tailnet>.ts.net`** | A LAN name (`funko.home.arpa`) + install Caddy's root CA on every device | **A.** Real certificate, no trust setup. Cost: the name shows up in public certificate logs. |

## The notes split on "fence only": the fence wins on ease, the lock wins on "very secure"

One note says Tailscale alone is the best plan. Its case is strong. No code. Nothing to log into. Nothing new to break. The installed iPhone app (the home-screen web app) just works. Only devices you approve can see anything ([Tailscale Serve docs](https://tailscale.com/kb/1312/serve); [Lemmy comment](https://old.lemmy.dbzer0.com/comment/10664922?context=3)). Tailscale even adds a `Tailscale-User-Login` header. It strips any fake copy a client sends. But it warns that a backend reachable another way could get forged values ([Tailscale Serve docs](https://tailscale.com/kb/1312/serve)).

The other note says build passkey login into the app. Its case: passkeys are the only sign-in that both **NIST SP 800-63B-4** and **OWASP ASVS 5.0** count as phishing-resistant ([NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html); [OWASP ASVS 5.0 V6](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x15-V6-Authentication.md)).

Here is how to settle it. The fence only works if it is the *only* way in. Today Caddy also listens on the home Wi-Fi. While that is true, any device on the Wi-Fi gets full access: a guest phone, a cheap smart plug, malware on a family PC. It can read, delete, or fill the disk through `/uploads`. Chrome's new Local Network Access prompt does not help here. It only guards against *public websites* poking LAN devices, and only in Chrome ([Chrome for Developers](https://developer.chrome.com/blog/local-network-access)). A fence also does nothing about a lost, unlocked phone that is on the tailnet. The lock covers both gaps. It is also the only layer that still stands if you ever loosen the fence.

So: **fence + lock** is the "very secure" answer. Fence only is a fair "good enough" answer for low-value data. If you go fence only, make it real. Caddy must listen only on the Tailscale address (or sit behind `tailscale serve`). Every home device must run Tailscale. The API container must stay unpublished.

Gates that sit in front of the app (Caddy plugins and login servers) are a third path. They are covered in the gate section below. For one person who already owns the API code, they add containers without adding safety.

## Passkeys need a real hostname, and the iPhone must trust its certificate

This is the hard rule. The WebAuthn spec (the standard behind passkeys) says: if the page's host is not a valid domain, throw a `SecurityError`. It notes that "only the domain format of host is allowed", because of "various issues with using direct IP address identification" ([W3C WebAuthn L3](https://www.w3.org/TR/webauthn-3/)). WebAuthn Level 3 became a W3C Recommendation on **25 August 2026** ([W3C WebAuthn L3](https://www.w3.org/TR/webauthn-3/)). Browsers also refuse WebAuthn on pages with certificate errors. Chrome only allows "HTTPS pages with a valid certificate" ([Chromium origins.md](https://chromium.googlesource.com/chromium/src/+/main/content/browser/webauth/origins.md)). So **`https://192.168.x.y` can never hold a passkey**, and opening the app by IP has to stop.

A passkey is tied for life to one name, called the RP ID (the site's ID for the passkey). A passkey made on `funko.home.arpa` will not work on `funko.<tailnet>.ts.net`. So pick one name before you enrol. SimpleWebAuthn can accept a list of names if you really need two ([SimpleWebAuthn](https://simplewebauthn.dev/docs/packages/server)).

Tailscale names come with **publicly trusted certificates**. The catch: they land in public Certificate Transparency logs, so the machine name becomes public ([Tailscale HTTPS](https://tailscale.com/kb/1153/enabling-https/); [Tailscale tailnet names](https://tailscale.com/docs/concepts/tailnet-name)). A LAN name with Caddy's local CA also passes the spec. But each device must install the root CA and turn on full trust. On iOS that is Settings > General > About > Certificate Trust Settings. That is the shakier path.

**Not yet proven:** no Apple or WebKit source confirms how Safari handles passkeys with a user-installed root CA. Test on the iPhone before you commit.

## A session row and one cookie beat a JWT for one user

**Use a random token in a cookie, checked against a row in SQLite.** Every main source agrees. ASVS 5.0 says the token must come from a secure random source with at least **128 bits** of randomness. It also says logout must stop the session for good. For a JWT (a self-contained signed token), that needs a deny-list or a per-user cutoff, which is server state anyway ([OWASP ASVS 5.0 V7](https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x16-V7-Session-Management.md)). OWASP and NIST both say: never keep session tokens in `localStorage`, because any injected script can read them ([OWASP Session Management CS](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html); [NIST SP 800-63B-4 Session](https://pages.nist.gov/800-63-4/sp800-63b/session/)). With one user and one SQLite file, a JWT saves nothing. A session lookup is one indexed read.

**Build it by hand. It is about 80 lines.** Copy the design from Lucia's single-file `auth_session.ts`. Lucia was deprecated in March 2025 and now ships this file as a template ([lucia-auth.com](https://lucia-auth.com/)). The token is `<id>.<secret>`. Only `SHA-256(secret)` is stored. Compare with `crypto.timingSafeEqual` (a compare that takes the same time whatever the input, so it leaks nothing). Update "last seen" at most once an hour ([auth_session.ts](https://raw.githubusercontent.com/lucia-auth/lucia/refs/heads/main/code/auth_session.ts)). Skip the plugins. `@fastify/session`'s default store "will leak memory" ([@fastify/session README](https://raw.githubusercontent.com/fastify/session/main/README.md)). `@fastify/secure-session` cannot revoke a leaked cookie ([secure-session README](https://raw.githubusercontent.com/fastify/fastify-secure-session/main/README.md)). You only need `@fastify/cookie` 11.

**The cookie:** `__Host-session=<token>; Secure; HttpOnly; SameSite=Strict; Path=/`, with no `Domain`. NIST says cookies SHOULD use the `__Host-` prefix with `Path=/` and SameSite Lax or Strict ([NIST SP 800-63B-4 Session](https://pages.nist.gov/800-63-4/sp800-63b/session/)). OWASP prefers Strict ([OWASP Session Management CS](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)). `__Host-` means the cookie is HTTPS-only, has no `Domain`, and has `Path=/` ([MDN Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)). Strict costs this app nothing. Caddy serves the page HTML without a login check. Only the same-origin `fetch` calls and `<img>` loads need the cookie, and Strict cookies go with those.

**How long it lasts:** **30 days max, 7 days idle**, with the idle timer reset as you use it. NIST says that at AAL1 (its basic level) you must log in again at least every **30 days**. At AAL2 (its stronger level) it suggests **24 h** max and **1 h** idle ([NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html)). OWASP's 15–30 minute idle limit is meant for business apps. It would make a phone app you use in a shop a pain ([OWASP Session Management CS](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)). Give a new token on every login. Delete the row on logout and send `Clear-Site-Data: "cookies"`. "Log out everywhere" deletes all rows. Ask for the passkey again before risky actions, like adding or removing passkeys ([OWASP ASVS 5.0 V7](https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x16-V7-Session-Management.md); [Copenhagen Book: Sessions](https://copenhagen.pilcrowonpaper.com/sessions)). Write the chosen limits in `api/README.md`. ASVS asks for that.

**The iPhone home-screen app keeps its own cookies,** separate from Safari ([Progressier cookies demo](https://progressier.com/pwa-capabilities/cookies-demo); [Netguru](https://www.netguru.com/blog/how-to-share-session-cookie-or-state-between-pwa-in-standalone-mode-and-safari-on-ios)). So you log in once inside the installed app, and once in Safari. That is fine. In-app passkeys keep the whole login on one page, so there is no redirect that bounces you out to Safari. Login-server redirects (OIDC) have that problem ([Discourse meta](https://meta.discourse.org/t/back-button-in-ios-pwa/93909?page=3)).

## Passkeys first; passwords and TOTP only as a fallback you probably skip

**Library:** `@simplewebauthn/server` 14 and `@simplewebauthn/browser`. It runs on Node 22+, so Node 24 is fine. There are four calls: make options, then verify, for both sign-up and login. Store each passkey's `id`, `publicKey`, `counter`, `transports`, `deviceType` and `backedUp`. Keep the one-time challenge on the server for about 5 minutes, then delete it ([SimpleWebAuthn](https://simplewebauthn.dev/docs/packages/server)). Ask for `residentKey: 'required'` and `userVerification: 'required'`. An iCloud-synced passkey counts as AAL2. Synced passkeys are banned only at AAL3 ([NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html)). One more thing: iCloud passkeys often report a counter of 0. Do not reject that. This is common knowledge, not checked in the notes.

**Enrol two passkeys.** iPhone and Mac through iCloud count as one. Add a hardware key or a second browser profile as the backup.

**Passwords: skip them.** If you ever add one as a fallback, follow NIST. Minimum **15 characters** when it is the only factor. No "must have a symbol" rules. No forced changes. Check it against a list of common passwords. Allow paste and password managers ([NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html)). Hash it with argon2id (a slow hash built to resist guessing) at **m=19456 KiB, t=2, p=1** or stronger. That is the OWASP floor ([OWASP Password Storage CS](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)). Use the `argon2` npm package, because it gives you `hash()` and `verify()`. Node 24.7+ has a built-in `crypto.argon2()`, but it has no verify step, so you would compare and store the parameters yourself ([Node.js crypto docs](https://nodejs.org/api/crypto.html#cryptoargon2syncalgorithm-parameters)). Its stability level was not confirmed.

**TOTP: skip it too.** TOTP means the 6-digit codes from an authenticator app. NIST says codes you type in are **not phishing-resistant** ([NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html)), so they add little on top of a passkey. If you add it anyway, use otplib 13 ([otplib 13.5.0 README](https://cdn.jsdelivr.net/npm/otplib@13.5.0/README.md)). Accept each code only once, as ASVS requires ([OWASP ASVS 5.0 V6](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x15-V6-Authentication.md)). Encrypt the secret with a key kept outside `./data`. Hash the recovery codes.

## Images, CSRF and brute force each need one small guard

**`/uploads` images:** add the same session check to the API's `/uploads` route. `<img src="/uploads/...">` is a same-origin request, so the Strict cookie rides along on its own ([MDN Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)). The Caddyfile already sends `/uploads/*` to the API, so nothing else changes. A grid of 48 photos means 48 small SQLite reads, which is nothing. Use `Cache-Control: private` on those images, never `public`. Signed URLs and a Caddy `forward_auth` hop per image add work for no gain here ([Caddy forward_auth](https://caddyserver.com/docs/caddyfile/directives/forward_auth)).

**CSRF** is when another website tricks your browser into sending a write to your app. The 2025 best practice is one hook, no tokens. On every non-GET request, allow it if `Sec-Fetch-Site` is `same-origin` or `none`. Otherwise allow it only if `Origin` exactly matches your app's name. Go 1.25 ships this exact rule built in, and its author says it has "no false negatives in modern browsers" ([words.filippo.io/csrf](https://words.filippo.io/csrf/)). OWASP now lists Fetch Metadata (the `Sec-Fetch-*` headers) as a main defense, and calls SameSite only a backup layer ([OWASP CSRF Prevention CS](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)). React Router's `fetcher.submit` sends these headers on its own, so the web app needs no change. The hook also guards the login route. Never change data on GET. `@fastify/csrf-protection` is not needed.

**Brute force:** rate-limit `/auth/*` and `/setup/*` to about **5 per minute**. `@fastify/rate-limit` supports per-route `config.rateLimit` ([fastify-rate-limit README](https://github.com/fastify/fastify-rate-limit)). Add a growing delay after each failure, capped at about 15 minutes. NIST's hard ceiling is **100 failures in a row**, then the authenticator is disabled ([NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html)). Never build a lockout that someone on the LAN can trigger to lock you out. Make the CLI the only way to re-enable. Passkeys themselves cannot be guessed. The limit mostly guards the setup link.

**Security headers go in the Caddyfile.** Caddy serves the page itself, so `@fastify/helmet` only covers API answers. Use a strict CSP with `script-src 'self'`. Allow `data:` and `blob:` in `img-src` for the camera. Never put `data:` in `script-src` ([Vite Features](https://vite.dev/guide/features)). Add `frame-ancestors 'none'`, `Referrer-Policy: same-origin` and `Permissions-Policy: camera=(self)`. Test the CSP against the built app and the barcode scanner. It may need `worker-src blob:`.

## Two repo bugs to fix first

Both are real today. I checked them in the code.

**1. No `trustProxy` in `api/src/app.ts`.** Caddy ends HTTPS and forwards to Fastify. Without `trustProxy`, Fastify sees every request as coming from Caddy's container. So the current `@fastify/rate-limit` (line 56) puts **every client in one bucket**. One noisy device can throttle everyone, and a per-IP login limit would not work at all. `@fastify/session` also notes you need `trustProxy` for secure cookies behind a proxy ([@fastify/session README](https://raw.githubusercontent.com/fastify/session/main/README.md)). The fix: `fastify({ trustProxy: true })`. That is safe here because the API container is not published. Or set Caddy's address for a tighter fit.

**2. CORS is on, but the app is same-origin.** Line 54 registers `@fastify/cors` with `origin: env.CORS_ORIGINS`. The web app and API share one origin behind Caddy, so the browser never needs CORS. A loose CORS setting would undercut the CSRF origin check ([OWASP CSRF Prevention CS](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)). The fix: register CORS only in dev, or leave `CORS_ORIGINS` empty in production. Vite's proxy already makes dev same-origin too, so you may be able to drop it entirely.

## Gates in front of the app: good tools, wrong fit for one person who owns the code

| Gate | What it gives | Why not the main plan |
| --- | --- | --- |
| **Tailscale only** | Only approved devices reach the app. No login screen. | Great as the fence. Covers nothing if Caddy still listens on the Wi-Fi, or if a tailnet phone is lost. |
| Caddy `basic_auth` | A 3-line password box (bcrypt or argon2id) ([Caddy basic_auth](https://caddyserver.com/docs/caddyfile/directives/basic_auth)) | No logout, no passkeys, and untested inside the iPhone home-screen app. |
| Caddy `forward_auth` + Authelia / TinyAuth / Pocket ID | A real login page. Authelia has passkeys since v4.39.0 ([Authelia](https://www.authelia.com/overview/authentication/security-key/)). Pocket ID is passkey-only ([GitHub pocket-id](https://github.com/pocket-id/pocket-id)). | One or two more containers to run. Redirects can bounce the iPhone app out to Safari. Needs **Caddy ≥ 2.11.4** for CVE-2026-52845 ([GitLab advisory](https://advisories.gitlab.com/golang/github.com/caddyserver/caddy/v2/CVE-2026-52845/)). |
| Caddy mTLS (client certificates) | Only devices with your certificate get in ([Caddy tls](https://caddyserver.com/docs/caddyfile/directives/tls)) | Spotty on iOS outside Safari ([WebKit bug 158345](https://bugs.webkit.org/show_bug.cgi?id=158345)). |
| In-app OIDC (openid-client + an IdP, or tsidp) | Login handed off to a separate login server | Most moving parts. No extra safety for one user. tsidp is "experimental" ([Tailscale tsidp](https://tailscale.com/docs/features/tsidp)). |

Pick a gate only if you choose *not* to write login code. Then the order is: Tailscale only first, then `forward_auth` with Authelia or Pocket ID. Do not trust a `Remote-User` header in the API unless it can only come through Caddy.

## First run, recovery, and the public demo

**First run:** while no passkey exists, the API makes a random 128-bit token. It stores only the token's hash and logs `Setup: https://<host>/setup#<token>`. You read it with `docker compose logs api`. The setup routes need that token, and they close for good once the first passkey is saved. Never let "first visitor wins". ASVS also bans default accounts ([OWASP ASVS 5.0 V6](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x15-V6-Authentication.md)).

**Lockout recovery:** `docker compose exec api yarn auth:reset`. It deletes all sessions, optionally deletes the passkeys, and prints a new setup link. The server shell is the root of trust. It is no weaker than the SQLite file already on that disk. Immich does the same: it ships a server command to turn login back on ([Immich discussion #24488](https://github.com/immich-app/immich/discussions/24488)). NIST requires a defined recovery path ([NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html)).

**The GitHub Pages demo** never talks to the real API, so none of this touches it. Its mocks just answer `GET /auth/me` as "logged in". Keep any real API URL out of its build.

## What is still unproven

Test three things on your own devices before you lean on them. First, Safari passkeys with a user-installed root CA (only matters if you pick the LAN name). Second, a `__Host-` cookie on an IP host (it should not matter once you stop using the IP). Third, the CSP with the barcode scanner. The "self-hosters agree" claim rests on a single forum comment, so treat it as weak.

## Conclusion

Picking the passkey changes more than the login screen. It makes a hostname a must. It makes Tailscale's real certificate the easy road, not just a remote-access tool. And it removes the password from the threat list: a stolen copy of `./data` holds only public keys and hashed session secrets, so there is nothing in it worth cracking. The biggest risk left is not an outside hacker. It is getting locked out of your own app. That is why the setup link and the `auth:reset` command matter as much as the passkey.

The cheapest high-value move is step 0. `trustProxy` and the CORS cleanup take minutes, fix a live rate-limit bug, and every later layer depends on them. After that, the fence (Tailscale) can go live in an evening. The lock (sessions + passkeys) is a contained `src/modules/auth/` module you can add when you have the energy.
