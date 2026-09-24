import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F5F1E8',
        brandBlack: '#0A0A0A',
        amberAccent: '#FFB800',
        skyBlue: '#A9D9F2',
        hotPink: '#FF6FA8',
        positiveGreen: '#3DDC84',
        alertRed: '#FF4D4D',
      },
      boxShadow: {
        neo: '6px 6px 0px #0A0A0A',
        'neo-sm': '3px 3px 0px #0A0A0A',
        'neo-active': '2px 2px 0px #0A0A0A',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
};

export default config;
