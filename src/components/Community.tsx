
import React from 'react';
import { cn } from '@/lib/utils';
import FadeIn from './animations/FadeIn';
import { Card, CardContent } from '@/components/ui/card';

interface CommunityProps {
  className?: string;
}

const Community: React.FC<CommunityProps> = ({ className }) => {
  return (
    <section id="contact" className={cn('py-20 md:py-32 bg-secondary', className)}>
      <div className="container mx-auto px-4 md:px-6">
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-serif mb-8 text-secondary-foreground">
              Är ditt företag redo för nästa steg?
            </h2>
            <p className="text-lg text-secondary-foreground/80 mb-12">
              Vi söker ständigt efter nya möjligheter och intressanta samarbeten. Om du driver ett etablerat nordiskt företag och funderar på framtiden, eller om du är en branschexpert som vill diskutera möjligheter, hör gärna av dig.
            </p>
          </div>
        </FadeIn>
        
        <FadeIn delay={200}>
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Namn
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="Ditt namn"
                  />
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Företag
                  </label>
                  <input
                    type="text"
                    id="company"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="Ditt företag"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    E-post
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="din@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Meddelande
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="Berätta om ditt företag och vad du funderar på..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-accent text-accent-foreground py-3 px-4 rounded-md font-medium hover:bg-accent/90 transition-colors"
                >
                  Skicka meddelande
                </button>
              </form>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default Community;
