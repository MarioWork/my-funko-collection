// The person who uses the app. The API keeps a display name and, once a password is set, the username that signs
// in with it (lower-case). Never the password: only its hash, on the server.
export interface AuthUserApiModel {
  name: string;
  username: string | null;
}
