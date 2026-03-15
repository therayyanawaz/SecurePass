# SecurePass

Privacy-first password generator and local vault built with Next.js.

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=flat-square)](https://pass.therayyanawaz.co.in/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](./LICENSE)

SecurePass runs entirely in the browser. You can generate passwords, save them locally, organize them with categories, export backups, and install the app as a PWA with offline support for cached pages and assets.

## Features

- In-browser password generator with configurable length and character rules
- Local password vault stored in browser `localStorage`
- Category management, filtering, bulk actions, and analytics dashboard
- Import and export support for `JSON`, `CSV`, and `TXT`
- Light and dark theme support with system preference detection
- Installable PWA with manifest, service worker, and offline fallback
- Zero-backend architecture with no account required

## Privacy and Storage

- Passwords stay in the current browser unless you export them yourself.
- Saved data is browser-specific and device-specific.
- Clearing browser site data will remove stored passwords and categories.
- Existing cookie-based vault data is migrated automatically to `localStorage`.
- No remote database or server-side account storage is used by default.

## PWA Support

SecurePass now includes Progressive Web App support:

- Web app manifest at `/manifest.webmanifest`
- Service worker at `/sw.js`
- Install icons for Android and Apple devices
- Offline fallback page for failed navigations
- Cached support for the app shell, icons, and previously visited pages/assets

Note: the service worker is only registered in production builds.

## Quick Start

### Requirements

- Node.js 18.18+ recommended
- `pnpm` via Corepack, or `npm`

### Install

```bash
git clone https://github.com/therayyanawaz/SecurePass.git
cd SecurePass
corepack pnpm install
```

If you prefer `npm`:

```bash
npm install
```

### Development

```bash
corepack pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
corepack pnpm build
corepack pnpm start
```

Use a production run when testing installability, service workers, and offline behavior.

## Available Scripts

```bash
corepack pnpm dev
corepack pnpm build
corepack pnpm start
corepack pnpm lint
```

Equivalent `npm run <script>` commands also work.

## Tech Stack

- Next.js 15
- React 19
- TypeScript 5
- Tailwind CSS 4
- Radix UI
- Lucide React
- next-themes
- Three.js with `@react-three/fiber`
- Browser `localStorage`

## Deployment

SecurePass can be deployed to any platform that supports Next.js production builds, including:

- Vercel
- Netlify
- Cloudflare
- Self-hosted Node environments

### Vercel

This repository is configured for Vercel out of the box:

- Framework preset: `Next.js`
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build`
- Node.js runtime: `>=18.18.0`

To deploy:

1. Import the repository into Vercel.
2. Keep the detected framework as `Next.js`.
3. Use the default root directory.
4. Deploy.

If you prefer the CLI:

```bash
pnpm dlx vercel
pnpm dlx vercel --prod
```

After deployment, verify the following in production:

- `/manifest.webmanifest` loads correctly
- `/sw.js` is served with no-cache headers
- the app can be installed
- cached routes still open when offline

## Roadmap

- [x] 3D password visualization
- [x] Password dashboard with categories and analytics
- [x] Import and export tools
- [x] PWA support with offline fallback
- [ ] Password health checks and breach detection
- [ ] Biometric vault access with WebAuthn
- [ ] Browser extension support

## Contributing

1. Fork the repository.
2. Install dependencies with `corepack pnpm install`.
3. Run the dev server with `corepack pnpm dev`.
4. Build before submitting changes with `corepack pnpm build`.
5. Open a pull request with a clear summary of the change.

## License

MIT. See [LICENSE](./LICENSE).
