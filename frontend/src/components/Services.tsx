import React from 'react';
import { cn } from '@/lib/utils';
import FadeIn from './animations/FadeIn';
import StaggeredContainer from './animations/StaggeredContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Settings, Zap, TrendingUp, Users } from 'lucide-react';

interface ServicesProps {
  className?: string;
  id?: string;
}

const Services: React.FC<ServicesProps> = ({ className, id }) => {
  const services = [
    {
      title: "Operativ optimering",
      description: "Vi erbjuder skräddarsytt operationellt stöd efter varje företags specifika behov, med expertis inom processoptimering, kostnadseffektivisering, strategisk utveckling och AI-implementation.",
      icon: Settings
    },
    {
      title: "Digital acceleration",
      description: "Effektivisering genom teknologi är en central del av vår strategi. Vi erbjuder dessutom datadrivna marknadsföringstjänster, utformade för att accelerera tillväxt genom bland annat CRM-, SEO- och konverteringsoptimering.",
      icon: Zap
    },
    {
      title: "Expansionskapital",
      description: "Långsiktigt och fritt kapital för att driva tillväxt och lönsamhet genom till exempel internationell expansion, produktionseffektivisering, produktutveckling och företagsförvärv.",
      icon: TrendingUp
    },
    {
      title: "Rekrytering",
      description: "Vårt omfattande nätverk fungerar som en katalysator för tillväxt. Vi erbjuder rekryteringstjänster, från interimslösningar och konsulter till erfarna ledare och styrelsemedlemmar.",
      icon: Users
    }
  ];

  return (
    <section id={id} className={cn('py-20 bg-white', className)}>
      <div className="container mx-auto px-4 md:px-6">
        <StaggeredContainer 
          staggerDelay={150} 
          className="grid md:grid-cols-2 gap-12 md:gap-16 max-w-6xl mx-auto"
        >
          {services.map((service, index) => {
            const IconComponent = service.icon;
            
            return (
              <Card key={index} className="border-0 shadow-none h-full group hover:transform hover:scale-105 transition-all duration-500">
                <CardContent className="p-0">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 group-hover:bg-gray-200 transition-colors duration-300">
                      <IconComponent className="w-6 h-6 text-gray-800 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-3 font-serif group-hover:text-accent transition-colors duration-300">{service.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </StaggeredContainer>
      </div>
    </section>
  );
};

export default Services;