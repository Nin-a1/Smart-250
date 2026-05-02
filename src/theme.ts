import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50:  { value: '#E1F5EE' },
          100: { value: '#9FE1CB' },
          200: { value: '#5DCAA5' },
          300: { value: '#3DB490' },
          400: { value: '#1D9E75' },
          500: { value: '#178A63' },
          600: { value: '#0F6E56' },
          700: { value: '#0A5241' },
          800: { value: '#085041' },
          900: { value: '#04342C' },
        },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
