
import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import FadeIn from './animations/FadeIn';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface GapProps {
  className?: string;
}

const Gap: React.FC<GapProps> = ({ className }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [email, setEmail] = useState('');
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  
  const messages = [
    "Vill du diskutera framtida projekt eller möjligheter?",
    "Är du redo att ta nästa steg på din tillväxtresa?",
    "Låt oss utforska hur vi kan skapa värde tillsammans"
  ];
  
  React.useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setOpacity(0);
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length);
        setOpacity(1);
      }, 1000);
    }, 4000);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      console.log('Subscribing email:', email);
      // Here you would typically send this to a backend
      alert(`Tack för ditt meddelande! Vi hör av oss till ${email} snart.`);
      setEmail('');
    }
  };

  const statistics = [
    {
      title: "Tillväxtfokus",
      description: "Vi fokuserar på konkreta resultat och hållbart värdeskapande för svenska tillväxtföretag"
    },
    {
      title: "Operativt engagemang",
      description: "Genom operationellt stöd skapar vi värde bortom traditionell kapitalinvestering"
    },
    {
      title: "Långsiktiga partnerskap",
      description: "Vår filosofi bygger på att skapa partnerskap som varar och framgångar som står sig över tid"
    }
  ];

  return (
    <section id="gap" className={cn('py-20 bg-gray-50', className)}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto mb-16">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-serif mb-8 text-center">Låt oss diskutera</h2>
          </FadeIn>
          
          <FadeIn delay={100}>
            <p className="text-xl text-center mb-8">
              Vi på Project Nico är ständigt på jakt efter spännande samarbeten och nya möjligheter
            </p>
          </FadeIn>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
          {statistics.map((stat, index) => (
            <FadeIn key={index} delay={150 + index * 50}>
              <Card className="border-0 shadow-sm h-full">
                <CardContent className="p-6">
                  <h3 className="text-xl font-medium mb-3 font-serif">{stat.title}</h3>
                  <p className="text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
        
        <div className="relative max-w-full mx-auto">
          <FadeIn delay={200}>
            <div className="relative">
              <div className="w-full h-[500px] overflow-hidden">
                <img 
                  src="/lovable-uploads/dabbf929-5dd0-4794-a011-fe43bf4b3418.png" 
                  alt="Beautiful orangery with palm trees and plants" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30"></div>
              </div>
              
              {/* Centered newsletter box overlaid on the image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-md max-w-md w-full mx-4">
                  <h3 className="text-2xl font-serif mb-6 text-center">Kontakta oss</h3>
                  
                  <div className="flex justify-center mb-6">
                    <Button 
                      className="bg-orangery-500/10 text-orangery-700 border border-orangery-200 hover:bg-orangery-500/20 min-h-[3.5rem] min-w-[220px] md:min-w-[280px]"
                    >
                      <span 
                        className="transition-opacity duration-1000 ease-in-out"
                        style={{ opacity: opacity }}
                      >
                        {messages[messageIndex]}
                      </span>
                    </Button>
                  </div>
                  
                  <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                    <Input 
                      type="email" 
                      placeholder="Ange din e-post för kontakt" 
                      className="text-gray-800 bg-gray-50/80 border-gray-200 focus-visible:ring-gray-500" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Button 
                      type="submit" 
                      className="bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      Skicka
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default Gap;
