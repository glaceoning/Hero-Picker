# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OverPicker (overpicker.com) is an Overwatch 2 hero picker and team composition calculator. Users select heroes for ally/enemy teams, and the tool scores each hero based on counters, synergies, map advantages, and tier rankings. It also supports hero bans and a keyboard-first Quick Add overlay.

## Tech Stack

- **Backend**: Laravel 10 (PHP 8.1+) — serves Blade views and acts as a pass-through for hero data JSON stored in `storage/api/hero-data/`
- **Frontend**: Vanilla JavaScript (ES modules) with Tailwind CSS 3. No framework; uses an MVC pattern
- **Build**: Vite with laravel-vite-plugin for Laravel dev; standalone `npx tailwindcss` for the GitHub Pages build
- **Deployment**: GitHub Pages (static). The CI workflow snapshots API data at build time and assembles a static site from `gh-pages/index.html` + `public/` assets

## Commands

```bash
# Install dependencies
composer install
npm install

# Development (Laravel + Vite hot reload)
php artisan serve
npm run dev

# Production CSS build
npm run build

# Run PHP tests
php artisan test
# or
vendor/bin/phpunit

# Run a single test file
vendor/bin/phpunit tests/Feature/ExampleTest.php

# Lint PHP (Laravel Pint)
vendor/bin/pint

# Build the static GitHub Pages site locally (mirrors the CI workflow)
rm -rf dist && mkdir -p dist/css dist/js dist/images
cp gh-pages/index.html dist/index.html
cp -r public/js/. dist/js/
cp -r public/images/. dist/images/
npx tailwindcss -c tailwind.config.js -i resources/css/app.css -o dist/css/app.css --minify
```

## Architecture

### Dual Deployment Model

The app runs in two modes:
1. **Laravel mode** (`php artisan serve`): Blade templates at `resources/views/`, routes in `routes/web.php`, controller at `app/Http/Controllers/OverpickerController.php`
2. **Static GitHub Pages mode**: `gh-pages/index.html` is the entry point. No PHP runs; API JSON is fetched at CI build time and saved to `dist/api/`. The JS detects `github.io` hostname and swaps the API base URL accordingly (`calculator.js` lines 18-21).

### Frontend MVC (vanilla JS, no framework)

Entry point: `public/js/calculator.js` — instantiates the MVC triad and loads API data.

```
public/js/
├── calculator.js              # App bootstrap
├── utils/constants.js         # API URLs, scoring weights, LASTUPDATE
├── api/model-api.js           # Fetches and caches API data in localStorage
├── models/
│   ├── model-overpicker.js    # Root model: teams, options, selections, bans
│   ├── model-team.js          # Team model: hero loading, score calculation
│   ├── model-hero.js          # Hero model: per-hero scoring (tiers, counters, synergies, maps, ADC)
│   ├── model-tier.js          # Tier ranking model
│   ├── model-map.js           # Map model
│   └── model-map-type.js      # Map type model (Assault, Control, etc.)
├── views/
│   ├── view-overpicker.js     # Main view: DOM construction, rendering, event binding
│   └── view-quick-add.js      # Quick Add overlay (Q key): keyboard-first hero picker
└── controllers/
    └── controller-overpicker.js # Wires model ↔ view, handles user actions
```

### Scoring System

Hero scores are calculated in `ModelHero.calcScore()` using weighted components defined in `constants.js`:
- **Tier** (weight 1/10): Hero's tier value offset by `TIER_MIN (-5)`
- **Counters** (weight 1/10): Sum of counter values against enemy heroes, offset by `MIN_COUNTER_VALUE (20)`
- **Synergies** (weight 2/10): Sum of synergy values with allied heroes, offset by `MIN_SINERGY_VALUE (20)`
- **Map/ADC** (weight 2/10): Map-specific + attack/defense/control advantage, offset by `MIN_MAPAD_VALUE (20)`

"Weighted Scores" mode (hidden option) applies these weights; unweighted mode adds raw values.

### Echo Handling

Echo gets special scoring (`calcEchoScore`): it evaluates what hero Echo should copy by scoring as if she were each selected allied hero against the enemy team. `bestCopyHeroes` tracks which copy targets yield the highest score.

### Data Flow

1. `ModelAPI` loads cached data from `localStorage` immediately (instant render)
2. Then fetches fresh data from the API sequentially (map info → map types → tiers → hero info → images → counters → synergies → maps → ADC → version)
3. Each fetch updates the model and persists to `localStorage`
4. A `LASTUPDATE` constant in `constants.js` triggers a full `localStorage.clear()` when bumped

### Key UI Interactions

- **Hero selection**: Click hero figures to toggle selection. Role Lock enforces 1-2-2 composition
- **Quick Add** (Q key): Two-step overlay — pick team (1/2/3), then type hero name to filter
- **Border rotation**: Shift+click on a selected hero cycles border colors (none → green → yellow → red)
- **Hero Bans**: Up to 4 banned heroes, dimmed and unselectable. Accessible via button or Quick Add step 3
- **Options panel**: Checkboxes for Role Lock, Tier Mode, 5v5. Gear icon reveals Map Pools, Hero Rotation, Weighted Scores

### Laravel Backend

The PHP backend is minimal. `OverpickerController` reads JSON from `storage/api/hero-data/` and passes it to Blade views. Pages: home (calculator), tiers, counters, synergies, about, sources, privacy, trackers. The API routes file only has the default Sanctum user endpoint; the actual hero data API is served separately at `api.overpicker.com`.
