import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchBar = ({ className }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const mockSuggestions = [
    { id: 1, name: 'RTX 3080 Graphics Card', category: 'Graphic Card' },
    { id: 2, name: 'AMD Ryzen 9 5900X', category: 'Processor' },
    { id: 3, name: 'Kingston 32GB DDR4 RAM', category: 'Memory' },
    { id: 4, name: 'Samsung 1TB SSD', category: 'Storage' }
  ];
  
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.length > 2) {
      setIsLoading(true);
      setTimeout(() => {
        const filtered = mockSuggestions.filter(item => 
          item.name.toLowerCase().includes(value.toLowerCase())
        );
        setSuggestions(filtered);
        setIsLoading(false);
      }, 300);
    } else {
      setSuggestions([]);
    }
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setSuggestions([]);
    }
  };
  
  const handleSuggestionClick = (suggestion) => {
    navigate(`/product/${suggestion.id}`);
    setSearchTerm('');
    setSuggestions([]);
  };
  
  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSearchSubmit}>
        <div className="relative">
          <input
            type="text"
            placeholder="Search for PC products, laptops, parts..."
            className="w-full input input-bordered pl-10 pr-10 rounded-full focus:outline-none focus:ring-2 focus:ring-npc-gold/30 focus:border-npc-gold transition-all"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <i className="fas fa-search text-npc-gold"></i>
          </span>
          {searchTerm && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-npc-gold transition-colors"
              onClick={() => {
                setSearchTerm('');
                setSuggestions([]);
              }}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </form>
      
      {(suggestions.length > 0 || isLoading) && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <span className="loading loading-spinner loading-sm mr-2 text-npc-gold"></span>
              Searching...
            </div>
          ) : (
            <ul className="py-2">
              {suggestions.map(suggestion => (
                <li
                  key={suggestion.id}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center transition-colors"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                    <i className="fas fa-search text-npc-gold text-xs"></i>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{suggestion.name}</div>
                    <div className="text-xs text-gray-500">{suggestion.category}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          
          <div className="p-3 border-t border-gray-100">
            <button 
              onClick={handleSearchSubmit}
              className="w-full btn btn-sm bg-gray-100 hover:bg-gray-200 text-gray-700 normal-case border-none"
            >
              View all results for "<span className="font-medium text-npc-gold">{searchTerm}</span>"
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;