import React from 'react';
import { cn } from '@/lib/utils';
import FadeIn from './animations/FadeIn';

interface HeroProps {
  className?: string;
}

const Hero: React.FC<HeroProps> = ({ className }) => {
  return (
    <section className={cn('relative min-h-screen flex items-center overflow-hidden', className)}>
      <div className="absolute inset-0 -z-10">
        <img 
          src="/lovable-uploads/a0278ce1-b82d-4ed6-a186-14a9503ef65c.png" 
          alt="Orangery" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>
      
      <div className="container mx-auto px-4 md:px-6 py-20 md:py-32 relative z-10 max-w-4xl">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn delay={200}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-white leading-tight mb-6">
              Partnerskap som varar - framgång som består
            </h1>
          </FadeIn>
          
          <FadeIn delay={300}>
            <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed">
              Vi är operationellt aktiva investerare i nordiska bolag som vill ta nästa steg på sin tillväxtresa.
            </p>
          </FadeIn>
          
          <FadeIn delay={400}>
            <button className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-4 rounded-md font-medium text-lg transition-colors">
              Börja samtalet
            </button>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default Hero;
