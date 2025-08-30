
const config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./index.html",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        "xs": "500px",
        sm: "768px",
        md: "992px",
        lg: "1200px",
        "lg-xl": "1290px",
        xl: "1440px",
      },
      container: {
        center: true,
        padding: "1rem",
        screens: {
          "xs": "576px",
          sm: "768px",
          md: "992px",
          lg: "1280px",
          xl: "1440px",
        }
      },
      colors: {
       
      },
      fontFamily: {
      },
      boxShadow: {
        md: "0px 1px 2px 0px #1018280D",
        lg: "0px 4px 25px 0px #0000000D"
      }
    },
  },
  // darkMode: "class",
  plugins: [],
};

export default config;
