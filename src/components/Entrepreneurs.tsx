import React from 'react';
import { cn } from '@/lib/utils';
import FadeIn from './animations/FadeIn';
import TextReveal from './animations/TextReveal';

interface EntrepreneursProps {
  className?: string;
  id?: string;
}

const Entrepreneurs: React.FC<EntrepreneursProps> = ({ className, id }) => {
  return (
    <section id={id} className={cn('py-20 md:py-32 bg-white', className)}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <FadeIn delay={100}>
            <div className="text-center mb-16">
              <TextReveal delay={200} duration={1000}>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-medium tracking-tight mb-8">
                  Vi utvecklar företag till sin fulla potential
                </h2>
              </TextReveal>
            </div>
          </FadeIn>
          
          <div className="space-y-8">
            <FadeIn delay={400} duration={900} direction="up">
              <p className="text-lg md:text-xl leading-relaxed text-muted-foreground">
                Entreprenöriella verksamheter är ryggraden i nordiska lokalsamhällen och skapar arbetstillfällen och ekonomisk tillväxt. Många framgångsrika små och medelstora företag når dock en punkt där de behöver nya resurser och expertis för att ta nästa steg i sin utveckling.
              </p>
            </FadeIn>
            
            <FadeIn delay={600} duration={900} direction="up">
              <p className="text-lg md:text-xl leading-relaxed text-muted-foreground">
                Med vårt långsiktiga ägarperspektiv, djup operationell kunskap och avancerad AI-kompetens, strävar Nivo efter att vara den partner som möjliggör denna utveckling.
              </p>
            </FadeIn>
            
            <FadeIn delay={800} duration={900} direction="up">
              <p className="text-lg md:text-xl leading-relaxed text-muted-foreground">
                Genom fokuserade förvärv och systematisk utveckling hjälper vi etablerade nordiska företag att modernisera sina verksamheter och nå sin fulla tillväxtpotential.
              </p>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Entrepreneurs;