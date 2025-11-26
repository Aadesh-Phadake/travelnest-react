import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';

const ListingCard = ({ listing }) => {
  // Calculate average rating if reviews exist
  const avgRating = listing.reviews && listing.reviews.length > 0
    ? (listing.reviews.reduce((sum, r) => sum + r.rating, 0) / listing.reviews.length).toFixed(1)
    : null;

  return (
    <Link to={`/listings/${listing._id}`} className="group block h-full">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 h-full flex flex-col">
        
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img 
            src={listing.images[0] || listing.images || "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"} 
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
          />
          {/* Badge Overlay */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold shadow-sm">
             HOTEL
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition line-clamp-1">
              {listing.title}
            </h3>
            {avgRating && (
               <div className="flex items-center gap-1 text-sm font-medium bg-gray-50 px-1.5 py-0.5 rounded">
                 <Star className="w-3.5 h-3.5 fill-black text-black" />
                 <span>{avgRating}</span>
               </div>
            )}
          </div>

          <p className="text-gray-500 text-sm mb-4 flex items-center gap-1 line-clamp-1">
            <MapPin className="w-3.5 h-3.5" /> {listing.location}, {listing.country}
          </p>

          <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
            <div>
                <span className="font-bold text-lg text-gray-900">
                ₹{listing.price?.toLocaleString("en-IN")}
                </span>
                <span className="text-gray-400 text-xs ml-1 font-normal">/ night</span>
            </div>
            <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                +5% fee
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;