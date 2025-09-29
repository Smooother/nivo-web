
import React from 'react';
import { cn } from '@/lib/utils';
import FadeIn from './animations/FadeIn';
import { Card, CardContent } from '@/components/ui/card';

interface CommunityProps {
  className?: string;
}

const Community: React.FC<CommunityProps> = ({ className }) => {
  return (
    <section id="contact" className={cn('py-16 md:py-20 bg-secondary', className)}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start max-w-6xl mx-auto">
          <FadeIn>
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-serif text-secondary-foreground">
                Är ditt företag redo för nästa steg?
              </h2>
              <p className="text-lg leading-relaxed text-secondary-foreground/80">
                Nivo är ständigt på jakt efter kvalitetsföretag och intressanta förvärvsmöjligheter. Om du är företagare som funderar på nästa steg för ditt bolag, eller om du är branschexpert med insikter om potentiella förvärv, tveka inte att höra av dig! Vi ser fram emot att höra från dig och utforska hur vi tillsammans kan utveckla framgångsrika verksamheter.
              </p>
            </div>
          </FadeIn>
          
          <FadeIn delay={200}>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Namn
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                    placeholder="Ditt namn"
                  />
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                    Företag
                  </label>
                  <input
                    type="text"
                    id="company"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                    placeholder="Ditt företag"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    E-post
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                    placeholder="din@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Meddelande
                  </label>
                  <textarea
                    id="message"
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                    placeholder="Berätta om ditt företag..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-md font-medium hover:bg-primary/90 transition-colors"
                >
                  Skicka meddelande
                </button>
              </form>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default Community;
