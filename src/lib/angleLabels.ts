const AXIS_LABELS = ['南北走向', '东北—西南走向', '东西走向', '西北—东南走向']
const CARDINALS = ['正北', '东北', '正东', '东南', '正南', '西南', '正西', '西北']

const norm360 = (value: number) => ((Math.round(value) % 360) + 360) % 360

// The lawnmower axis label. rotation is the mathematical angle of the flight lines
// (0 = east-west in local coordinates), so the compass bearing is 90 - rotation and
// an axis only needs its bearing folded into 0-180.
export function axisDescription(rotation: number) {
  const bearing = norm360(90 - rotation) % 180
  const bucket = Math.round(bearing / 45) % 4
  return { label: AXIS_LABELS[bucket], bearing: Math.round(bearing) }
}

export function cardinalDescription(heading: number) {
  return CARDINALS[Math.round(norm360(heading) / 45) % 8]
}
