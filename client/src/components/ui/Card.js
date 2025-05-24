import React from 'react';

const Card = ({ 
  children, 
  className = "", 
  title,
  titleClass = "text-lg font-medium mb-2",
  bodyClass = "p-4",
  headerClass = "px-4 py-3 border-b",
  footerClass = "px-4 py-3 border-t",
  footer,
  header,
  elevation = "md",
  rounded = "md"
}) => {
  const elevationClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow",
    lg: "shadow-md",
    xl: "shadow-lg"
  };

  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded",
    lg: "rounded-lg",
    xl: "rounded-xl"
  };

  return (
    <div className={`bg-white ${elevationClasses[elevation]} ${roundedClasses[rounded]} ${className}`}>
      {(header || title) && (
        <div className={headerClass}>
          {header || (title && <h3 className={titleClass}>{title}</h3>)}
        </div>
      )}
      
      <div className={bodyClass}>
        {children}
      </div>
      
      {footer && (
        <div className={footerClass}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
