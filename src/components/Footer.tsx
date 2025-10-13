// src/components/Footer.tsx
'use client';

import Link from 'next/link';
import { Facebook, Instagram, Youtube, MessageCircle, Mail, Phone } from 'lucide-react';

interface LinkItem {
  name: string;
  href: string;
}

interface SocialLink {
  name: string;
  href: string;
  icon: typeof Facebook;
  hoverColor: string;
}

interface ContactInfo {
  icon: typeof Phone;
  label: string;
  value: string;
  href: string;
}

const Footer = () => {
  const shopLinks: LinkItem[] = [
    { name: 'All Products', href: '/products' },
    { name: 'Men', href: '/products?gender=men' },
    { name: 'Women', href: '/products?gender=women' },
    { name: 'Kids', href: '/products?gender=unisex' },
    { name: 'Collections', href: '/collections' },
    { name: 'New Arrivals', href: '/products?category=new-arrivals' }
  ];

  const supportLinks: LinkItem[] = [
    { name: 'Contact Us', href: '/contact' },
    { name: 'Track Order', href: '/profile/orders' },
    { name: 'Help Center', href: '/contact' }, 
  ];

  // const supportLinks: LinkItem[] = [
  //   { name: 'Contact Us', href: '/contact' },
  //   { name: 'Track Order', href: '/track-order' },
  //   { name: 'Shipping Info', href: '/shipping' },
  //   { name: 'Returns & Exchanges', href: '/returns' },
  //   { name: 'FAQ', href: '/faq' }
  // ];

  const contactInfo: ContactInfo[] = [
    {
      icon: Phone,
      label: 'Phone',
      value: '+92 300 1234567',
      href: 'tel:+923001234567'
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      value: '+92 300 1234567',
      href: 'https://wa.me/923001234567'
    },
    {
      icon: Mail,
      label: 'Email',
      value: 'info@yourstore.com',
      href: 'mailto:info@yourstore.com'
    }
  ];

  const socialLinks: SocialLink[] = [
    { 
      name: 'Facebook', 
      href: 'https://facebook.com', 
      icon: Facebook,
      hoverColor: 'hover:bg-blue-600/20 hover:border-blue-400/50 hover:text-blue-400'
    },
    { 
      name: 'Instagram', 
      href: 'https://instagram.com', 
      icon: Instagram,
      hoverColor: 'hover:bg-pink-600/20 hover:border-pink-400/50 hover:text-pink-400'
    },
    { 
      name: 'WhatsApp', 
      href: 'https://wa.me/923001234567', 
      icon: MessageCircle,
      hoverColor: 'hover:bg-green-600/20 hover:border-green-400/50 hover:text-green-400'
    },
    { 
      name: 'YouTube', 
      href: 'https://youtube.com', 
      icon: Youtube,
      hoverColor: 'hover:bg-red-600/20 hover:border-red-400/50 hover:text-red-400'
    }
  ];

  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#E47F1A]/5 to-orange-500/5"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-[#E47F1A]/10 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-orange-400/10 to-transparent rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
        {/* Main footer content */}
        <div className="custom_container py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12">
            {/* Brand section */}
            <div className="lg:col-span-4 space-y-6">
              <div className="space-y-4">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-[#E47F1A] via-orange-400 to-amber-300 bg-clip-text text-transparent">
                  Your Brand
                </h3>
                <p className="text-slate-300 text-base leading-relaxed max-w-md">
                  Your one-stop destination for premium cosmetics, skincare, and beauty products. Quality you can trust, delivered to your doorstep.
                </p>
              </div>
              
              {/* Social media */}
              <div className="space-y-3">
                <p className="text-slate-300 font-medium">Follow us</p>
                <div className="flex space-x-3">
                  {socialLinks.map((social) => {
                    const IconComponent = social.icon;
                    return (
                      <Link
                        key={social.name}
                        href={social.href}
                        className={`w-11 h-11 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center text-slate-300 ${social.hoverColor} transform hover:scale-110 transition-all duration-300 backdrop-blur-sm group`}
                        title={social.name}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <IconComponent 
                          className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" 
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Links sections */}
            <div className="lg:col-span-2 space-y-6">
              <h4 className="text-lg font-semibold text-white border-b border-[#E47F1A]/30 pb-2">Shop</h4>
              <ul className="space-y-3">
                {shopLinks.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href} 
                      className="text-slate-300 hover:text-[#E47F1A] transition-all duration-300 hover:translate-x-1 inline-block group text-sm"
                    >
                      <span className="group-hover:border-b border-[#E47F1A]/50">{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <h4 className="text-lg font-semibold text-white border-b border-[#E47F1A]/30 pb-2">Customer Service</h4>
              <ul className="space-y-3">
                {supportLinks.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href} 
                      className="text-slate-300 hover:text-[#E47F1A] transition-all duration-300 hover:translate-x-1 inline-block group text-sm"
                    >
                      <span className="group-hover:border-b border-[#E47F1A]/50">{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact section */}
            <div className="lg:col-span-3 space-y-6">
              <h4 className="text-lg font-semibold text-white border-b border-[#E47F1A]/30 pb-2">Contact Us</h4>
              <div className="space-y-4">
                {contactInfo.map((contact) => {
                  const IconComponent = contact.icon;
                  return (
                    <div key={contact.label} className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center text-[#E47F1A] flex-shrink-0 backdrop-blur-sm">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 mb-1">{contact.label}</p>
                        {contact.href === '#' ? (
                          <p className="text-sm text-slate-300 break-words">{contact.value}</p>
                        ) : (
                          <a 
                            href={contact.href}
                            className="text-sm text-slate-300 hover:text-[#E47F1A] transition-colors duration-300 break-words block"
                            target={contact.href.startsWith('http') ? '_blank' : undefined}
                            rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                          >
                            {contact.value}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Section - Commented Out */}
        {/* 
        <div className="border-t border-white/10">
          <div className="custom_container py-12">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <h4 className="text-2xl font-semibold text-white">Stay Updated</h4>
              <p className="text-slate-300">
                Subscribe to get exclusive offers and new arrivals delivered to your inbox.
              </p>
              <form className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E47F1A]/50 focus:border-[#E47F1A]/50 backdrop-blur-sm transition-all duration-300"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-[#E47F1A] to-orange-500 text-white font-semibold rounded-lg hover:from-[#E47F1A]/90 hover:to-orange-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-[#E47F1A]/25"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
        */}

        {/* Bottom section */}
        <div className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="custom_container py-6">
              <p className="text-slate-400 text-sm text-center">
                  &copy; 2025 Your Brand. All rights reserved.
              </p>
          </div>
          {/* <div className="custom_container py-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
                <p className="text-slate-400 text-sm text-center md:text-left">
                  &copy; 2025 Your Brand. All rights reserved.
                </p>
                <div className="flex items-center space-x-1 text-slate-400 text-sm">
                  <span>Made with</span>
                  <span className="text-red-400 animate-pulse">❤️</span>
                  <span>in Pakistan</span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400">
                <Link href="/privacy" className="hover:text-[#E47F1A] transition-colors duration-300">
                  Privacy Policy
                </Link>
                <span className="text-slate-600">•</span>
                <Link href="/terms" className="hover:text-[#E47F1A] transition-colors duration-300">
                  Terms of Service
                </Link>
                <span className="text-slate-600">•</span>
                <Link href="/cookies" className="hover:text-[#E47F1A] transition-colors duration-300">
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;

// // src/components/Footer.tsx
// 'use client';

// import Link from 'next/link';
// import { useState, FormEvent } from 'react';
// import { Facebook, Instagram, Youtube, MessageCircle } from 'lucide-react';

// interface LinkItem {
//   name: string;
//   href: string;
// }

// interface SocialLink {
//   name: string;
//   href: string;
//   icon: typeof Facebook;
//   hoverColor: string;
// }

// const Footer = () => {
//   const [email, setEmail] = useState<string>('');
//   const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

//   const handleSubscribe = (e: FormEvent<HTMLFormElement>): void => {
//     e.preventDefault();
//     if (email) {
//       setIsSubscribed(true);
//       setEmail('');
//       setTimeout(() => setIsSubscribed(false), 3000);
//     }
//   };

//   const shopLinks: LinkItem[] = [
//     { name: 'All Products', href: '/products' },
//     { name: 'Best Sellers', href: '/products?category=best-sellers' },
//     { name: 'New Arrivals', href: '/products?category=new-arrivals' },
//     { name: 'Men\'s Attars', href: '/products?category=mens-attars' },
//     { name: 'Women\'s Attars', href: '/products?category=womens-attars' },
//     { name: 'Eastern Fragrances', href: '/products?category=eastern' }
//   ];

//   const supportLinks: LinkItem[] = [
//     { name: 'Contact Us', href: '/contact' },
//     { name: 'Shipping Info', href: '/shipping' },
//     { name: 'Returns & Exchanges', href: '/returns' },
//     { name: 'Size Guide', href: '/size-guide' },
//     { name: 'FAQ', href: '/faq' },
//     { name: 'Track Order', href: '/track-order' }
//   ];

//   const socialLinks: SocialLink[] = [
//     { 
//       name: 'Facebook', 
//       href: 'https://facebook.com', 
//       icon: Facebook,
//       hoverColor: 'hover:bg-blue-600/20 hover:border-blue-400/50 hover:text-blue-400'
//     },
//     { 
//       name: 'Instagram', 
//       href: 'https://instagram.com', 
//       icon: Instagram,
//       hoverColor: 'hover:bg-pink-600/20 hover:border-pink-400/50 hover:text-pink-400'
//     },
//     { 
//       name: 'WhatsApp', 
//       href: 'https://whatsapp.com', 
//       icon: MessageCircle,
//       hoverColor: 'hover:bg-green-600/20 hover:border-green-400/50 hover:text-green-400'
//     },
//     { 
//       name: 'YouTube', 
//       href: 'https://youtube.com', 
//       icon: Youtube,
//       hoverColor: 'hover:bg-red-600/20 hover:border-red-400/50 hover:text-red-400'
//     }
//   ];

//   return (
//     <footer className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
//       {/* Background decorative elements */}
//       <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5"></div>
//       <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-amber-400/10 to-transparent rounded-full blur-3xl"></div>
//       <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-orange-400/10 to-transparent rounded-full blur-3xl"></div>
      
//       <div className="relative z-10">
//         {/* Main footer content */}
//         <div className="custom_container py-16">
//           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
//             {/* Brand section */}
//             <div className="lg:col-span-4 space-y-6">
//               <div className="space-y-4">
//                 <h3 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 bg-clip-text text-transparent">
//                   PerfumeHub
//                 </h3>
//                 <p className="text-slate-300 text-lg leading-relaxed max-w-md">
//                   Pakistan&apos;s premier destination for authentic luxury perfumes and traditional attars. Experience the finest fragrances crafted for the discerning individual.
//                 </p>
//               </div>
              
//               {/* Stats or features */}
//               <div className="grid grid-cols-2 gap-4 max-w-sm">
//                 <div className="text-center p-4 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
//                   <div className="text-2xl font-bold text-amber-400">500+</div>
//                   <div className="text-sm text-slate-400">Premium Products</div>
//                 </div>
//                 <div className="text-center p-4 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
//                   <div className="text-2xl font-bold text-amber-400">24h</div>
//                   <div className="text-sm text-slate-400">Fast Delivery</div>
//                 </div>
//               </div>
//             </div>

//             {/* Links sections */}
//             <div className="lg:col-span-2 space-y-6">
//               <h4 className="text-xl font-semibold text-white border-b border-amber-400/30 pb-2">Shop</h4>
//               <ul className="space-y-3">
//                 {shopLinks.map((link) => (
//                   <li key={link.name}>
//                     <Link 
//                       href={link.href} 
//                       className="text-slate-300 hover:text-amber-400 transition-all duration-300 hover:translate-x-1 inline-block group"
//                     >
//                       <span className="group-hover:border-b border-amber-400/50">{link.name}</span>
//                     </Link>
//                   </li>
//                 ))}
//               </ul>
//             </div>

//             <div className="lg:col-span-2 space-y-6">
//               <h4 className="text-xl font-semibold text-white border-b border-amber-400/30 pb-2">Support</h4>
//               <ul className="space-y-3">
//                 {supportLinks.map((link) => (
//                   <li key={link.name}>
//                     <Link 
//                       href={link.href} 
//                       className="text-slate-300 hover:text-amber-400 transition-all duration-300 hover:translate-x-1 inline-block group"
//                     >
//                       <span className="group-hover:border-b border-amber-400/50">{link.name}</span>
//                     </Link>
//                   </li>
//                 ))}
//               </ul>
//             </div>

//             {/* Newsletter section */}
//             <div className="lg:col-span-4 space-y-6">
//               <h4 className="text-xl font-semibold text-white border-b border-amber-400/30 pb-2">Stay Connected</h4>
//               <div className="space-y-4">
//                 <p className="text-slate-300">
//                   Subscribe to get exclusive offers, new arrivals, and fragrance tips delivered to your inbox.
//                 </p>
                
//                 <form onSubmit={handleSubscribe} className="space-y-3">
//                   <div className="flex flex-col sm:flex-row gap-3">
//                     <input
//                       type="email"
//                       value={email}
//                       onChange={(e) => setEmail(e.target.value)}
//                       placeholder="Enter your email"
//                       className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 backdrop-blur-sm transition-all duration-300"
//                       required
//                     />
//                     <button
//                       type="submit"
//                       className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-amber-500/25"
//                     >
//                       {isSubscribed ? '✓ Subscribed!' : 'Subscribe'}
//                     </button>
//                   </div>
//                 </form>

//                 {/* Social media */}
//                 <div className="space-y-3">
//                   <p className="text-slate-300 font-medium">Follow us for updates</p>
//                   <div className="flex space-x-4">
//                     {socialLinks.map((social) => {
//                       const IconComponent = social.icon;
//                       return (
//                         <Link
//                           key={social.name}
//                           href={social.href}
//                           className={`w-12 h-12 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center text-slate-300 ${social.hoverColor} transform hover:scale-110 transition-all duration-300 backdrop-blur-sm group`}
//                           title={social.name}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                         >
//                           <IconComponent 
//                             className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" 
//                           />
//                         </Link>
//                       );
//                     })}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Bottom section */}
//         <div className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
//           <div className="custom_container py-8">
//             <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
//               <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-8">
//                 <p className="text-slate-300 text-center md:text-left">
//                   &copy; 2024 PerfumeHub. All rights reserved.
//                 </p>
//                 <div className="flex items-center space-x-1 text-slate-300">
//                   <span>Made with</span>
//                   <span className="text-red-400 animate-pulse">❤️</span>
//                   <span>in Pakistan</span>
//                 </div>
//               </div>
              
//               <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
//                 <Link href="/privacy" className="hover:text-amber-400 transition-colors duration-300">
//                   Privacy Policy
//                 </Link>
//                 <span className="text-slate-600">•</span>
//                 <Link href="/terms" className="hover:text-amber-400 transition-colors duration-300">
//                   Terms of Service
//                 </Link>
//                 <span className="text-slate-600">•</span>
//                 <Link href="/cookies" className="hover:text-amber-400 transition-colors duration-300">
//                   Cookie Policy
//                 </Link>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;