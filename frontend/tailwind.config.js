/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Hex code for rgb(198, 129, 72)
        primary: '#C68148', 
        secondary: '#1F2937',
      }
    },
  },
  plugins: [],
}