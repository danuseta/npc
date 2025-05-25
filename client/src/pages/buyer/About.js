import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

const founder1Image = 'https://ik.imagekit.io/5tqbccerd/WhatsApp%20Image%202025-05-18%20at%2015.36.55_b1dea01f.jpg?updatedAt=1747559926890';
const founder2Image = 'https://ik.imagekit.io/5tqbccerd/WhatsApp%20Image%202025-05-18%20at%2015.38.47_585e38f4.jpg?updatedAt=1747559940927';
const founder3Image = 'https://ik.imagekit.io/5tqbccerd/WhatsApp%20Image%202025-05-18%20at%2015.39.58_2ae1997d.jpg?updatedAt=1747559957369';
const founder4Image = 'https://ik.imagekit.io/5tqbccerd/IMG_5181.JPG?updatedAt=1747560146494';

const founders = [
  {
    id: 1,
    name: 'Nur Fitri Rahmadanti',
    npm: '2215061001',
    role: 'Chief Marketing Officer',
    image: founder1Image
  },
  {
    id: 2,
    name: 'Dimas Kurnia Putra',
    npm: '2215061005',
    role: 'Chief Financial Officer',
    image: founder2Image
  },
  {
    id: 3,
    name: 'I Komang Widya Indra',
    npm: '2215061006',
    role: 'Chief Executive Officer',
    image: founder3Image
  },
  {
    id: 4,
    name: 'M Danu Seta W',
    npm: '2215061085',
    role: 'Chief Technology Officer',
    image: founder4Image
  }
];

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-6 sm:pt-8 md:pt-10">
      {/* <Helmet>
        <title>About Us | NPC Store</title>
        <meta name="description" content="Learn about Nusantara PC Store, the premier destination for computer hardware and accessories in Indonesia." />
      </Helmet> */}

      <main className="container mx-auto px-4 py-4 sm:py-6">
        <div className="w-full mb-6 sm:mb-10 bg-gradient-to-r from-npc-navy via-npc-brown to-npc-gold rounded-lg sm:rounded-2xl overflow-hidden shadow-lg">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="order-1 lg:order-2 p-5 sm:p-6 lg:w-1/2 flex justify-center">
              <img 
                src="./komponen.png" 
                alt="PC Components" 
                className="max-w-full h-auto rounded-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://media.istockphoto.com/id/1177857617/vector/computer-devices-isometric-illustrations-set.jpg?s=612x612&w=0&k=20&c=pfmvcgIq2pXWNxwnWAcqIIdKMAGIQd55-vjBGTNqF7c=";
                }}
              />
            </div>
            <div className="order-2 lg:order-1 p-5 sm:p-6 md:p-8 lg:p-10 lg:w-1/2 text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">About NPC Store</h1>
              <p className="text-base sm:text-lg text-gray-200 max-w-xl mx-auto lg:mx-0">
                Your premier destination for high-quality PC components and tech accessories in Indonesia
              </p>
              <div className="mt-4 sm:mt-6 inline-block">
                <div className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 rounded-lg">
                  <p className="text-white text-xs sm:text-sm md:text-base">
                    <i className="fas fa-check-circle text-npc-gold mr-2"></i>
                    Authentic products with official warranty
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-5 sm:p-6 md:p-8 mb-6 sm:mb-8 md:mb-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-npc-navy mb-4 sm:mb-6">Our Story</h2>
          
          <div className="space-y-4 sm:space-y-6 text-sm sm:text-base text-gray-700">
            <p>
              Nusantara PC Store (NPC Store) was developed in 2025 by four Informatics Engineering students from the University of Lampung (UNILA) as their final project for the E-Business course. This innovative e-commerce platform was created to demonstrate modern web development techniques and digital business strategies.
            </p>
            
            <p>
              Our project showcases a comprehensive online marketplace specifically designed for PC components and accessories, featuring user-friendly interfaces, secure payment systems, and efficient product management. Through this academic endeavor, we aim to bridge the gap between theoretical knowledge and practical application in the field of electronic business.
            </p>
            
            <p>
              As a student-driven initiative, NPC Store represents our commitment to learning and innovation in the digital commerce space. We've implemented modern technologies and best practices to create a platform that could serve as a real-world solution for tech enthusiasts and PC builders.
            </p>
          </div>
          
          <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border border-gray-100">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-npc-navy mb-2 sm:mb-3">Our Mission</h3>
              <p className="text-sm sm:text-base text-gray-700">
                To demonstrate the practical application of E-Business concepts through the development of a comprehensive e-commerce platform, while showcasing modern web technologies and digital business strategies learned during our Informatics Engineering studies at UNILA.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border border-gray-100">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-npc-navy mb-2 sm:mb-3">Our Vision</h3>
              <p className="text-sm sm:text-base text-gray-700">
                To create an innovative and educational e-commerce platform that serves as a model for future Informatics Engineering students, demonstrating how academic knowledge can be transformed into real-world digital solutions.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 sm:mb-8 md:mb-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-npc-navy mb-4 sm:mb-6 text-center">Meet Our C-Level Team</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {founders.map(founder => (
              <div key={founder.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-4 flex justify-center">
                  <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden">
                    <img 
                      src={founder.image} 
                      alt={founder.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-lg font-bold text-npc-navy">{founder.name}</h3>
                  <p className="text-sm text-gray-500 mb-1">NPM: {founder.npm}</p>
                  <p className="text-npc-gold font-semibold">{founder.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* <div className="mb-6 sm:mb-8 md:mb-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-npc-navy text-center mb-4 sm:mb-6">
            Our Core Values
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="card bg-white shadow-sm hover:shadow-md transition-all p-4 sm:p-6 text-center">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-npc-gold/10 flex items-center justify-center mb-3 sm:mb-4">
                <i className="fas fa-check-circle text-npc-gold text-xl sm:text-2xl"></i>
              </div>
              <h3 className="font-bold text-md sm:text-lg mb-1 sm:mb-2 text-npc-navy">Quality Assurance</h3>
              <p className="text-gray-600 text-xs sm:text-sm">We rigorously verify the authenticity and quality of every product</p>
            </div>
            
            <div className="card bg-white shadow-sm hover:shadow-md transition-all p-4 sm:p-6 text-center">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-npc-gold/10 flex items-center justify-center mb-3 sm:mb-4">
                <i className="fas fa-truck text-npc-gold text-xl sm:text-2xl"></i>
              </div>
              <h3 className="font-bold text-md sm:text-lg mb-1 sm:mb-2 text-npc-navy">Fast Shipping</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Shipping nationwide with express delivery options</p>
            </div>
            
            <div className="card bg-white shadow-sm hover:shadow-md transition-all p-4 sm:p-6 text-center">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-npc-gold/10 flex items-center justify-center mb-3 sm:mb-4">
                <i className="fas fa-headset text-npc-gold text-xl sm:text-2xl"></i>
              </div>
              <h3 className="font-bold text-md sm:text-lg mb-1 sm:mb-2 text-npc-navy">24/7 Support</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Our support team is ready to help you anytime</p>
            </div>
            
            <div className="card bg-white shadow-sm hover:shadow-md transition-all p-4 sm:p-6 text-center">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-npc-gold/10 flex items-center justify-center mb-3 sm:mb-4">
                <i className="fas fa-shield-alt text-npc-gold text-xl sm:text-2xl"></i>
              </div>
              <h3 className="font-bold text-md sm:text-lg mb-1 sm:mb-2 text-npc-navy">Secure Payment</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Various secure and trusted payment methods</p>
            </div>
          </div>
        </div> */}

        <div className="mb-6">
          <div className="bg-gradient-to-r from-npc-gold to-npc-brown rounded-lg sm:rounded-2xl p-5 sm:p-6 md:p-8 text-center shadow-lg">
                        <h2 className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 md:mb-4">              Explore Our E-Business Project            </h2>            <p className="text-white/90 mb-3 sm:mb-4 md:mb-6 max-w-lg mx-auto text-xs sm:text-sm md:text-base">              Discover how we've implemented modern e-commerce features and digital business strategies in our Informatics Engineering final project at UNILA.            </p>
                        <Link to="/products" className="inline-block bg-white hover:bg-gray-100 text-npc-navy font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-full transition-colors shadow-md"            >              Explore Our Project            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About; 