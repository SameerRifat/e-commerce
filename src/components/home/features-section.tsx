// src/components/home/features-section.tsx
import {
    Truck,
    Shield,
    Headphones,
    RotateCcw,
    Award,
} from 'lucide-react';

const FeaturesSection = () => {
    const features = [
        {
            icon: Truck,
            title: "Free Delivery",
            description: "On orders above Rs. 2000",
        },
        {
            icon: Shield,
            title: "100% Authentic",
            description: "Genuine products guaranteed",
        },
        {
            icon: RotateCcw,
            title: "Easy Returns",
            description: "30-day return policy",
        },
        {
            icon: Headphones,
            title: "24/7 Support",
            description: "Customer service always available",
        }
    ];

    return (
        <section className="py-12 sm:py-16 lg:py-20 bg-muted/30">
            <div className="custom_container">
                {/* Section Header */}
                <div className="text-center mb-6 sm:mb-8 lg:mb-10">
                    <h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold mb-2 sm:mb-3 lg:mb-4">
                        <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                            Why Choose
                        </span>{' '}
                        <span className="text-gray-900">
                            Us?
                        </span>
                    </h2>
                    <p className="text-xs sm:text-sm md:text-base 2xl:text-lg text-muted-foreground">
                        Experience quality products with unmatched service
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group text-center p-2 sm:p-3 lg:p-4"
                        >
                            {/* Icon */}
                            <div className="flex justify-center mb-3 sm:mb-4">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-gradient-to-r from-amber-600/10 to-orange-600/10 group-hover:from-amber-600/20 group-hover:to-orange-600/20 transition-colors duration-300">
                                    <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600 group-hover:text-orange-600 transition-colors duration-300" />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="space-y-1 sm:space-y-2">
                                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 group-hover:bg-gradient-to-r group-hover:from-amber-600 group-hover:to-orange-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                                    {feature.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="text-center mt-8 sm:mt-12">
                    <div className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-xs sm:text-sm">
                        <Award className="w-4 h-4 mr-2" />
                        <span>Trusted by 50,000+ Customers</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;