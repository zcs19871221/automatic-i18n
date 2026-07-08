# English Extraction Strategy

This document explains how English text extraction is decided when `localeToReplace` is `en-us`.

## Goal

English literals are ambiguous. Some are user-facing messages, while others are technical values (keys, paths, identifiers).

The strategy system balances:

1. Safety: avoid breaking code semantics.
2. Automation: reduce manual comments.

## Strategies

- `comment-only`
  Behavior: safest mode. String literals are collected only when inside `auto-i18n-collect-*` ranges.

- `balanced`
  Behavior: collect comment ranges first, then use blacklist + heuristic score for string-like literals.

- `aggressive`
  Behavior: collect almost everything that matches English, except blacklist contexts.

## Decision Order

For each candidate node in English mode:

1. Target locale match check
   If text does not match English regex, skip.

2. Collect comment override
   If node is within collect range, extract directly.

3. Blacklist guard
   If node is blacklisted, never extract.

4. Strategy decision

- `aggressive`: extract.
- `comment-only`: keep legacy behavior (string-like strict; jsx/template remain compatible).
- `balanced`: for string-like literals, extract only if score >= 2.

## Balanced Scoring (`englishTextScore`)

Positive signals:

- Contains spaces: `+2`
- Contains punctuation (`.,!?;:`): `+2`
- Length >= 12: `+1`
- Contains placeholders (`{v1}` or `${...}`): `+1`

Negative signals:

- Contains technical words (`user`, `id`, `key`, `url`, `path`, `class`, `type`): `-2`
- Looks like a short token (`^[a-z][a-z0-9_-]{0,10}$`): `-2`

Threshold:

- Score >= 2: extract
- Score < 2: skip (unless collect comment matched)

## Blacklist Contexts

Current hard-stop contexts include:

1. Type nodes
2. Import declaration strings
3. Object property names
4. Element access keys (for example `obj['key']`)
5. Technical JSX attributes (`className`, `id`, `data-testid`, `key`, `to`, `href`, `src`)
6. String literals that look like technical paths/tokens (`/users/list`, `a/b:c`, etc.)

These are blocked even in `aggressive` mode.

## Code Locations

- Main decision gate: `src/index.ts` -> `shouldExtractLocaleNode`
- Balanced scoring: `src/index.ts` -> `englishTextScore`
- Blacklist rules: `src/index.ts` -> `isEnglishBlacklisted`
- Handler entry points:
  - `src/tsNodeHandlers/StringLikeNodesHandler.ts`
  - `src/tsNodeHandlers/JsxTextHandler.ts`
  - `src/tsNodeHandlers/TemplateHandler.ts`

## Notes for Maintainers

If you change scoring or blacklist rules:

1. Update this document.
2. Update strategy fixtures under `test/englishStrategy/expect`.
3. Run full test suite to verify no regression.
