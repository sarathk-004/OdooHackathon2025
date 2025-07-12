import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/navbar";
import { ItemCard } from "@/components/item-card";
import { Search, Filter, SlidersHorizontal, Heart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function BrowseItemsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentSearch, setCurrentSearch] = useState("");
  const [currentCategory, setCurrentCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");
  const { user } = useAuth();

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["/api/items", { 
      search: currentSearch || undefined, 
      category: currentCategory === "all" ? undefined : currentCategory,
      excludeUserId: user?.id
    }],
  });

  const { data: favorites, isLoading: favoritesLoading } = useQuery({
    queryKey: ["/api/user/favorites"],
    enabled: !!user && activeTab === "favorites",
  });

  const handleSearch = () => {
    setCurrentSearch(searchQuery);
    setCurrentCategory(selectedCategory);
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setCurrentSearch("");
    setCurrentCategory("all");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Items</h1>
            <p className="text-gray-600">Discover amazing pieces from our community</p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full grid-cols-2 lg:w-fit">
              <TabsTrigger value="all">All Items</TabsTrigger>
              {user && (
                <TabsTrigger value="favorites" className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Favorites
                </TabsTrigger>
              )}
            </TabsList>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl p-6 shadow-sm border mb-8 mt-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Search for items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-12"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                </div>
                
                <div className="md:w-48">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSearch} className="rewear-button h-12 px-6">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleReset}
                    className="h-12 px-6"
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>

              {/* Active Filters */}
              {(currentSearch || (currentCategory && currentCategory !== "all")) && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Filter className="w-4 h-4" />
                    <span>Active filters:</span>
                    {currentSearch && (
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        Search: "{currentSearch}"
                      </span>
                    )}
                    {currentCategory && currentCategory !== "all" && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        Category: {currentCategory}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Items Grid */}
            <TabsContent value="all">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-xl p-4 shadow-sm border animate-pulse">
                    <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : items && items.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-gray-600">
                    {items.length} item{items.length !== 1 ? 's' : ''} found
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {items.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-600 mb-6">
                  {currentSearch || currentCategory 
                    ? "Try adjusting your search filters or browse all items" 
                    : "Be the first to list an item in the community!"
                  }
                </p>
                {(currentSearch || currentCategory) && (
                  <Button onClick={handleReset} variant="outline" className="mr-4">
                    Clear Filters
                  </Button>
                )}
                <Button onClick={() => window.location.href = '/add-item'} className="rewear-button">
                  List Your First Item
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites">
            {favoritesLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-xl p-4 shadow-sm border animate-pulse">
                    <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : favorites && favorites.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-gray-600">
                    {favorites.length} favorite item{favorites.length !== 1 ? 's' : ''} found
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {favorites.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorites yet</h3>
                <p className="text-gray-600 mb-6">
                  Items you favorite will appear here for easy access
                </p>
                <Button onClick={() => setActiveTab("all")} className="rewear-button">
                  Browse Items
                </Button>
              </div>
            )}
          </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
