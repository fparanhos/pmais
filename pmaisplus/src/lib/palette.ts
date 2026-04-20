// Paleta de acentos por seção (categoria/tipo). Cores harmônicas com a marca
// Pmais e com contraste suficiente para indicar grupos distintos em listas.
export const SECTION_PALETTE = [
  { solid: "#2FB5AD", soft: "#E6F7F5" }, // teal
  { solid: "#4C0DB3", soft: "#EFE7FB" }, // roxo
  { solid: "#3B82F6", soft: "#DBEAFE" }, // azul
  { solid: "#F59E0B", soft: "#FEF3C7" }, // âmbar
  { solid: "#06B6D4", soft: "#CFFAFE" }, // ciano
  { solid: "#EC4899", soft: "#FCE7F3" }, // pink
  { solid: "#6366F1", soft: "#E0E7FF" }, // indigo
  { solid: "#F43F5E", soft: "#FFE4E6" }, // rose
  { solid: "#84CC16", soft: "#ECFCCB" }, // lime
  { solid: "#F97316", soft: "#FFEDD5" }, // orange
  { solid: "#8B5CF6", soft: "#EDE9FE" }, // violet
  { solid: "#64748B", soft: "#E2E8F0" }, // slate
] as const;

export function sectionColor(index: number) {
  return SECTION_PALETTE[index % SECTION_PALETTE.length];
}
