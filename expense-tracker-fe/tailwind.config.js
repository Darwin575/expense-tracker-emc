/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/**/*.{js,ts,jsx,tsx}',
        './src/app/**/*.{js,ts,jsx,tsx}',
        './src/components/ui/**/*.{js,ts,jsx,tsx}',
    ],
    darkMode: 'class', // enable class-based dark mode
    theme: {
        extend: {
            colors: {
                'sky-mist': '#C9D4DF',       // bg color for dashboard and cancel confirmation modal
                'burnt-amber': '#C56606',    // Bar color for weekly spending and payment methods
                'teal-reef': '#098C7C',      // Bar color for monthly trend chart
                'lavender-smoke': '#6A89A7', // Sidebar, expense filter and modal bg color
                'cloud-white': '#EDF0F4',    // txt color for active nav
                'storm-blue': '#354453',     // bg for active nav
                'mist-gray': '#E1E7ED',      // bg for table
                'dove-blue': '#d5e1ed',      // bg color for even rows in table
                'graphite': '#949494',       // bg for cancel confirmation modal
                'gray-charcoal': '#3A3A3A', //btn color for sign in, create account, add expense, add categories
                'green-grass': '#77AA4F', // btn color for save, keep editing
                'blue-cobalt': '#0047AB', // btn color for edit 
                'red-crimson': '#D90000', // btn color for delete

            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};