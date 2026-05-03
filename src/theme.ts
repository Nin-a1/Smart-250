import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50:  { value: '#E8F5F0' },
          100: { value: '#C2E4D8' },
          200: { value: '#8ECFBB' },
          300: { value: '#5ABA9E' },
          400: { value: '#2EA682' },
          500: { value: '#179A6F' },
          600: { value: '#0F6E56' },
          700: { value: '#0A5241' },
          800: { value: '#073B2F' },
          900: { value: '#04251D' },
        },
      },
      fonts: {
        heading: { value: "'Inter', system-ui, -apple-system, sans-serif" },
        body:    { value: "'Inter', system-ui, -apple-system, sans-serif" },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
