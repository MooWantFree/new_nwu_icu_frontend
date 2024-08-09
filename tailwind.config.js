/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
    theme: {
        extend: {
            flex: {
                '2': '2 2 0%',
                '3': '3 3 0%',
                '4': '4 4 0%',
                '5': '5 5 0%',
                '7': '7 7 0%',
            },
            borderColor: {
                customGray: '#DDDDDD',
            },
            height: {
                '37.5': '37.5rem',
                '0.1': '0.025rem',
            },
            width: {
                '23/24': '95.833333%', // 添加自定义的 23/24 宽度
            },
            colors: {
                customGray: '#999999',
                customBlue: '#337AB7',
                contentGray: '#777777',
                hrefBlue: '#18a058',
            },
        },
    },
    plugins: [
      require("@tailwindcss/typography"),
    ],
};
