import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Remix } from "@shared/schema";
import RotGrid from "@/components/RotGrid";

const ExplorePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "popular">("popular");
  
  // Fetch remixes with search and sort params
  const { data: remixes, isLoading } = useQuery({
    queryKey: ["/api/remixes", { search: searchTerm, sortBy: sortBy, limit: 20 }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('sortBy', sortBy);
      params.append('limit', '20');
      
      const response = await fetch(`/api/remixes?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch remixes');
      }
      return response.json();
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });
  
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // The actual search is handled by the query key change
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-heading font-bold text-dark mb-6">
          Explore Rots
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <form onSubmit={handleSearch} className="flex-grow">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search rots..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-5 h-5 text-gray-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </div>
            </div>
          </form>
          
          <div className="flex gap-2">
            <Button
              variant={sortBy === "popular" ? "default" : "outline"}
              onClick={() => setSortBy("popular")}
              className={sortBy === "popular" ? "bg-secondary" : ""}
            >
              Most Popular
            </Button>
            <Button
              variant={sortBy === "newest" ? "default" : "outline"}
              onClick={() => setSortBy("newest")}
              className={sortBy === "newest" ? "bg-secondary" : ""}
            >
              Newest
            </Button>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
        </div>
      ) : remixes && remixes.length > 0 ? (
        <RotGrid 
          remixes={remixes as Remix[]} 
          title="All Rots" 
          showViewAll={false}
        />
      ) : (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-2xl font-heading font-bold text-dark mb-2">
            No rots found
          </h2>
          <p className="text-gray-500 mb-6">
            {searchTerm
              ? `We couldn't find any rots matching "${searchTerm}"`
              : "There are no rots available yet"}
          </p>
          <Button
            className="bg-secondary hover:bg-blue-600"
            onClick={() => {
              setSearchTerm("");
              setSortBy("popular");
            }}
          >
            Clear Search
          </Button>
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
