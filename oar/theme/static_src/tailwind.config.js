/**
 * This is a minimal config.
 *
 * If you need the full config, get it from here:
 * https://unpkg.com/browse/tailwindcss@latest/stubs/defaultConfig.stub.js
 */
const plugin = require('tailwindcss/plugin');

module.exports = {
    content: [
        /**
         * HTML. Paths to Django template files that will contain Tailwind CSS classes.
         */

        /*  Templates within theme app (<tailwind_app_name>/templates), e.g. base.html. */
        '../templates/**/*.html',

        /*
         * Main templates directory of the project (BASE_DIR/templates).
         * Adjust the following line to match your project structure.
         */
        '../../templates/**/*.html',

        /*
         * Templates in other django apps (BASE_DIR/<any_app_name>/templates).
         * Adjust the following line to match your project structure.
         */
        '../../**/templates/**/*.html',

        /**
         * JS: If you use Tailwind CSS in JavaScript, uncomment the following lines and make sure
         * patterns match your project structure.
         */
        /* JS 1: Ignore any JavaScript in node_modules folder. */
        '!../../**/node_modules',
        /* JS 2: Process all JavaScript files in the project. */
        '../../**/*.js',

        /**
         * Python: If you use Tailwind CSS classes in Python, uncomment the following line
         * and make sure the pattern below matches your project structure.
         */
        // '../../**/*.py'
    ],
    theme: {
        fontFamily: {
            "Lato": ["Lato", "sans-serif"],
            "Roboto": ["Roboto", "sans-serif"],
            "Montserrat": ["Montserrat", "sans-serif"],
        },
        screens: {
            'sm': '640px',
            'md': '768px',
            'lg': '1024px',
            'xl': '1280px',
            '2xl': '1536px',
            "3xl": "1850px"
        },
        extend: {

            keyframes: {
                show_right: {
                    '0%': {transform: 'translateX(0%)'},
                    '100%': {transform: 'translateX(-100%)'},
                },
                hide_right: {
                    '0%': {transform: 'translateX(-100%)'},
                    '100%': {transform: 'translateX(0%)'},
                }
            },
            animation: {
                'show-from-right': 'show_right 2s  forwards ' ,
                'hide-to-right': 'hide_right 2s  forwards ' ,
            },
            colors: {
                'grey-oscar': '#cacaca',
                'blue-duck-oscar': '#008989',
                'blue-oscar': '#00a6aa',
                'purple-oscar': '#b11280',
                'purple-dark-oscar': '#800051',
                'orange-oscar': '#ea560d'
            },
            width: {
                '16': '16px'
            },
            maxHeight: {
                'modal': 'calc(100vh - 100px)'
            },
            maxWidth: {
                'modal': 'calc(100vw - 100px)'
            },
        },

    },
    plugins: [
        /**
         * '@tailwindcss/forms' is the forms plugin that provides a minimal styling
         * for forms. If you don't like it or have own styling for forms,
         * comment the line below to disable '@tailwindcss/forms'.
         */
        plugin(function ({addBase}) {
            addBase({
                // set for medium screen
                'html': {fontSize: "16px", width: "100%", height: "100%", overflow: "auto", fontFamily: "Montserrat", fontWeight: "500"},
                'body': {width: "100%", height: "100%", margin: "0", padding: "0", overflow: "auto"},
                '@screen 3xl': {
                    'html': {
                        fontSize: "17px",
                        width: "100%",
                        height: "100%",
                        overflow: "auto",
                        fontFamily: "Montserrat"
                    },
                    'body': {width: "100%", height: "100%", margin: "0", padding: "0", overflow: "auto"},
                },
            })
        }),

        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
        require('@tailwindcss/line-clamp'),
        require('@tailwindcss/aspect-ratio'),

    ],
}
