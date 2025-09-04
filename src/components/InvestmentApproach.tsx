
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
      title: "Pre-Seed Acceleratorfond",
      description: "€30K–€150K biljetter, med team som deltar i vårt 16-veckors accelerationsprogram fokuserat på validering och tidig dragkraft."
    },
    {
      title: "Seed-fond",
      description: "€200K–€400K investeringar i 15+ startups för att stödja uppskalning, marknadsexpansion och teamtillväxt, med uppföljningskapital tillgängligt."
    }
  ];

  return (
    <section id="investment" className={cn('py-20 bg-gray-50', className)}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto mb-16">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-serif mb-8 text-center">Investeringsmetod</h2>
          </FadeIn>
          <FadeIn delay={100}>
            <p className="text-lg text-center text-muted-foreground mb-12">
              Vi investerar sektorsoberoende i pre-seed och seed-stadiet i företag som drivs av förbisedda grundare - såsom könsmångfaldiga team, akademiska forskare, företagsägare och företagsproffs som övergår till teknikentreprenörskap. Vår tes är att enorm outnyttjad talang i dessa kategorier kan ge upphov till högeffektiva startups om de ges tidigt stöd. Vi tror på domänexpertis och de orättvisa fördelar dessa grundare tillför.
            </p>
          </FadeIn>
        </div>
        
        <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
          {investmentTiers.map((tier, index) => (
            <FadeIn key={index} delay={150 + index * 50}>
              <Card className="border-0 shadow-sm h-full">
                <CardContent className="p-8">
                  <h3 className="text-xl font-medium mb-4 font-serif">{tier.title}</h3>
                  <p className="text-muted-foreground mb-4">{tier.description}</p>
                  {index === 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm font-medium">16-veckors accelerationsprogram</p>
                    </div>
                  )}
                  {index === 1 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm font-medium">Uppföljningskapital tillgängligt</p>
                    </div>
                  )}
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
