module.exports = {
  //mode: 'jit',
  content: ['./public/**/*.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      spacing: {
        '300px': '300px',
        '400px': '400px'
      }
    },
    
  },
  variants: {
    extend: {
      opacity: ['disabled'],
      cursor: ['disabled', 'hover'],
      backgroundColor: ['disabled'],
    },
  },
  plugins: [],
}
