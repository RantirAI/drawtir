import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  safelist: [
    // Animation classes safelisted for dynamic usage
    "animate-fade-in","animate-fade-out",
    "animate-zoom-in","animate-zoom-out",
    "animate-slide-in-from-top","animate-slide-in-from-bottom","animate-slide-in-from-left","animate-slide-in-from-right",
    "animate-slide-out-to-top","animate-slide-out-to-bottom","animate-slide-out-to-left","animate-slide-out-to-right",
    // Hover variants for previews
    "group-hover:animate-fade-in","group-hover:animate-fade-out",
    "group-hover:animate-zoom-in","group-hover:animate-zoom-out",
    "group-hover:animate-slide-in-from-top","group-hover:animate-slide-in-from-bottom","group-hover:animate-slide-in-from-left","group-hover:animate-slide-in-from-right",
    "group-hover:animate-slide-out-to-top","group-hover:animate-slide-out-to-bottom","group-hover:animate-slide-out-to-left","group-hover:animate-slide-out-to-right",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Instrument Sans", "Inter", "system-ui", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        roboto: ["Roboto", "sans-serif"],
        "open-sans": ["Open Sans", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
        lato: ["Lato", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
        nunito: ["Nunito", "sans-serif"],
        raleway: ["Raleway", "sans-serif"],
        oswald: ["Oswald", "sans-serif"],
        merriweather: ["Merriweather", "serif"],
        playfair: ["Playfair Display", "serif"],
        "source-sans": ["Source Sans 3", "sans-serif"],
        "pt-sans": ["PT Sans", "sans-serif"],
        quicksand: ["Quicksand", "sans-serif"],
        crimson: ["Crimson Text", "serif"],
        ubuntu: ["Ubuntu", "sans-serif"],
        bebas: ["Bebas Neue", "sans-serif"],
        lobster: ["Lobster", "cursive"],
        pacifico: ["Pacifico", "cursive"],
        dancing: ["Dancing Script", "cursive"],
        caveat: ["Caveat", "cursive"],
        righteous: ["Righteous", "cursive"],
        "archivo-black": ["Archivo Black", "sans-serif"],
        anton: ["Anton", "sans-serif"],
        abril: ["Abril Fatface", "serif"],
        satisfy: ["Satisfy", "cursive"],
        "great-vibes": ["Great Vibes", "cursive"],
        sacramento: ["Sacramento", "cursive"],
        tangerine: ["Tangerine", "cursive"],
        josefin: ["Josefin Sans", "sans-serif"],
        "libre-baskerville": ["Libre Baskerville", "serif"],
        "eb-garamond": ["EB Garamond", "serif"],
        "cormorant": ["Cormorant Garamond", "serif"],
        "work-sans": ["Work Sans", "sans-serif"],
        bitter: ["Bitter", "serif"],
        barlow: ["Barlow", "sans-serif"],
        "dm-sans": ["DM Sans", "sans-serif"],
        "space-grotesk": ["Space Grotesk", "sans-serif"],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          warm: "hsl(var(--accent-warm))",
          "warm-foreground": "hsl(var(--accent-warm-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          from: {
            opacity: "0",
          },
          to: {
            opacity: "1",
          },
        },
        "fade-out": {
          from: {
            opacity: "1",
          },
          to: {
            opacity: "0",
          },
        },
        "zoom-in": {
          from: {
            opacity: "0",
            transform: "scale(0.5)",
          },
          to: {
            opacity: "1",
            transform: "scale(1)",
          },
        },
        "zoom-out": {
          from: {
            opacity: "1",
            transform: "scale(1)",
          },
          to: {
            opacity: "0",
            transform: "scale(0.5)",
          },
        },
        "slide-in-from-top": {
          from: {
            transform: "translateY(-100%)",
          },
          to: {
            transform: "translateY(0)",
          },
        },
        "slide-in-from-bottom": {
          from: {
            transform: "translateY(100%)",
          },
          to: {
            transform: "translateY(0)",
          },
        },
        "slide-in-from-left": {
          from: {
            transform: "translateX(-100%)",
          },
          to: {
            transform: "translateX(0)",
          },
        },
        "slide-in-from-right": {
          from: {
            transform: "translateX(100%)",
          },
          to: {
            transform: "translateX(0)",
          },
        },
        "slide-out-to-top": {
          from: {
            transform: "translateY(0)",
          },
          to: {
            transform: "translateY(-100%)",
          },
        },
        "slide-out-to-bottom": {
          from: {
            transform: "translateY(0)",
          },
          to: {
            transform: "translateY(100%)",
          },
        },
        "slide-out-to-left": {
          from: {
            transform: "translateX(0)",
          },
          to: {
            transform: "translateX(-100%)",
          },
        },
        "slide-out-to-right": {
          from: {
            transform: "translateX(0)",
          },
          to: {
            transform: "translateX(100%)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "fade-out": "fade-out 0.5s ease-out",
        "zoom-in": "zoom-in 0.5s ease-out",
        "zoom-out": "zoom-out 0.5s ease-out",
        "slide-in-from-top": "slide-in-from-top 0.5s ease-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.5s ease-out",
        "slide-in-from-left": "slide-in-from-left 0.5s ease-out",
        "slide-in-from-right": "slide-in-from-right 0.5s ease-out",
        "slide-out-to-top": "slide-out-to-top 0.5s ease-out",
        "slide-out-to-bottom": "slide-out-to-bottom 0.5s ease-out",
        "slide-out-to-left": "slide-out-to-left 0.5s ease-out",
        "slide-out-to-right": "slide-out-to-right 0.5s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
