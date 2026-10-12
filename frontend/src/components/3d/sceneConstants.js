/**
 * Himalayan Dusk 3D Scene Palette Constants
 * Single source of truth for Three.js / React-Three-Fiber materials, lights, and fog.
 * References exact Himalayan Dusk tokens:
 * navy #14213D | navy-deep #0D1730 | dusk #1F3358 | saffron #FCA311 | snow #F7F7F2 | pine #2D6A4F
 */

export const SCENE_COLORS = {
  // Ambient & Directional Lighting
  ambientLight: "#F7F7F2",       // Soft snow ambient
  sunLight: "#FCA311",           // Warm saffron golden hour sun
  fillLight: "#1F3358",          // Cool dusk fill light
  fog: "#14213D",                // Navy mountain haze

  // Terrain & Peaks
  distantMountains: "#1F3358",   // Dusk ridgeline
  midMountains: "#14213D",       // Navy slope
  snowCaps: "#F7F7F2",           // Snow covered peaks
  glacierRidge: "#E4E7EF",       // Mist rock faces
  groundPlateau: "#1F3358",      // Dusk plateau
  campsitePlot: "#14213D",       // Navy demarcated plot ground

  // Flora (Pine & Alpine Wood)
  treeFoliageDark: "#2D6A4F",    // Pine foliage deep
  treeFoliageLight: "#388262",   // Pine foliage highlight
  treeFoliageTip: "#DDEFE5",     // Pine mist frost tip
  woodTrunk: "#0D1730",          // Deep dark cedar bark
  fencePosts: "#0D1730",         // Deep wooden markers

  // Campfire & Warm Highlights
  tentFabric: "#FCA311",         // Saffron illuminated expedition tent
  tentBase: "#E8920A",           // Saffron-hover base trim
  fireGlow: "#FCA311",           // Saffron fire glow
  fireCore: "#FCA311",           // Saffron flame
  lanternLight: "#FCA311",       // Warm saffron beacon
  stones: "#5C677D",             // Slate river stones
};
