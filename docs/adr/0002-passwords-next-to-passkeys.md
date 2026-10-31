# Passwords next to passkeys

This reverses "passkeys only" (decided 2026-10-23). With more users than its owner, a passkey asks too much of people who just want to sign in from any device, so every user, admins included, can sign in with a password or a passkey. The app stays behind Tailscale and the users are trusted, so the aim is strong, not overkill: at least 15 characters (NIST SP 800-63B for a password used alone), no character-mix rules, a built-in list of common passwords refused, argon2id hashes, a cap on tries per minute and no account lockout (anyone could trigger it). Still no TOTP, no email and no "auth off" switch.

Admins create every user and give them an app-made temporary password (shown once, dead after 7 days unused) that must be replaced before anything else. The setup link stays only for the first admin and for `auth:reset`.

## Considered Options

- **Admin-made one-time sign-in link per device**: rejected, people know passwords and it needs the admin each time a device is added.
- **Passkeys required for admins**: rejected as overkill behind Tailscale; admin actions need a sign-in from the last 10 minutes instead.
