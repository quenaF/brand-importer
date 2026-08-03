# Use Brand Importer with Replit Agent

Brand Importer follows the open Agent Skills specification and can be installed into a Replit project at `/.agents/skills/import-brand`.

## Install from the public repository

Run this in the Replit Shell from the host application project:

```bash
npx skills add quenaF/brand-importer --skill import-brand -a replit
```

For a non-interactive install:

```bash
npx skills add quenaF/brand-importer --skill import-brand -a replit -y
```

Then confirm the files exist:

```bash
find .agents/skills/import-brand -maxdepth 3 -type f -print
```

Expected core files:

```text
.agents/skills/import-brand/
├── SKILL.md
└── references/
    ├── HOST_AGENT.md
    └── REPLIT.md
```

## Use it in Replit Agent

Once installed, ask Agent to use the skill while planning or implementing a white-label integration. For example:

> Use the import-brand skill to inspect this project, propose an Experience Profile, and identify the Domain Adapter contract we need. Do not modify application code until I confirm the profile.

For a live brand import:

> Use the import-brand skill to import the authorized organization website, preserve evidence and uncertainty, prepare owner-review decisions, and export a runtime brand. Do not use any bundled example or previous tenant as fallback.

## Important separation

Installing the skill teaches Replit Agent the workflow and safety boundaries. It does not automatically install or run the companion Node.js library.

When the host project needs the executable importer, use the source repository or package distribution and validate it in the host environment. The host remains responsible for:

- the confirmed Experience Profile;
- the project-specific Domain Adapter;
- runtime storage and preview behavior;
- owner review and asset rights;
- disposal of importer-owned session state.

## Update or remove

Update installed skills with:

```bash
npx skills update import-brand -y
```

Remove it with:

```bash
npx skills remove import-brand
```
