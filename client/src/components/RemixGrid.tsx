import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Remix } from "@shared/schema";

interface RemixCardProps {
  remix: Remix;
}

const RemixCard = ({ remix }: RemixCardProps) => {
  const formattedDate = remix.createdAt 
    ? formatDistanceToNow(new Date(remix.createdAt), { addSuffix: true })
    : "recently";

  return (
    <Link href={`/scene/${remix.id}`}>
      <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer">
        <div className="relative pt-[56.25%] bg-dark">
          {/* Video thumbnail */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-primary font-heading text-xl">
            {remix.topic}
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg">
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
    </Link>
  );
};

interface RemixGridProps {
  remixes: Remix[];
  title?: string;
  showViewAll?: boolean;
}

const RemixGrid = ({
  remixes,
  title = "Popular Remixes",
  showViewAll = true,
}: RemixGridProps) => {
  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-heading font-bold text-dark">{title}</h2>
        {showViewAll && (
          <Link href="/explore">
            <a className="text-secondary hover:underline font-medium">View All</a>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {remixes.map((remix) => (
          <RemixCard key={remix.id} remix={remix} />
        ))}
      </div>
    </div>
  );
};

export default RemixGrid;
