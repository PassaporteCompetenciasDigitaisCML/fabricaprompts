import React, { useState } from 'react';
import { StarIcon } from './Icons';

interface StarRatingProps {
  count?: number;
  rating: number;
  onRating: (rate: number) => void;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({ count = 5, rating, onRating, className }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const getColor = (index: number) => {
    if (hoverRating >= index) {
      return 'text-amber-400';
    }
    if (!hoverRating && rating >= index) {
      return 'text-amber-400';
    }
    return 'text-slate-300';
  };

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      {[...Array(count)].map((_, i) => {
        const ratingValue = i + 1;
        return (
          <StarIcon
            key={ratingValue}
            className={`w-8 h-8 cursor-pointer transition-colors ${getColor(ratingValue)}`}
            onClick={() => onRating(ratingValue)}
            onMouseEnter={() => setHoverRating(ratingValue)}
            onMouseLeave={() => setHoverRating(0)}
          />
        );
      })}
    </div>
  );
};

export default StarRating;
