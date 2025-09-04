
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
            <h2 className="text-3xl md:text-4xl font-serif mb-10 text-center">Vårt synsätt</h2>
          </FadeIn>
          
          <FadeIn delay={100}>
            <p className="text-xl md:text-2xl leading-relaxed mb-12 font-serif text-center">
              Nästa våg av snabbväxande startups kommer från förbisedda grundare: företagsledare, akademidrivna innovatörer och mångfaldiga team.
            </p>
          </FadeIn>
          
          <FadeIn delay={200}>
            <p className="text-lg leading-relaxed text-muted-foreground text-center">
              Att rikta investeringar mot mångfaldiga team är ett strategiskt drag som inte bara främjar rättvisa utan också utnyttjar outnyttjad potential för ekonomisk tillväxt — och högre avkastning
            </p>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default Manifesto;

