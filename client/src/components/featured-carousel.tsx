import { useQuery } from "@tanstack/react-query";
import { ItemCard } from "./item-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export function FeaturedCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: items, isLoading } = useQuery({
    queryKey: ["/api/items"],
  });

  // Show featured items (first 8 items)
  const featuredItems = items?.slice(0, 8) || [];
  const itemsPerPage = 4;
  const totalPages = Math.ceil(featuredItems.length / itemsPerPage);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const getCurrentPageItems = () => {
    const startIndex = currentIndex * itemsPerPage;
    return featuredItems.slice(startIndex, startIndex + itemsPerPage);
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Items</h2>
            <p className="text-xl text-gray-600">Discover amazing pieces from our community</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-t-xl"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Items</h2>
          <p className="text-xl text-gray-600">Discover amazing pieces from our community</p>
        </div>
        
        {featuredItems.length > 0 ? (
          <>
            <div className="relative">
              {totalPages > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm"
                    onClick={prevSlide}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm"
                    onClick={nextSlide}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 px-8">
                {getCurrentPageItems().map((item) => (
                  <div key={item.id} onClick={() => !user && setLocation('/auth')}>
                    <ItemCard item={item} />
                  </div>
                ))}
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center mt-8 space-x-2">
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      currentIndex === index ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}

            <div className="text-center mt-12">
              <Button onClick={() => setLocation(user ? '/browse' : '/auth')} className="rewear-button">
                {user ? 'Browse All Items' : 'Join to Browse All Items'}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">👗</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No items yet</h3>
            <p className="text-gray-600 mb-6">Be the first to list an item in the community!</p>
            <Button onClick={() => window.location.href = '/auth'} className="rewear-button">
              Join and List Your First Item
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
