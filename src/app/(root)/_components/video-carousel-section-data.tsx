// src/app/(root)/_components/video-carousel-section-data.tsx
import { getActiveVideoCarouselItems } from "@/lib/actions/video-carousel-items";
import VideoCarouselSection from "@/components/home/video-carousel-section";
import { VideoProduct } from "@/components/home/video-carousel-section";

export async function VideoCarouselSectionData() {
    const videoCarouselData = await getActiveVideoCarouselItems();

    // Map product data from JOINed results (no manual data entry needed!)
    const videoProducts: VideoProduct[] = videoCarouselData.map((item) => ({
        id: item.id,
        name: item.product.name,                                     
        price: item.product.price ? `Rs.${item.product.price}` : "Price Not Set",  
        video: item.videoUrl,
        thumbnail: item.product.primaryImageUrl || "/placeholder.jpg", 
        linkUrl: `/products/${item.product.slug}`,                     
        linkType: 'product',                                          
    }));

    // If no items, don't render the section at all
    if (videoProducts.length === 0) {
        return null;
    }

    return <VideoCarouselSection videoProducts={videoProducts} />;
}
