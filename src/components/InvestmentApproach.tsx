
import React from 'react';
import { cn } from '@/lib/utils';
import FadeIn from './animations/FadeIn';
import { Card, CardContent } from '@/components/ui/card';

interface InvestmentApproachProps {
  className?: string;
}

const InvestmentApproach: React.FC<InvestmentApproachProps> = ({ className }) => {
  const investmentTiers = [
    {
      title: "Operativ Optimering",
      description: "Vi erbjuder skräddarsytt operationellt stöd efter varje företags specifika behov, med expertis inom processoptimering, kostnadseffektivisering, strategisk utveckling och AI-implementation."
    },
    {
      title: "Digital Acceleration",
      description: "Effektivisering genom teknologi är en central del av vår strategi. Vi erbjuder datadrivna marknadsföringstjänster för att accelerera tillväxt genom CRM-, SEO- och konverteringsoptimering."
    },
    {
      title: "Expansionskapital",
      description: "Långsiktigt och fritt kapital för att driva tillväxt och lönsamhet genom internationell expansion, produktionseffektivisering, produktutveckling och företagsförvärv."
    },
    {
      title: "Rekryteringstjänster",
      description: "Vårt omfattande nätverk fungerar som en katalysator för tillväxt. Vi erbjuder rekryteringstjänster, från interimslösningar och konsulter till erfarna ledare och styrelsemedlemmar."
    }
  ];

  return (
    <section id="investment" className={cn('py-20 bg-gray-50', className)}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto mb-16">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-serif mb-8 text-center">Våra tjänster</h2>
          </FadeIn>
          <FadeIn delay={100}>
            <p className="text-lg text-center text-muted-foreground mb-12">
              Vi erbjuder ett komplett stödpaket för tillväxtföretag - från operativ optimering och digital acceleration till expansionskapital och rekryteringstjänster. Alltid med fokus på konkreta resultat och hållbart värdeskapande.
            </p>
          </FadeIn>
        </div>
        
        <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          {investmentTiers.map((tier, index) => (
            <FadeIn key={index} delay={150 + index * 50}>
              <Card className="border-0 shadow-sm h-full">
                <CardContent className="p-8">
                  <h3 className="text-xl font-medium mb-4 font-serif">{tier.title}</h3>
                  <p className="text-muted-foreground">{tier.description}</p>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InvestmentApproach;
