import { Link, useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Remix } from "@shared/schema";
import cartoonPlaceholderImg from "../assets/cartoon-placeholder.png";

interface RotCardProps {
  remix: Remix;
}

const RotCard = ({ remix }: RotCardProps) => {
  const [, navigate] = useLocation();
  
  const formattedDate = remix.createdAt 
    ? formatDistanceToNow(new Date(remix.createdAt), { addSuffix: true })
    : "recently";

  const handleClick = () => {
    navigate(`/scene/${remix.id}`);
  };

  return (
    <div
      className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative pt-[56.25%] bg-dark">
        {/* Video thumbnail */}
        <img 
          src={cartoonPlaceholderImg} 
          alt={`${remix.topic} thumbnail`}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-white font-heading font-bold text-lg mb-2">{remix.topic}</h3>
          </div>
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <button 
            className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/scene/${remix.id}`);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6 text-dark"
            >
              <path
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" 
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-heading font-bold text-lg mb-2">{remix.topic}</h3>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{remix.views || 0} views</span>
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
};

interface RotGridProps {
  remixes: Remix[];
  title?: string;
  showViewAll?: boolean;
}

const RotGrid = ({
  remixes,
  title = "Popular Rots",
  showViewAll = true,
}: RotGridProps) => {
  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-heading font-bold text-dark">{title}</h2>
        {showViewAll && (
          <Link href="/explore" className="text-secondary hover:underline font-medium">
            View All
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {remixes.map((remix) => (
          <RotCard key={remix.id} remix={remix} />
        ))}
      </div>
    </div>
  );
};

export default RotGrid;