import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Share2, User, MapPin, Calendar, Coins, ArrowLeftRight, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Item, User as UserType, Category } from "@shared/schema";

interface ItemDetailModalProps {
  item: Item & { user: UserType; category: Category };
  isOpen: boolean;
  onClose: () => void;
}

export function ItemDetailModal({ item, isOpen, onClose }: ItemDetailModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [swapType, setSwapType] = useState<"points" | "item">("points");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [message, setMessage] = useState("");

  // Get user's items for swap
  const { data: userItems } = useQuery({
    queryKey: ["/api/items", { userId: user?.id, status: "available" }],
    enabled: swapType === "item" && !!user,
  });

  const createSwapMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/swap-requests", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Swap Request Sent!",
        description: "The item owner will be notified of your request.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/swap-requests"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSwapRequest = () => {
    if (swapType === "item" && !selectedItemId) {
      toast({
        title: "Error",
        description: "Please select an item to offer in exchange.",
        variant: "destructive",
      });
      return;
    }

    const swapData = {
      itemId: item.id,
      type: swapType,
      message,
      ...(swapType === "item" ? { offeredItemId: parseInt(selectedItemId) } : { pointsOffered: item.pointValue }),
    };

    createSwapMutation.mutate(swapData);
  };

  const getAvailabilityBadge = () => {
    if (item.status === "available") {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Available</Badge>;
    } else if (item.status === "pending") {
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Processing</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Unavailable</Badge>;
    }
  };

  const getRatingDisplay = () => {
    if (item.user.rating === 0) {
      return <span className="text-gray-500 text-sm">No Ratings</span>;
    }
    return (
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium">{item.user.rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{item.title}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={item.images[0] || "/placeholder-image.jpg"}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
            {item.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {item.images.slice(1, 5).map((image, index) => (
                  <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={image}
                      alt={`${item.title} ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Availability and Price */}
            <div className="flex items-center justify-between">
              {getAvailabilityBadge()}
              <div className="flex items-center gap-2 text-2xl font-bold text-purple-600">
                <Coins className="w-6 h-6" />
                {item.pointValue} coins
              </div>
            </div>

            {/* Item Info */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium">{item.category.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Size:</span>
                <span className="font-medium">{item.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Condition:</span>
                <span className="font-medium">{item.condition}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Views:</span>
                <span className="font-medium">{item.views}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{item.description}</p>
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-purple-100 text-purple-700">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Owner Info */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-3">Item Owner</h3>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {item.user.firstName.charAt(0)}{item.user.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{item.user.firstName} {item.user.lastName}</p>
                  <p className="text-sm text-gray-600">@{item.user.username}</p>
                  {getRatingDisplay()}
                </div>
              </div>
            </div>

            {/* Swap Actions */}
            {user && user.id !== item.userId && item.status === "available" && (
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-semibold text-lg">Request Swap</h3>
                
                {/* Swap Type Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <Card 
                    className={`cursor-pointer transition-colors ${swapType === "points" ? "ring-2 ring-purple-600 bg-purple-50" : "hover:bg-gray-50"}`}
                    onClick={() => setSwapType("points")}
                  >
                    <CardContent className="p-4 text-center">
                      <Coins className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <p className="font-medium">Use Coins</p>
                      <p className="text-sm text-gray-600">{item.pointValue} coins</p>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className={`cursor-pointer transition-colors ${swapType === "item" ? "ring-2 ring-purple-600 bg-purple-50" : "hover:bg-gray-50"}`}
                    onClick={() => setSwapType("item")}
                  >
                    <CardContent className="p-4 text-center">
                      <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <p className="font-medium">Swap Item</p>
                      <p className="text-sm text-gray-600">Trade for trade</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Item Selection for Swap */}
                {swapType === "item" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select item to offer
                    </label>
                    <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose from your items" />
                      </SelectTrigger>
                      <SelectContent>
                        {userItems?.filter(userItem => userItem.id !== item.id).map((userItem) => (
                          <SelectItem key={userItem.id} value={userItem.id.toString()}>
                            {userItem.title} ({userItem.pointValue} coins)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (optional)
                  </label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add a personal message..."
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <Button 
                  onClick={handleSwapRequest}
                  disabled={createSwapMutation.isPending || (swapType === "item" && !selectedItemId)}
                  className="w-full rewear-button"
                >
                  {createSwapMutation.isPending ? "Sending Request..." : "Send Swap Request"}
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" size="icon">
                <Heart className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}