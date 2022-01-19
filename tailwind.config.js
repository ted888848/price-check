module.exports = {
  //mode: 'jit',
  purge: ['./public/**/*.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      spacing:{
        '300px': '300px',
        '400px': '400px'
      }
    },
    
  },
  variants: {
    extend: {
      opacity: ['disabled'],
      cursor:['disabled','hover'],
      backgroundColor:['disabled'],
    },
  },
  plugins: [],
}
