module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#000000',
        surface: '#0b0b0b',
        text: '#f9fafb',
        muted: '#9ca3af',
        brand: {
          DEFAULT: '#ffb703',
          dark: '#ff9f00'
        },
        accent: '#0ea5a4'
      },
      height: {
        'nav': '64px'
      },
      spacing: {
        '4.5': '1.125rem'
      }
    },
  },
  plugins: [],
}
