/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        npc: {
          // Main brand colors from NPC Nusantara Computer logo
          gold: '#F0A84E',      // Main gold/orange color from the logo
          darkGold: '#D4933C',  // Darker shade of gold for hover states
          navy: '#1A1F35',      // Dark navy/black from the logo
          brown: '#A67C4A',     // Light brown/tan from the wings
          light: '#F4F4F4',     // Light background color
          dark: '#161616',      // Dark text color
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('daisyui')
  ],
  // DaisyUI theme configuration
  daisyui: {
    themes: [
      {
        npctheme: {
          "primary": "#F0A84E",
          "primary-focus": "#D4933C",
          "primary-content": "#FFFFFF",
          
          "secondary": "#1A1F35",
          "secondary-focus": "#141829",
          "secondary-content": "#FFFFFF",
          
          "accent": "#A67C4A",
          "accent-focus": "#8C6A3E",
          "accent-content": "#FFFFFF",
          
          "neutral": "#1A1F35",
          "neutral-focus": "#141829",
          "neutral-content": "#FFFFFF",
          
          "base-100": "#FFFFFF",
          "base-200": "#F4F4F4",
          "base-300": "#E8E8E8",
          "base-content": "#161616",
          
          "info": "#3ABFF8",
          "success": "#36D399",
          "warning": "#FBBD23",
          "error": "#F87272",
        }
      }
    ],
    darkTheme: "npctheme",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
}