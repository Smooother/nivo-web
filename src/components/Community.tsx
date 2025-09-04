
import React from 'react';
import { cn } from '@/lib/utils';
import FadeIn from './animations/FadeIn';
import { Card, CardContent } from '@/components/ui/card';

interface CommunityProps {
  className?: string;
}

const Community: React.FC<CommunityProps> = ({ className }) => {
  const pillars = [
    {
      title: "Gemenskap",
      description: "Gemenskap före investering - koppla samman lovande entreprenörer med dedikerade evenemang"
    },
    {
      title: "Media",
      description: "Media + innehåll för att bygga berättelsen kring teknik och mångfaldiga team - och hjälpa dem bygga momentum"
    }
  ];

  return (
    <section id="community" className={cn('py-20 bg-gray-50', className)}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto mb-16">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-serif mb-8 text-center">Gemenskap och Media</h2>
          </FadeIn>
          
          <FadeIn delay={100}>
            <p className="text-xl text-center mb-12">
              Vi vill frigöra ny mångfaldig teambildning genom att samla kraften från gemenskap och media.
              Med media och gemenskapsevenemang kommer vi att koppla samman med framtida entreprenörer tidigare.
            </p>
          </FadeIn>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pillars.map((pillar, index) => (
            <FadeIn key={index} delay={150 + index * 50}>
              <Card className="border-0 shadow-sm h-full">
                <CardContent className="p-8">
                  <h3 className="text-xl font-medium mb-4 font-serif">{pillar.title}</h3>
                  <p className="text-muted-foreground">{pillar.description}</p>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Community;
