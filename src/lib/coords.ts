// AMap raster tiles are published in the GCJ-02 datum, while every route value in this
// app stays WGS 84 so that exported KMZ files match the GPS coordinates a drone expects.
// Vectors are converted to GCJ-02 only for display, and map clicks are converted back.
const PI = Math.PI
const SEMI_MAJOR_AXIS = 6378245.0
const ECCENTRICITY_SQUARED = 0.006693421622965943

const outOfChina = (lon: number, lat: number) => lon < 72.004 || lon > 137.8347 || lat < 0.8293 || lat > 55.8271

const transformLat = (x: number, y: number) => {
  let ret = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
  ret += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2 / 3
  ret += (20 * Math.sin(y * PI) + 40 * Math.sin((y / 3) * PI)) * 2 / 3
  ret += (160 * Math.sin((y / 12) * PI) + 320 * Math.sin((y * PI) / 30)) * 2 / 3
  return ret
}

const transformLon = (x: number, y: number) => {
  let ret = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  ret += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2 / 3
  ret += (20 * Math.sin(x * PI) + 40 * Math.sin((x / 3) * PI)) * 2 / 3
  ret += (150 * Math.sin((x / 12) * PI) + 300 * Math.sin((x / 30) * PI)) * 2 / 3
  return ret
}

export function wgs84ToGcj02(lon: number, lat: number): [number, number] {
  if (outOfChina(lon, lat)) return [lon, lat]
  let dLat = transformLat(lon - 105, lat - 35)
  let dLon = transformLon(lon - 105, lat - 35)
  const radLat = (lat / 180) * PI
  let magic = Math.sin(radLat)
  magic = 1 - ECCENTRICITY_SQUARED * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180) / (((SEMI_MAJOR_AXIS * (1 - ECCENTRICITY_SQUARED)) / (magic * sqrtMagic)) * PI)
  dLon = (dLon * 180) / ((SEMI_MAJOR_AXIS / sqrtMagic) * Math.cos(radLat) * PI)
  return [lon + dLon, lat + dLat]
}

export function gcj02ToWgs84(lon: number, lat: number): [number, number] {
  if (outOfChina(lon, lat)) return [lon, lat]
  let wLon = lon
  let wLat = lat
  for (let step = 0; step < 5; step += 1) {
    const [guessLon, guessLat] = wgs84ToGcj02(wLon, wLat)
    const dLon = guessLon - lon
    const dLat = guessLat - lat
    if (Math.abs(dLon) < 1e-9 && Math.abs(dLat) < 1e-9) break
    wLon -= dLon
    wLat -= dLat
  }
  return [wLon, wLat]
}

// One-off repair for missions drawn before the base maps moved to native WGS 84.
// Those control points were produced by the old buggy inverse (wrong eccentricity,
// /3 instead of *2/3, cos in the latitude denominator), which placed them about
// 120 m east and 130 m south of the feature the user actually clicked. The old
// forward transform below reproduces that bug exactly, so re-forwarding a stored
// point recovers the tile position that was clicked, and the corrected inverse
// then turns it back into the true WGS 84 coordinate.
const legacyTransformLat = (x: number, y: number) => {
  let ret = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.4 * x * x + 0.2 * x * y
  ret += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) / 3
  ret += (20 * Math.sin(y * PI) + 40 * Math.sin((y / 3) * PI)) / 3
  ret += (160 * Math.sin((y / 12) * PI) + 320 * Math.sin((y * PI) / 30)) / 3
  return ret
}

const legacyTransformLon = (x: number, y: number) => {
  let ret = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  ret += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) / 3
  ret += (20 * Math.sin(x * PI) + 40 * Math.sin((x / 3) * PI)) / 3
  ret += (150 * Math.sin((x / 12) * PI) + 300 * Math.sin((x / 30) * PI)) / 3
  return ret
}

const legacyWgs84ToGcj02 = (lon: number, lat: number): [number, number] => {
  if (outOfChina(lon, lat)) return [lon, lat]
  const LEGACY_ECCENTRICITY_SQUARED = 0.008268171458093455
  let dLat = legacyTransformLat(lon - 105, lat - 35)
  let dLon = legacyTransformLon(lon - 105, lat - 35)
  const radLat = (lat / 180) * PI
  let magic = Math.sin(radLat)
  magic = 1 - LEGACY_ECCENTRICITY_SQUARED * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180) / (((SEMI_MAJOR_AXIS * (1 - LEGACY_ECCENTRICITY_SQUARED)) / sqrtMagic) * Math.cos(radLat) * PI)
  dLon = (dLon * 180) / ((SEMI_MAJOR_AXIS / sqrtMagic) * Math.cos(radLat) * PI)
  return [lon + dLon, lat + dLat]
}

// Map a control point saved by the pre-fix build onto its true WGS 84 position.
export function migrateLegacyPoint(lon: number, lat: number): [number, number] {
  const [tileLon, tileLat] = legacyWgs84ToGcj02(lon, lat)
  return gcj02ToWgs84(tileLon, tileLat)
}
