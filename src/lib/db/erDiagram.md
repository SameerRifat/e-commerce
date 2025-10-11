erDiagram
    %% Authentication & User Management
    users ||--o{ sessions : "has"
    users ||--o{ accounts : "has"
    users ||--o{ addresses : "has"
    users ||--o{ reviews : "writes"
    users ||--o{ wishlists : "has"
    users ||--o{ carts : "owns"
    users ||--o{ orders : "places"

    users {
        uuid id PK
        text name
        text email UK
        boolean email_verified
        text image
        timestamp created_at
        timestamp updated_at
    }

    sessions {
        uuid id PK
        uuid user_id FK
        text token UK
        text ip_address
        text user_agent
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }

    accounts {
        uuid id PK
        uuid user_id FK
        text account_id
        text provider_id
        text access_token
        text refresh_token
        timestamp access_token_expires_at
        timestamp refresh_token_expires_at
        text scope
        text id_token
        text password
        timestamp created_at
        timestamp updated_at
    }

    verifications {
        uuid id PK
        text identifier
        text value
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }

    guests {
        uuid id PK
        text session_token UK
        timestamp created_at
        timestamp expires_at
    }

    guests ||--o{ carts : "has"

    %% Addresses
    addresses {
        uuid id PK
        uuid user_id FK
        text type "shipping|billing"
        text full_name
        text line1
        text line2
        text city
        int city_id
        text state
        int state_id
        text country
        text country_code
        int country_id
        text postal_code
        text phone
        boolean is_default
    }

    %% Product Catalog Core
    categories ||--o{ categories : "parent-child"
    categories ||--o{ products : "contains"
    
    categories {
        uuid id PK
        text name
        text slug UK
        uuid parent_id FK
        text image_url
    }

    brands ||--o{ products : "manufactures"
    
    brands {
        uuid id PK
        text name
        text slug UK
        text logo_url
    }

    genders ||--o{ products : "categorizes"
    
    genders {
        uuid id PK
        text label
        text slug UK
    }

    products {
        uuid id PK
        text name
        text description
        uuid category_id FK
        uuid gender_id FK
        uuid brand_id FK
        boolean is_published
        text product_type "simple|configurable"
        numeric price
        numeric sale_price
        text sku
        int in_stock
        real weight
        jsonb dimensions
        uuid default_variant_id
        timestamp created_at
        timestamp updated_at
    }

    products ||--o{ product_variants : "has"
    products ||--o{ product_images : "has"
    products ||--o{ reviews : "receives"
    products ||--o{ wishlists : "featured-in"
    products ||--o{ cart_items : "added-to"
    products ||--o{ order_items : "included-in"
    products ||--o{ product_collections : "belongs-to"
    products ||--o{ hero_slides : "linked-in"

    %% Product Variants
    colors ||--o{ product_variants : "used-in"
    sizes ||--o{ product_variants : "used-in"
    product_variants ||--o{ product_images : "has"
    product_variants ||--o{ cart_items : "selected"
    product_variants ||--o{ order_items : "purchased"

    product_variants {
        uuid id PK
        uuid product_id FK
        text sku UK
        numeric price
        numeric sale_price
        uuid color_id FK
        uuid size_id FK
        int in_stock
        real weight
        jsonb dimensions
        timestamp created_at
    }

    product_images {
        uuid id PK
        uuid product_id FK
        uuid variant_id FK
        text url
        int sort_order
        boolean is_primary
    }

    %% Filter Options
    colors {
        uuid id PK
        text name
        text slug UK
        text hex_code
    }

    size_categories ||--o{ sizes : "groups"

    size_categories {
        uuid id PK
        text name UK
        timestamp created_at
    }

    sizes {
        uuid id PK
        text name
        text slug UK
        int sort_order
        uuid category_id FK
    }

    %% Collections
    collections ||--o{ product_collections : "contains"
    collections ||--o{ hero_slides : "linked-in"

    collections {
        uuid id PK
        text name
        text slug UK
        timestamp created_at
    }

    product_collections {
        uuid id PK
        uuid product_id FK
        uuid collection_id FK
    }

    %% Reviews
    reviews {
        uuid id PK
        uuid product_id FK
        uuid user_id FK
        int rating "1-5"
        text comment
        timestamp created_at
    }

    %% Wishlists
    wishlists {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        timestamp added_at
    }

    %% Shopping Cart
    carts ||--o{ cart_items : "contains"

    carts {
        uuid id PK
        uuid user_id FK
        uuid guest_id FK
        timestamp created_at
        timestamp updated_at
    }

    cart_items {
        uuid id PK
        uuid cart_id FK
        uuid product_id FK
        uuid product_variant_id FK
        boolean is_simple_product
        int quantity
    }

    %% Orders
    orders ||--o{ order_items : "contains"
    orders ||--o{ payments : "paid-by"
    addresses ||--o{ orders : "shipping-to"
    addresses ||--o{ orders : "billing-to"

    orders {
        uuid id PK
        uuid user_id FK
        text status "pending|processing|paid|shipped|out_for_delivery|delivered|cancelled"
        numeric total_amount
        numeric subtotal
        numeric shipping_cost
        numeric tax_amount
        uuid shipping_address_id FK
        uuid billing_address_id FK
        text payment_method
        text notes
        timestamp created_at
        timestamp updated_at
    }

    order_items {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        uuid product_variant_id FK
        boolean is_simple_product
        int quantity
        numeric price_at_purchase
        numeric sale_price_at_purchase
    }

    %% Payments
    payments {
        uuid id PK
        uuid order_id FK
        text method "stripe|paypal|cod"
        text status "initiated|completed|failed"
        timestamp paid_at
        text transaction_id
    }

    %% Coupons
    coupons {
        uuid id PK
        text code UK
        text discount_type "percentage|fixed"
        numeric discount_value
        timestamp expires_at
        int max_usage
        int used_count
    }

    %% Hero Slides
    hero_slides {
        uuid id PK
        text title
        int sort_order
        boolean is_published
        text desktop_media_type "image|video"
        text desktop_media_url
        text mobile_media_type "image|video"
        text mobile_media_url
        text link_type "product|collection|external|none"
        uuid linked_product_id FK
        uuid linked_collection_id FK
        text external_url
        text alt_text
        text description
        timestamp published_at
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }