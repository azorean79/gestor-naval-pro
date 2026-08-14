module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // enable class based dark mode
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e3a8a', // indigo-900
          light: '#3b82f6', // blue-500
          dark: '#1e40af', // indigo-800
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
