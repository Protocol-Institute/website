// GitHub usernames on member profiles (migration 066). Accepts a bare name, @name or a
// github.com profile URL, and returns { value } (null when empty) or { error }.
// GitHub's rule: 1-39 letters, digits or single hyphens, not starting or ending with one.

const USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function normalizeGithubUser(input) {
  let v = String(input ?? '').trim();
  if (!v) return { value: null };
  const url = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/?#]+)/i.exec(v);
  if (url) v = url[1];
  v = v.replace(/^@/, '');
  return USERNAME.test(v) ? { value: v } : { error: 'That does not look like a GitHub username' };
}
