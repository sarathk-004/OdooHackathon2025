import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, 
  Share2, 
  Star, 
  MapPin, 
  Clock, 
  Eye,
  MessageCircle,
  Coins,
  ArrowLeftRight
} from "lucide-react";

export default function ItemDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState(0);
  const [swapMessage, setSwapMessage] = useState("");
  const [showSwapForm, setShowSwapForm] = useState(false);

  const { data: item, isLoading } = useQuery({
    queryKey: ["/api/items", id],
  });

  const { data: userItems } = useQuery({
    queryKey: ["/api/items", { userId: user?.id }],
    enabled: !!user?.id,
  });

  const createSwapRequestMutation = useMutation({
    mutationFn: async (data: { itemId: number; offeredItemId?: number; pointsOffered?: number; message: string }) => {
      const res = await apiRequest("POST", "/api/swap-requests", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your swap request has been sent.",
      });
      setShowSwapForm(false);
      setSwapMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/swap-requests"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePointRedemption = async () => {
    if (!item || !user) return;
    
    if (user.pointsBalance < item.pointValue) {
      toast({
        title: "Insufficient Points",
        description: `You need ${item.pointValue - user.pointsBalance} more points to redeem this item.`,
        variant: "destructive",
      });
      return;
    }

    await createSwapRequestMutation.mutateAsync({
      itemId: item.id,
      pointsOffered: item.pointValue,
      message: swapMessage || "Point redemption request",
    });
  };

  const handleDirectSwap = async (offeredItemId: number) => {
    if (!item) return;

    await createSwapRequestMutation.mutateAsync({
      itemId: item.id,
      offeredItemId,
      message: swapMessage || "Direct swap request",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="grid lg:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <div className="aspect-square bg-gray-200 rounded-2xl"></div>
                  <div className="grid grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-24 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Item not found</h1>
              <p className="text-gray-600 mt-2">The item you're looking for doesn't exist.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === item.userId;
  const availableItems = userItems?.filter(userItem => 
    userItem.id !== item.id && userItem.status === 'active'
  ) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-lg">
                <img
                  src={item.images[selectedImage] || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=800"}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {item.images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {item.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 ${
                        selectedImage === index ? 'border-purple-600' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=200"}
                        alt={`${item.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Item Details */}
            <div className="space-y-6">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.title}</h1>
                    <p className="text-lg text-gray-600">{item.category.name} • Size {item.size}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mb-4">
                  <Badge variant="secondary">{item.condition}</Badge>
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Eye className="w-4 h-4" />
                    <span>{item.views} views</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="text-2xl font-bold text-purple-600 mb-4">
                  {item.pointValue} points
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">{item.description}</p>
              </div>

              {item.tags && item.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Owner Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-semibold">
                        {item.user.firstName[0]}{item.user.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {item.user.firstName} {item.user.lastName}
                      </p>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">
                          {(item.user.rating / 100).toFixed(1)} rating
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              {!isOwner && (
                <div className="space-y-4">
                  {!showSwapForm ? (
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        onClick={() => setShowSwapForm(true)}
                        className="rewear-button h-12"
                      >
                        <ArrowLeftRight className="w-4 h-4 mr-2" />
                        Request Swap
                      </Button>
                      <Button
                        onClick={handlePointRedemption}
                        variant="outline"
                        className="h-12"
                        disabled={!user || user.pointsBalance < item.pointValue}
                      >
                        <Coins className="w-4 h-4 mr-2" />
                        Redeem ({item.pointValue} pts)
                      </Button>
                    </div>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <MessageCircle className="w-5 h-5 mr-2" />
                          Make a Swap Request
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="message">Message (Optional)</Label>
                          <Textarea
                            id="message"
                            placeholder="Tell the owner why you'd like this item..."
                            value={swapMessage}
                            onChange={(e) => setSwapMessage(e.target.value)}
                            rows={3}
                          />
                        </div>

                        {availableItems.length > 0 && (
                          <div>
                            <Label>Offer one of your items:</Label>
                            <div className="grid grid-cols-1 gap-2 mt-2">
                              {availableItems.map((userItem) => (
                                <button
                                  key={userItem.id}
                                  onClick={() => handleDirectSwap(userItem.id)}
                                  className="text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                  disabled={createSwapRequestMutation.isPending}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                                    <div>
                                      <p className="font-medium text-gray-900">{userItem.title}</p>
                                      <p className="text-sm text-gray-600">{userItem.pointValue} points</p>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex space-x-3">
                          <Button
                            onClick={handlePointRedemption}
                            className="rewear-button"
                            disabled={createSwapRequestMutation.isPending || !user || user.pointsBalance < item.pointValue}
                          >
                            <Coins className="w-4 h-4 mr-2" />
                            Use Points ({item.pointValue})
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowSwapForm(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
