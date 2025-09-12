import React from 'react';
import { cn } from '@/lib/utils';
import FadeIn from './animations/FadeIn';
import TextReveal from './animations/TextReveal';


interface HeroProps {
  className?: string;
}

const Hero: React.FC<HeroProps> = ({ className }) => {
  return (
    <section className={cn('relative w-full overflow-hidden', className)}>
      <div className="relative w-full">
        <video 
          className="w-full h-auto"
          autoPlay
          muted
          loop
          playsInline
          controls
          preload="auto"
          poster="/lovable-uploads/a0278ce1-b82d-4ed6-a186-14a9503ef65c.png"
          onError={(e) => console.error('Video error:', e)}
          onLoadStart={() => console.log('Video load started')}
          onCanPlay={() => console.log('Video can play')}
          aria-label="Background hero video"
        >
          <source src="/lovable-uploads/hero-video.mp4" type="video/mp4" />
          <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center z-10">
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
