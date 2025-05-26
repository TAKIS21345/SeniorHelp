/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#007AFF', // Apple's blue
          light: '#58AFFF',
          dark: '#0056B3',
        },
        secondary: {
          DEFAULT: '#E11D48', // Tailwind's rose-600
          light: '#FB7185',   // rose-400
          dark: '#BE123C',    // rose-700
        },
        neutral: {
          50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB',
          300: '#D1D5DB', 400: '#9CA3AF', 500: '#6B7280',
          600: '#4B5563', 700: '#374151', 800: '#1F2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: [
          'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"',
          'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif',
          '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"',
        ],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};