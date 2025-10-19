import Link from 'next/link'
import React from 'react'

const ProductNotFoundBlock = () => {
    return (
        <section className="mx-auto max-w-3xl rounded-xl border border-light-300 bg-light-100 p-8 text-center">
            <h1 className="text-heading-3 text-dark-900">Product not found</h1>
            <p className="mt-2 text-body text-dark-700">The product you’re looking for doesn’t exist or may have been removed.</p>
            <div className="mt-6">
                <Link
                    href="/products"
                    className="inline-block rounded-full bg-dark-900 px-6 py-3 text-body-medium text-light-100 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
                >
                    Browse Products
                </Link>
            </div>
        </section>
    )
}

export default ProductNotFoundBlock
