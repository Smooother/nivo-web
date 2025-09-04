
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
        <div className="grid md:grid-cols-12 gap-12 md:gap-20 items-start">
          <FadeIn className="md:col-span-5" delay={100}>
            <div className="flex flex-col space-y-6">
              <div>
                <FadeIn delay={200} direction="right">
                  <span className="text-sm md:text-base font-medium text-accent mb-2 inline-block">Vårt team</span>
                </FadeIn>
                <TextReveal delay={300} duration={1000}>
                  <h2 className="text-3xl md:text-5xl font-serif font-medium tracking-tight mb-6">Ett team av erfarna företagsbyggare</h2>
                </TextReveal>
              </div>
              
              <FadeIn delay={500} duration={900} direction="up">
                <p className="text-lg text-muted-foreground">
                  Nivo erbjuder nordiska bolag en möjlighet att accelerera tillväxt och lönsamhet genom ett operationellt engagerat team och långsiktigt kapital. Alltid med fokus på konkreta resultat och hållbart värdeskapande.
                </p>
              </FadeIn>
              <FadeIn delay={700} duration={900} direction="up">
                <p className="text-lg text-muted-foreground">
                  Vi värdesätter schysst företagande, enkelhet och samarbeten med människor som delar våra värderingar. Vår filosofi är att bygga partnerskap som varar och skapa framgångar som står sig över tid, med en stark grund i våra gemensamma ambitioner och långsiktiga visioner.
                </p>
              </FadeIn>
            </div>
          </FadeIn>
          
          <FadeIn delay={400} className="md:col-span-7" direction="left" scale>
            <div className="relative h-[500px] lg:h-[600px] w-full rounded-lg overflow-hidden group">
              <img 
                src="/lovable-uploads/47f9a1d0-4458-400a-8fc0-79adf093cf18.png"
                alt="Interior with palm trees and ornate architecture"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default About;
