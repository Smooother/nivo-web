
import React from 'react';
import { cn } from '@/lib/utils';
import FadeIn from './animations/FadeIn';

interface ManifestoProps {
  className?: string;
}

const Manifesto: React.FC<ManifestoProps> = ({ className }) => {
  return (
    <section id="thesis" className={cn('py-20 bg-white', className)}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-serif mb-10 text-center">Vår filosofi</h2>
          </FadeIn>
          
          <FadeIn delay={100}>
            <p className="text-xl md:text-2xl leading-relaxed mb-12 font-serif text-center">
              Project Nico erbjuder svenska bolag en möjlighet att accelerera tillväxt och lönsamhet genom ett operationellt engagerat team och långsiktigt kapital.
            </p>
          </FadeIn>
          
          <FadeIn delay={200}>
            <p className="text-lg leading-relaxed text-muted-foreground text-center">
              Vi värdesätter schysst företagande, enkelhet och samarbeten med människor som delar våra värderingar. Vår filosofi är att bygga partnerskap som varar och skapa framgångar som står sig över tid.
            </p>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default Manifesto;

