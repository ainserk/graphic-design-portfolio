# Ain Nadhirah — Design Portfolio

A lightweight portfolio site for graphic design, campaign work, branding, print, photography, and motion. It is built with plain HTML, CSS, and JavaScript for fast, dependable Netlify hosting.

## Local preview

Run any static file server from this directory. For example:

```powershell
npx serve .
```

## Media workflow

Original files stay in `Media/` and are excluded from Git because the folder is several gigabytes and includes files larger than GitHub's limit. Web-ready copies live in `assets/`.

To rebuild optimized images and selected video reels after adding work to `Media/`:

```powershell
& "C:\Users\user10\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" .\scripts\prepare_assets.py
```

## Deploy

Netlify needs no build command. Set the publish directory to `.` when importing the GitHub repository.

Before sharing publicly, replace the GitHub contact link in `index.html` with the preferred email or social profile.
