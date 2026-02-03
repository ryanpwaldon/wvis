# WVIS

A weather visualization project.

The weather app (`apps/weather`) fetches NOAA GFS forecast data and generates vector field PNGs for wind and swell patterns. One PNG per 3-hour interval across a multi-day forecast period, each representing global conditions at a single point in time. These are uploaded to Cloudflare R2, where the Next.js app (`apps/nextjs`) retrieves and renders them using particle animations and interpolated heat maps with custom WebGL shaders.

## Commands

```bash
pnpm dev           # Start dev servers
pnpm weather:sync  # Sync weather data to R2
```
