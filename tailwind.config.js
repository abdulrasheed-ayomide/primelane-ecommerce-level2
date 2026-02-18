    // extend: {
    //   keyframes: {
    //     blink: {
    //       '0%, 100%': { opacity: '1' },
    //       '50%': { opacity: '0' }
    //     }
    //   },
    //   animation: {
    //     blink: 'blink 0.75s step-end infinite',
    //   }
    // }

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./javascript/**/*.js"
  ],
    theme: {
    extend: {
      keyframes: {
        blink: {
            '0%, 100%': { opacity: '1' },
            '50%': { opacity: '0' }
        }
      },
        animation: {
            blink: 'blink 0.75s step-end infinite',
        }
    },
  },
  plugins: [],
};
