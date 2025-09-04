
import React from 'react';
import { cn } from '@/lib/utils';
import FadeIn from './animations/FadeIn';
import TextReveal from './animations/TextReveal';

interface AboutProps {
  className?: string;
  id?: string;
}

const About: React.FC<AboutProps> = ({ className, id }) => {
  return (
    <section id={id} className={cn('py-20 md:py-32 bg-gray-50', className)}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-12 gap-12 md:gap-16 items-start max-w-6xl mx-auto">
          <FadeIn className="md:col-span-4" delay={100}>
            <div className="md:sticky md:top-32">
              <FadeIn delay={200} direction="right">
                <span className="text-sm font-medium text-accent mb-3 inline-block">Vårt team</span>
              </FadeIn>
              <TextReveal delay={300} duration={1000}>
                <h2 className="text-2xl md:text-3xl font-serif font-medium tracking-tight">Ett team av erfarna företagsbyggare</h2>
              </TextReveal>
            </div>
          </FadeIn>
          
          <FadeIn className="md:col-span-8" delay={400}>
            <div className="space-y-6">
              <FadeIn delay={500} duration={900} direction="up">
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Nivo erbjuder nordiska bolag en möjlighet att accelerera tillväxt och lönsamhet genom ett operationellt engagerat team och långsiktigt kapital. Alltid med fokus på konkreta resultat och hållbart värdeskapande.
                </p>
              </FadeIn>
              <FadeIn delay={700} duration={900} direction="up">
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Vi värdesätter schysst företagande, enkelhet och samarbeten med människor som delar våra värderingar. Vår filosofi är att bygga partnerskap som varar och skapa framgångar som står sig över tid, med en stark grund i våra gemensamma ambitioner och långsiktiga visioner.
                </p>
              </FadeIn>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default About;
