
import React from 'react';
import { cn } from '@/lib/utils';
import FadeIn from './animations/FadeIn';

interface AboutProps {
  className?: string;
}

const About: React.FC<AboutProps> = ({ className }) => {
  return (
    <section id="about" className={cn('py-20 md:py-32 bg-gray-50', className)}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-12 gap-12 md:gap-20 items-start">
          <FadeIn className="md:col-span-5">
            <div className="flex flex-col space-y-6">
              <div>
                <span className="text-sm md:text-base font-medium text-orangery-500 mb-2 inline-block">Om oss</span>
                <h2 className="text-3xl md:text-5xl font-serif font-medium tracking-tight mb-6">Med djup erfarenhet driver Project Nico hållbar tillväxt</h2>
              </div>
              
              <p className="text-lg text-muted-foreground">
                Vi är ett team med omfattande erfarenhet inom entreprenörskap, investeringar och företagsledning som arbetar med företagare för att skapa hållbara och konkurrenskraftiga företag.
              </p>
              <p className="text-lg text-muted-foreground">
                Med erfarenhet från att ha byggt några av Sveriges mest lönsamma företag, har vi djup förståelse för vad som skapar framgång. Det handlar om att stödja målmedvetna entreprenörer som har produkter som möter marknadens behov och förmåga att anpassa sig till en snabbt föränderlig omvärld.
              </p>
            </div>
          </FadeIn>
          
          <FadeIn delay={150} className="md:col-span-7">
            <div className="relative h-[500px] lg:h-[600px] w-full rounded-lg overflow-hidden">
              <img 
                src="/lovable-uploads/47f9a1d0-4458-400a-8fc0-79adf093cf18.png"
                alt="Interior with palm trees and ornate architecture"
                className="w-full h-full object-cover"
              />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default About;
