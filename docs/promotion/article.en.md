# I Built a One-Command i18n Migration Tool for Frontend Projects: automatic-i18n

If you have worked on a medium or large frontend codebase, you probably know this moment:

Your team decides to add internationalization, but the code already contains hard-coded UI text everywhere.

Manual migration usually means:

- Replacing strings one by one with i18n calls
- Handling JSX text, template strings, and interpolations
- Managing translation keys and locale files
- Constantly worrying about missed or unsafe replacements

This is slow, error-prone, and hard to scale across a team.

So I built automatic-i18n.

With one command, it scans source files, replaces matched text, and generates locale files.

Project links:

- GitHub: https://github.com/zcs19871221/automatic-i18n
- npm: https://www.npmjs.com/package/automatic-i18n

## What Problem It Solves

automatic-i18n is designed to:

- Reduce migration cost for existing frontend projects
- Keep transformations predictable and reviewable
- Support gradual adoption by folder and by milestone

It is AST-based, not a pure regex replacer, so it handles common code patterns more safely.

## Key Features

- Supports TypeScript, JavaScript, and React
- Handles string literals, JSX text, and template strings
- Integrates with react-intl by default
- Supports hook mode and global mode
- Supports English extraction strategies: comment-only, balanced, aggressive
- Includes a merge command for locale conflict workflows

## 30-Second Quick Start

1. Install dependencies

npm i -D automatic-i18n typescript prettier fs-extra

2. Run migration

npx automatic-i18n -t src

3. Review output

- Hard-coded text is replaced with i18n calls
- Locale files are generated in i18n (default)

## Typical Before/After Scenario

Before migration:

- Components contain hard-coded English/Chinese text
- JSX contains direct UI text
- Template strings are used for user-facing messages

After migration:

- Text becomes formatMessage / FormattedMessage calls
- Template variables are mapped into placeholders
- Locale files include generated keys and defaultMessage entries

## Why Not a Simple String Script

In real projects, these issues happen often:

- Replacing meaningful keys or property values by mistake
- Breaking template semantics when variables are involved
- Frequent locale file conflicts in team collaboration

automatic-i18n adds strategy and guardrails for these cases, especially for English text extraction.

## Who This Is For

- Teams migrating existing projects to i18n
- Developers who want lower migration overhead
- Projects using react-intl (or custom formatter implementations)

## Roadmap

- Stronger safety boundaries for English extraction
- Better migration reports and dry-run support
- More real-world sample projects

If you are migrating a frontend codebase to i18n, I would love to hear your edge cases and feedback.
