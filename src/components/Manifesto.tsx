
import React from 'react';
import { cn } from '@/lib/utils';
import FadeIn from './animations/FadeIn';

interface ManifestoProps {
  className?: string;
  id?: string;
}

const Manifesto: React.FC<ManifestoProps> = ({ className, id }) => {
  return (
    <section id={id} className={cn('py-20 bg-white', className)}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-serif mb-10 text-center">Fokuserade förvärv, accelererad tillväxt</h2>
          </FadeIn>
          
          <FadeIn delay={100}>
            <p className="text-lg leading-relaxed mb-8 text-center">
              Vi är specialiserade på att förvärva och utveckla mindre till medelstora nordiska företag med stark marknadspotential. Genom vårt strukturerade tillvägagångssätt skapar vi synergier mellan portföljbolagen och bygger en sammanhållen företagsgrupp där varje del bidrar till helheten.
            </p>
          </FadeIn>
          
          <FadeIn delay={200}>
            <p className="text-lg leading-relaxed text-muted-foreground text-center">
              Med gedigen erfarenhet av företagsutveckling och strategiska förvärv, fokuserar vi på att identifiera kvalitetsföretag som kan dra nytta av våra resurser och nätverk. Vi tror på att bevara varje företags unika DNA samtidigt som vi skapar möjligheter för expansion och effektivisering.
            </p>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default Manifesto;

