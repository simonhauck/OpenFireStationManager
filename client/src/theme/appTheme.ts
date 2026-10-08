import { defineTheme } from "@astryxdesign/core/theme"
import { neutralTheme } from "@astryxdesign/theme-neutral"

export const appTheme = defineTheme({
  name: "open-fire-station",
  extends: neutralTheme,
  typography: {
    body: {
      family: "Outfit",
      fallbacks: "ui-sans-serif, system-ui, sans-serif",
    },
    code: { family: "Fira Code", fallbacks: "ui-monospace, monospace" },
  },
  tokens: {
    "--color-background-body": [
      "oklch(0.9383 0.0042 236.4993)",
      "oklch(0.2178 0 0)",
    ],
    "--color-background-surface": ["oklch(1 0 0)", "oklch(0.253 0 0)"],
    "--color-background-card": ["oklch(1 0 0)", "oklch(0.271 0 0)"],
    "--color-background-popover": ["oklch(1 0 0)", "oklch(0.285 0 0)"],
    "--color-background-muted": [
      "oklch(0.9846 0.0017 247.8389)",
      "oklch(0.245 0 0)",
    ],
    "--color-text-primary": ["oklch(0.3211 0 0)", "oklch(0.9219 0 0)"],
    "--color-text-secondary": [
      "oklch(0.551 0.0234 264.3637)",
      "oklch(0.5999 0 0)",
    ],
    "--color-accent": [
      "oklch(0.642 0.1691 38.5815)",
      "oklch(0.642 0.1691 38.5815)",
    ],
    "--color-on-accent": ["oklch(1 0 0)", "oklch(1 0 0)"],
    "--color-accent-muted": [
      "oklch(0.642 0.1691 38.5815 / 0.14)",
      "oklch(0.642 0.1691 38.5815 / 0.22)",
    ],
    "--color-text-accent": [
      "oklch(0.6397 0.172 36.4421)",
      "oklch(0.7859 0.1342 83.6986)",
    ],
    "--color-error": [
      "oklch(0.6368 0.2078 25.3313)",
      "oklch(0.6368 0.2078 25.3313)",
    ],
    "--color-border": ["oklch(0.8452 0 0)", "oklch(0.329 0 0)"],
    "--color-border-emphasized": ["oklch(0.8452 0 0)", "oklch(0.329 0 0)"],
  },
  adaptations: {
    rules: [
      {
        when: { pointer: "coarse" },
        value: {
          tokens: {
            "--size-element-sm": "36px",
            "--size-element-md": "48px",
            "--size-element-lg": "48px",
          },
        },
      },
    ],
  },
  components: {
    // Chips are rounded rectangles, not pills.
    badge: {
      base: {
        borderRadius: "6px",
      },
      // Astryx's neutral badge is a solid grey block. The app uses neutral
      // badges for informational chips (sizes, locations, roles), so a tinted
      // chip reads better and keeps dark mode from looking washed out.
      "variant:neutral": {
        backgroundColor: "var(--color-neutral)",
        borderColor: "var(--color-border)",
        borderStyle: "solid",
        borderWidth: "1px",
        color: "var(--color-text-primary)",
      },
    },
  },
})
