
import React, { useEffect } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Manifesto from '@/components/Manifesto';
import Services from '@/components/Services';
import Entrepreneurs from '@/components/Entrepreneurs';
import About from '@/components/About';
import Community from '@/components/Community';
import Footer from '@/components/Footer';

const Index = () => {
  useEffect(() => {
    // Smooth scroll behavior for anchor links
    const anchors = Array.from(document.querySelectorAll('a[href^="#"]')) as HTMLAnchorElement[];

    const clickHandler = (e: Event) => {
      e.preventDefault();
      const anchor = e.currentTarget as HTMLAnchorElement;
      const targetId = anchor.getAttribute('href')?.substring(1);
      if (!targetId) return;
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    };

    anchors.forEach(anchor => anchor.addEventListener('click', clickHandler));
    
    return () => {
      anchors.forEach(anchor => anchor.removeEventListener('click', clickHandler));
    };
  }, []);
  
  return (
    <main className="relative">
      <Header />
      <Hero />
      <Entrepreneurs id="entrepreneurs" />
      <Manifesto id="about-nivo" />
      <Services id="services" />
      <About id="team" />
      <Community />
      <Footer />
    </main>
  );
};

export default Index;
