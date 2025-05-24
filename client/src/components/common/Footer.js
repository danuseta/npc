import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-npc-navy text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4">
            <div className="flex items-center justify-center">
              <img src="/npc.jpg" alt="NPC Logo" className="h-8 mr-2" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/30x30/6B7280/FFFFFF?text=NPC";
                }}
              />
              <h3 className="text-lg font-bold">
                NPC <span className="text-npc-gold">Store</span>
              </h3>
            </div>
          </div>
          
          <div className="text-gray-400 text-sm mb-3">
            <p>Nusantara PC Store - Your trusted source for quality computer parts</p>
          </div>
          
          <div className="text-gray-500 text-xs">
            &copy; {currentYear} NPC Store. All Rights Reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;