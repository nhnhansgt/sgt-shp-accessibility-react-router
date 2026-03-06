import { z } from "zod";

/**
 * Reusable hex color validator (RRGGBB format)
 */
const hexColorSchema = z.string().regex(
  /^#[0-9A-Fa-f]{6}$/,
  "Invalid hex color (expected #RRGGBB)"
);

export const AccessibilityOptionsSchema = z.object({
  color: hexColorSchema,
  size: z.string().regex(/^\d+$/).transform(Number).pipe(
    z.number().min(24).max(50)
  ),
  background_color: hexColorSchema,
  offsetX: z.number().min(0).max(100),
  offsetY: z.number().min(0).max(100),
  locale: z.enum(["en", "jp"]),
  theme_bg_color: hexColorSchema,
  font: z.coerce.number().int().min(0).max(10),
});

export const AccessibilitySettingsSchema = z.object({
  icon: z.enum([
    "icon-circle",
    "icon-wheelchair",
    "icon-eye",
    "icon-universal",
    "icon-hand",
    "icon-hearing",
  ]).optional(),
  position: z.enum(["top-left", "top-right", "bottom-left", "bottom-right"]).optional(),
  status: z.number().int().min(0).max(1).optional(),
  options: AccessibilityOptionsSchema.optional(),
  statement: z.string().max(100000).optional(),
});

export function validateAccessibilitySettings(data: unknown) {
  return AccessibilitySettingsSchema.safeParse(data);
}
