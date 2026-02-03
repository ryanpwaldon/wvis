# WVIS

A weather visualization project for exploring wind and wave forecasts on an interactive map. Rendered with WebGL using bicubic interpolation for smooth heatmaps and animated particles for directional flow.

The weather app (`apps/weather`) fetches NOAA GFS forecast data, processes it into vector grid PNGs, and uploads to Cloudflare R2. The Next.js app (`apps/nextjs`) renders this data using custom WebGL shaders.
