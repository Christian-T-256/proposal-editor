export const THEMES = [
  {
    id: "cedar",
    label: "Cedar",
    description: "Warm paper, evergreen type, and amber details",
  },
  {
    id: "blueprint",
    label: "Blueprint",
    description: "Cool paper, navy structure, and signal blue details",
  },
  {
    id: "clay",
    label: "Clay",
    description: "Soft sand, dark brown type, and terracotta details",
  },
] as const;

export function isTheme(value: string): boolean {
  return THEMES.some((theme) => theme.id === value);
}
