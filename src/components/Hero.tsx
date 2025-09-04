import React from 'react';
import { cn } from '@/lib/utils';
import FadeIn from './animations/FadeIn';
import TextReveal from './animations/TextReveal';
import ParallaxSection from './animations/ParallaxSection';

interface HeroProps {
  className?: string;
}

const Hero: React.FC<HeroProps> = ({ className }) => {
  return (
    <section className={cn('relative min-h-screen flex items-center overflow-hidden', className)}>
      <ParallaxSection speed={0.3} className="absolute inset-0 -z-10">
        <img 
          src="/lovable-uploads/a0278ce1-b82d-4ed6-a186-14a9503ef65c.png" 
          alt="Orangery" 
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </ParallaxSection>
      
      <div className="container mx-auto px-4 md:px-6 py-20 md:py-32 relative z-10 max-w-4xl">
        <div className="max-w-3xl mx-auto text-center">
          <TextReveal delay={200} duration={1000} stagger>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-white leading-tight mb-6">
              Förvärv som skapar värde - tillväxt som består
            </h1>
          </TextReveal>
          
          <FadeIn delay={600} duration={900} direction="up">
            <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed">
              Vi förvärvar och utvecklar nordiska företag genom operationell excellens och modern teknologi.
            </p>
          </FadeIn>
          
        </div>
      </div>
    </section>
  );
};

export default Hero;
