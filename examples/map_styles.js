/* Copyright (c) Harris Hudson 2025 */

export const surface_temperature_kelvin_stops = [
  { value: 223.15, color: "#7300a6", opacity: 1}, // Deep purple, extreme cold
  { value: 233.15, color: "#9900ff", opacity: 1 }, // Purple, very cold
  { value: 243.15, color: "#6f00ff", opacity: 1 }, // Violet, very cold
  { value: 253.15, color: "#0000ff", opacity: 1 }, // Blue, cold
  { value: 263.15, color: "#007fff", opacity: 1 }, // Sky blue, cold to cool
  { value: 273.15, color: "#00bfff", opacity: 1 }, // Cyan, freezing point
  { value: 278.15, color: "#00ffff", opacity: 1 }, // Aqua, cool
  { value: 283.15, color: "#66ffcc", opacity: 1 }, // Light green, mild
  { value: 288.15, color: "#99ff99", opacity: 1 }, // Green, mild to warm
  { value: 293.15, color: "#ccff66", opacity: 1 }, // Yellow-green, warm
  { value: 298.15, color: "#ffff00", opacity: 1 }, // Yellow, warm to hot
  { value: 303.15, color: "#ffc100", opacity: 1 }, // Orange-yellow, hot
  { value: 308.15, color: "#ff8000", opacity: 1 }, // Orange, very hot
  { value: 313.15, color: "#ff4000", opacity: 1 }, // Red-orange, extreme heat
  { value: 318.15, color: "#ff0000", opacity: 1 }, // Red, extreme heat
  { value: 323.15, color: "#b30000", opacity: 1 }  // Deep red, searing heat
 ]

export const surface_temperature_celsius_stops = [
  { value: -50, color: "#7300a6", opacity: 1 }, // Deep purple, extreme cold
  { value: -40, color: "#9900ff", opacity: 1 }, // Purple, very cold
  { value: -30, color: "#6f00ff", opacity: 1 }, // Violet, very cold
  { value: -20, color: "#0000ff", opacity: 1 }, // Blue, cold
  { value: -10, color: "#007fff", opacity: 1 }, // Sky blue, cold to cool
  { value: 0,   color: "#00bfff", opacity: 1 }, // Cyan, freezing point
  { value: 5,   color: "#00ffff", opacity: 1 }, // Aqua, cool
  { value: 10,  color: "#66ffcc", opacity: 1 }, // Light green, mild
  { value: 15,  color: "#99ff99", opacity: 1 }, // Green, mild to warm
  { value: 20,  color: "#ccff66", opacity: 1 }, // Yellow-green, warm
  { value: 25,  color: "#ffff00", opacity: 1 }, // Yellow, warm to hot
  { value: 30,  color: "#ffc100", opacity: 1 }, // Orange-yellow, hot
  { value: 35,  color: "#ff8000", opacity: 1 }, // Orange, very hot
  { value: 40,  color: "#ff4000", opacity: 1 }, // Red-orange, extreme heat
  { value: 45,  color: "#ff0000", opacity: 1 }, // Red, extreme heat
  { value: 50,  color: "#b30000", opacity: 1 }  // Deep red, searing heat
 ]

export const wind_magnitude_cell_stops = [
  { value: 0, color: "#ffffff" },
  { value: 1, color: "#cce6ff" },
  { value: 5, color: "#66b3ff" },
  { value: 10, color: "#0066cc" },
  { value: 15, color: "#ffcc00" },
  { value: 20, color: "#ff6600" },
  { value: 25, color: "#cc0000" }
 ]

export const wind_magnitude_arrow_stops = [
  { value: 0, color: "#cccccc" },  // Gray (calm)
  { value: 2, color: "#00e6e6" },  // Cyan (light wind)
  { value: 6, color: "#ffdd00" },  // Yellow (moderate wind)
  { value: 11, color: "#ff6600" }, // Orange (strong wind)
  { value: 16, color: "#cc00ff" }, // Purple (very strong)
  { value: 21, color: "#ffffff" }  // White (extreme wind)
 ]
