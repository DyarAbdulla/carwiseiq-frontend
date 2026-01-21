# Next.js Build Cache Error Fix

## Problem
If you see errors like:
```
Error: Cannot find module './869.js'
Error: Cannot find module './329.js'
```

This is a Next.js build cache corruption issue.

## Quick Fix

### Option 1: Use the auto-clean script (Recommended)
```powershell
npm run dev
```
This automatically clears cache before starting.

### Option 2: Manual cleanup
```powershell
npm run clean:win
npm run dev
```

### Option 3: Use the PowerShell script
```powershell
.\clear-cache.ps1
npm run dev
```

## What Was Fixed

1. **Auto-clean on dev start**: The `dev` script now automatically clears cache
2. **Improved webpack config**: Better cache handling in `next.config.js`
3. **Manual cleanup script**: `clear-cache.ps1` for manual cache clearing
4. **Clean build script**: `build` script also clears cache first

## Prevention

The following measures are now in place:
- ✅ Cache is cleared automatically before `npm run dev`
- ✅ Webpack cache configuration improved
- ✅ Build script clears cache before building

## If Errors Still Occur

1. Stop the dev server (Ctrl+C)
2. Run: `npm run clean:win`
3. Run: `npm run dev`

This should resolve 99% of cache-related errors.









