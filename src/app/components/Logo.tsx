'use client';

interface LogoProps {
  color?: string;
  textColor?: string;
  size?: 'small' | 'medium' | 'large';
}

export const Logo = ({ color = 'black', textColor, size = 'medium' }: LogoProps) => {
  // Determine icon container and text size based on the size prop
  const containerSizes = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12',
  };

  const textSizes = {
    small: 'text-xl',
    medium: 'text-2xl',
    large: 'text-3xl',
  };

  const iconSizes = {
    small: 'w-5 h-5',
    medium: 'w-6 h-6',
    large: 'w-7 h-7',
  };

  // Text color defaults to the main color if not specified
  const actualTextColor = textColor || color;

  return (
    <div className="flex items-center space-x-2">
      <div 
        className={`${containerSizes[size]} bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center group overflow-hidden relative shadow-lg`}
      >
        {/* Animated background glow */}
        <div className="absolute w-20 h-20 -top-10 -left-10 bg-white/20 rotate-45 transform transition-transform duration-700 group-hover:translate-x-20 group-hover:translate-y-20"></div>
        
        <svg
          className={`${iconSizes[size]} text-white`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div className="flex flex-col">
        <span 
          className={`${textSizes[size]} font-bold tracking-tight`}
          style={{ color: actualTextColor }}
        >
          FinanceFlow
        </span>
        <span className="text-xs text-gray-500 -mt-1 hidden sm:block">Smart Wealth Management</span>
      </div>
    </div>
  );
};


// export const Logo = () => {
//   return (
//     <div className="flex items-center space-x-2">
//       <svg
//         className="w-8 h-8 text-indigo-600"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="2"
//         viewBox="0 0 24 24"
//         xmlns="http://www.w3.org/2000/svg"
//       >
//         <path
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           d="M12 6.253v13m0-13C10.832 5.477 9.246 4.75 7.5 4.75a12.742 12.742 0 00-2.269 1.005l-3.772 2.262a11.407 11.407 0 019 4.94m0-13C13.168 5.477 14.754 4.75 16.5 4.75a12.742 12.742 0 012.269 1.005l3.772 2.262a11.407 11.407 0 00-9 4.94"
//         />
//       </svg>
//       <span className="text-xl font-bold text-gray-800">FinanceFlow</span>
//     </div>
//   )
// }