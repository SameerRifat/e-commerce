// src/app/(root)/_components/hero-section-data.tsx
import { getActiveHeroSlides } from "@/lib/actions/hero-slides";
import HeroSection from "@/components/home/hero-section";
import { HeroSlide } from "@/components/home/hero-carousel";
import { getHeroSlideLink } from "@/lib/utils/hero-slides";

export async function HeroSectionData() {
    const heroSlidesData = await getActiveHeroSlides();

    const desktopHeroSlides: HeroSlide[] = heroSlidesData.map((slide) => ({
        type: slide.desktopMediaType as 'image' | 'video',
        src: slide.desktopMediaUrl,
        linkUrl: getHeroSlideLink(slide),
        altText: slide.altText || undefined,
    }));

    const mobileHeroSlides: HeroSlide[] = heroSlidesData.map((slide) => ({
        type: slide.mobileMediaType as 'image' | 'video',
        src: slide.mobileMediaUrl,
        linkUrl: getHeroSlideLink(slide),
        altText: slide.altText || undefined,
    }));

    const hasSlides = desktopHeroSlides.length > 0;

    const finalDesktopSlides = hasSlides ? desktopHeroSlides : [
        { type: 'image' as const, src: '/hero-banners/1.webp' },
    ];

    const finalMobileSlides = hasSlides ? mobileHeroSlides : [
        { type: 'image' as const, src: '/hero-banners/mobile-1.webp' },
    ];

    return (
        <HeroSection
            desktopSlides={finalDesktopSlides}
            mobileSlides={finalMobileSlides}
        />
    );
}