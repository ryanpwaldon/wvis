# WVIS

Particle-based weather visualisation using Mapbox and NOAA Global Forecast System (GFS) forecast data (wind/waves).

The weather app `apps/weather` fetches NOAA GFS forecast data, generates vector field PNGs for wind and wave patterns, and uploads them to Cloudflare R2. The Next.js app `apps/nextjs` retrieves these PNGs and renders them on an interactive map with heatmap and particle shaders – upsampling each frame for smoother gradients and trajectories.

<img src="preview.png" alt="WVIS preview" style="max-width: 512px;">

## Setup

Copy `.env.example` to `.env` and fill in the required values. You'll need a [Mapbox](https://www.mapbox.com/) API key and a [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket with API credentials to generate and serve the weather data.

## Commands

```bash
pnpm weather:sync  # Fetch/process/upload forecast data
pnpm dev           # Serve nextjs app
```
