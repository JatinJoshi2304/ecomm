'use client';

import { useState } from 'react';

interface Color {
  id: string;
  name: string;
  hexCode: string;
}

interface ColorSelectorProps {
  colors: Color[];
  selectedColor: string;
  onColorChange: (colorId: string) => void;
  label?: string;
  required?: boolean;
}

export default function ColorSelector({ 
  colors, 
  selectedColor, 
  onColorChange, 
  label = "Color",
  required = false 
}: ColorSelectorProps) {
  const [showAllColors, setShowAllColors] = useState(false);
  const displayColors = showAllColors ? colors : colors.slice(0, 8);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="space-y-3">
        {/* Color Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {displayColors.map((color) => (
            <button
              key={color.id}
              type="button"
              onClick={() => onColorChange(color.id)}
              className={`relative w-12 h-12 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                selectedColor === color.id
                  ? 'border-blue-600 ring-2 ring-blue-200'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color.hexCode }}
              title={color.name}
            >
              {selectedColor === color.id && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Show More/Less Button */}
        {colors.length > 8 && (
          <button
            type="button"
            onClick={() => setShowAllColors(!showAllColors)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showAllColors ? 'Show Less' : `Show All ${colors.length} Colors`}
          </button>
        )}

        {/* Selected Color Info */}
        {selectedColor && (
          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
            <div
              className="w-6 h-6 rounded-full border border-gray-300"
              style={{ backgroundColor: colors.find(c => c.id === selectedColor)?.hexCode }}
            />
            <span className="text-sm text-gray-700">
              Selected: {colors.find(c => c.id === selectedColor)?.name}
            </span>
          </div>
        )}

        {/* No Color Selected */}
        {!selectedColor && (
          <div className="text-sm text-gray-500 italic">
            No color selected
          </div>
        )}
      </div>
    </div>
  );
}
