# How to Publish Drawtir SDK to NPM

This guide will walk you through publishing the Drawtir SDK to npm so developers can install it with `npm install drawtir-sdk`.

## Prerequisites

1. **NPM Account**
   - Create an account at https://www.npmjs.com/signup
   - Verify your email address

2. **Node.js and NPM**
   - Install Node.js (v16 or higher) from https://nodejs.org
   - NPM comes bundled with Node.js

## Step 1: Login to NPM

Open your terminal and login to npm:

```bash
npm login
```

Enter your npm username, password, and email when prompted.

## Step 2: Prepare Your Package

### 2.1 Install Build Dependencies

First, install the required build tool:

```bash
npm install --save-dev tsup
```

### 2.2 Update package.json

Edit `sdk/package.json` and update these fields:

```json
{
  "name": "drawtir-sdk",  // Must be unique on npm
  "version": "1.0.0",     // Start with 1.0.0
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/drawtir-sdk.git"
  },
  "homepage": "https://yourdomain.com"
}
```

**⚠️ Important:**
- The `name` field must be unique. Check availability: `npm view drawtir-sdk`
- If taken, use a scoped package: `@your-username/drawtir-sdk`

### 2.3 Create Build Configuration

Create `sdk/tsup.config.ts`:

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/sdk/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
});
```

## Step 3: Organize Your SDK Files

Create a proper SDK directory structure:

```
sdk/
├── package.json
├── README.md
├── LICENSE
├── tsup.config.ts
└── src/
    ├── index.ts          (export everything)
    ├── DrawtirSDK.ts
    ├── DrawtirEmbed.tsx
    └── types.ts
```

Copy your SDK files from `src/sdk/` to this new `sdk/src/` directory.

## Step 4: Build the Package

From the `sdk` directory, run:

```bash
npm run build
```

This creates a `dist/` folder with:
- `index.js` (CommonJS)
- `index.mjs` (ES Modules)
- `index.d.ts` (TypeScript types)

## Step 5: Test Locally (Optional but Recommended)

Before publishing, test your package locally:

```bash
# In the sdk directory
npm link

# In your test project
npm link drawtir-sdk
```

Then try importing it in your test project to make sure it works.

## Step 6: Publish to NPM

### First-time Publish

```bash
cd sdk
npm publish
```

If using a scoped package:

```bash
npm publish --access public
```

### Update Existing Package

When you make changes:

1. Update the version in `package.json`:
   ```bash
   npm version patch  # For bug fixes (1.0.0 → 1.0.1)
   npm version minor  # For new features (1.0.0 → 1.1.0)
   npm version major  # For breaking changes (1.0.0 → 2.0.0)
   ```

2. Publish the new version:
   ```bash
   npm publish
   ```

## Step 7: Verify Publication

Check your package on npm:

```bash
npm view drawtir-sdk
```

Or visit: https://www.npmjs.com/package/drawtir-sdk

## Step 8: Test Installation

Test that others can install it:

```bash
npm install drawtir-sdk
```

## Common Issues and Solutions

### "Package name already exists"
- Use a scoped package: `@your-username/drawtir-sdk`
- Update the `name` field in `package.json`

### "You must verify your email"
- Check your email and click the verification link
- Or run: `npm adduser` and follow prompts

### "Build errors"
- Make sure all imports are relative and correct
- Check that `tsup` is installed: `npm install --save-dev tsup`
- Verify `tsconfig.json` is properly configured

### "Missing dependencies"
- Add React as peer dependencies (already done in package.json)
- Don't bundle React with your SDK

## Best Practices

1. **Versioning**: Follow semantic versioning (semver)
   - MAJOR: Breaking changes
   - MINOR: New features (backward compatible)
   - PATCH: Bug fixes

2. **Testing**: Test locally before publishing
   ```bash
   npm pack  # Creates a .tgz file
   npm install ./drawtir-sdk-1.0.0.tgz  # Test in another project
   ```

3. **Changelog**: Keep a CHANGELOG.md file documenting changes

4. **Git Tags**: Tag releases in git
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

5. **Documentation**: Keep README.md up to date with examples

## Automated Publishing (Optional)

### Using GitHub Actions

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to NPM

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Add your NPM token as a GitHub secret.

## Quick Reference

```bash
# Login to npm
npm login

# Check if package name is available
npm view drawtir-sdk

# Build the package
npm run build

# Test build output
npm pack

# Publish
npm publish

# Update version
npm version patch|minor|major

# Unpublish (within 72 hours only)
npm unpublish drawtir-sdk@1.0.0
```

## Support

If you encounter issues:
- NPM Documentation: https://docs.npmjs.com/
- NPM Support: https://www.npmjs.com/support
- Check existing similar packages for reference

---

## Summary

1. Create npm account and login
2. Prepare package.json with correct metadata
3. Build with tsup
4. Test locally with npm link
5. Publish with npm publish
6. Update version for changes
7. Re-publish updates

Your SDK is now available for the world to use! 🚀
