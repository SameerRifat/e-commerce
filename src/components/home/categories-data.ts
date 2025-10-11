// lib/categories-data.ts

// Type definition for category
export interface Category {
    id: string;
    name: string;
    image: string;
}

// Mock data for perfumes and attars
export const categories: Category[] = [
    {
        id: 'best-sellers',
        name: 'Best Sellers',
        image: '/categories/best-sellers.webp'
    },
    {
        id: 'mens-attars',
        name: "Men's Attars",
        image: '/categories/mens-attars.webp'
    },
    {
        id: 'womens-attars',
        name: "Women's Attars",
        image: '/categories/womens-attars.webp'
    },
    {
        id: 'eastern',
        name: 'Eastern',
        image: '/categories/eastern.webp'
    },
    {
        id: 'western',
        name: 'Western',
        image: '/categories/western.webp'
    },
    {
        id: '12-hours-lasting',
        name: '12 Hours Lasting',
        image: '/categories/12-hours-lasting.webp'
    },
    {
        id: 'new-arrivals',
        name: 'New Arrivals',
        image: '/categories/eastern.webp'
    },
    {
        id: 'top-rated',
        name: 'Top Rated',
        image: '/categories/western.webp'
    }
];