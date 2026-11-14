// AMap raster tiles are published in the GCJ-02 datum, while every route value in this
// app stays WGS 84 so that exported KMZ files match the GPS coordinates a drone expects.
// Vectors are converted to GCJ-02 only for display, and map clicks are converted back.
const PI = Math.PI
const SEMI_MAJOR_AXIS = 6378245.0
const ECCENTRICITY_SQUARED = 0.008268171458093455

const outOfChina = (lon: number, lat: number) => lon < 72.004 || lon > 137.8347 || lat < 0.8293 || lat > 55.8271

const transformLat = (x: number, y: number) => {
  let ret = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.4 * x * x + 0.2 * x * y
  ret += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) / 3
  ret += (20 * Math.sin(y * PI) + 40 * Math.sin((y / 3) * PI)) / 3
  ret += (160 * Math.sin((y / 12) * PI) + 320 * Math.sin((y * PI) / 30)) / 3
  return ret
}

const transformLon = (x: number, y: number) => {
  let ret = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  ret += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) / 3
  ret += (20 * Math.sin(x * PI) + 40 * Math.sin((x / 3) * PI)) / 3
  ret += (150 * Math.sin((x / 12) * PI) + 300 * Math.sin((x / 30) * PI)) / 3
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
  dLat = (dLat * 180) / (((SEMI_MAJOR_AXIS * (1 - ECCENTRICITY_SQUARED)) / sqrtMagic) * Math.cos(radLat) * PI)
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
