# Ballad Web Extension

mv3 extension that reads your balatrodle stats from localstorage and posts them to a private discord channel after a one-time discord oauth. no db.

## what it does
- on install: opens discord oauth; you approve the identify scope (username + id only)
- caches your discord user in chrome storage
- on visiting balatrodle.com: reads stats (wins, streak, avg guesses, last win), logs them, and posts an embed to a discord webhook
- never touches dms, servers, or non‑public discord data

## quick start (user)
1. install the extension
2. accept the discord oauth prompt
3. go to https://www.balatrodle.com/ and play at least one game
4. (optionally) open devtools (f12) to see what’s collected/sent

## install from source (dev)
- requirements: node 18+, chrome
- clone, then:
  - `npm i`
  - `npm run build`
- load unpacked:
  - visit `chrome://extensions/`
  - enable developer mode
  - load folder containing `manifest.json`, `dist/`, `icons/` 
  - copy extension id, change background.js to use that id, then re-unpack extension
  folder should look this this:
   /root
   |-- dist/
   |-- icons/
   `-- manifest.json

## support
- email: `casper_jb@icloud.com`
- discord: `casjb`
