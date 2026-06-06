const PLAYER_COLORS = [
  '#3B82F6', 
  '#EF4444', 
  '#10B981', 
  '#F59E0B', 
  '#8B5CF6', 
  '#EC4899', 
  '#06B6D4', 
  '#F97316', 
]

export function getPlayerColor(index) {
  if (index < PLAYER_COLORS.length) return PLAYER_COLORS[index]
  const hue = (index * 137.508) % 360
  return `hsl(${hue}, 65%, 55%)`
}