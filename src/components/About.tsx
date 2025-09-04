
import React from 'react';
import { cn } from '@/lib/utils';
import FadeIn from './animations/FadeIn';

interface AboutProps {
  className?: string;
  id?: string;
}

const About: React.FC<AboutProps> = ({ className, id }) => {
  return (
    <section id={id} className={cn('py-20 md:py-32 bg-gray-50', className)}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-12 gap-12 md:gap-20 items-start">
          <FadeIn className="md:col-span-5">
            <div className="flex flex-col space-y-6">
              <div>
                <span className="text-sm md:text-base font-medium text-accent mb-2 inline-block">Vårt team</span>
                <h2 className="text-3xl md:text-5xl font-serif font-medium tracking-tight mb-6">Ett team av erfarna företagsbyggare</h2>
              </div>
              
              <p className="text-lg text-muted-foreground">
                Nivo erbjuder nordiska bolag en möjlighet att accelerera tillväxt och lönsamhet genom ett operationellt engagerat team och långsiktigt kapital. Alltid med fokus på konkreta resultat och hållbart värdeskapande.
              </p>
              <p className="text-lg text-muted-foreground">
                Vi värdesätter schysst företagande, enkelhet och samarbeten med människor som delar våra värderingar. Vår filosofi är att bygga partnerskap som varar och skapa framgångar som står sig över tid, med en stark grund i våra gemensamma ambitioner och långsiktiga visioner.
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
