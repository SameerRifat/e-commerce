erDiagram
    %% User Management
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

    %% Product Catalog
    categories {
        uuid id PK
        text name
        text slug UK
        uuid parent_id FK
        text image_url
    }
    
    brands {
        uuid id PK
        text name
        text slug UK
        text logo_url
    }
    
    genders {
        uuid id PK
        text label
        text slug UK
    }
    
    colors {
        uuid id PK
        text name
        text slug UK
        text hex_code
    }
    
    size_categories {
        uuid id PK
        text name UK
        timestamp created_at
    }
    
    sizes {
        uuid id PK
        text name
        text slug UK
        integer sort_order
        uuid category_id FK
    }
    
    products {
        uuid id PK
        text name
        text description
        uuid category_id FK
        uuid gender_id FK
        uuid brand_id FK
        boolean is_published
        text product_type
        numeric price
        numeric sale_price
        text sku
        integer in_stock
        real weight
        jsonb dimensions
        uuid default_variant_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    product_variants {
        uuid id PK
        uuid product_id FK
        text sku UK
        numeric price
        numeric sale_price
        uuid color_id FK
        uuid size_id FK
        integer in_stock
        real weight
        jsonb dimensions
        timestamp created_at
    }
    
    product_images {
        uuid id PK
        uuid product_id FK
        uuid variant_id FK
        text url
        integer sort_order
        boolean is_primary
    }
    
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

    %% User Interactions
    reviews {
        uuid id PK
        uuid product_id FK
        uuid user_id FK
        integer rating
        text comment
        timestamp created_at
    }
    
    wishlists {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        timestamp added_at
    }

    %% Shopping & Orders
    addresses {
        uuid id PK
        uuid user_id FK
        text type
        text full_name
        text line1
        text line2
        text city
        integer city_id
        text state
        integer state_id
        text country
        text country_code
        integer country_id
        text postal_code
        text phone
        boolean is_default
    }
    
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
        integer quantity
    }
    
    orders {
        uuid id PK
        uuid user_id FK
        text status
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
        integer quantity
        numeric price_at_purchase
        numeric sale_price_at_purchase
    }
    
    payments {
        uuid id PK
        uuid order_id FK
        text method
        text status
        timestamp paid_at
        text transaction_id
    }
    
    coupons {
        uuid id PK
        text code UK
        text discount_type
        numeric discount_value
        timestamp expires_at
        integer max_usage
        integer used_count
    }

    %% Relationships
    users ||--o{ sessions : "has"
    users ||--o{ accounts : "has"
    users ||--o{ addresses : "has"
    users ||--o{ reviews : "writes"
    users ||--o{ wishlists : "has"
    users ||--o{ carts : "has"
    users ||--o{ orders : "places"
    
    guests ||--o{ carts : "has"
    
    categories ||--o{ categories : "parent/child"
    categories ||--o{ products : "categorizes"
    
    brands ||--o{ products : "manufactures"
    genders ||--o{ products : "targets"
    
    size_categories ||--o{ sizes : "groups"
    colors ||--o{ product_variants : "defines"
    sizes ||--o{ product_variants : "defines"
    
    products ||--o{ product_variants : "has"
    products ||--o{ product_images : "has"
    products ||--o{ reviews : "receives"
    products ||--o{ wishlists : "featured_in"
    products ||--o{ cart_items : "added_to"
    products ||--o{ order_items : "ordered_as"
    
    product_variants ||--o{ product_images : "has"
    product_variants ||--o{ cart_items : "added_to"
    product_variants ||--o{ order_items : "ordered_as"
    
    collections ||--o{ product_collections : "contains"
    products ||--o{ product_collections : "belongs_to"
    
    carts ||--o{ cart_items : "contains"
    
    addresses ||--o{ orders : "shipping_to"
    addresses ||--o{ orders : "billing_to"
    
    orders ||--o{ order_items : "contains"
    orders ||--o{ payments : "paid_via"