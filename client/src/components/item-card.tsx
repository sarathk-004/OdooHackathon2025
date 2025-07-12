import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Eye, Heart, Coins, ArrowLeftRight } from "lucide-react";
import { ItemDetailModal } from "./item-detail-modal-new";
import { Item, User, Category } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface ItemCardProps {
  item: Item & { user: User; category: Category };
}

export function ItemCard({ item }: ItemCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);
  const [isSwapDialogOpen, setIsSwapDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [swapMessage, setSwapMessage] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const imageUrl = item.images[0] || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=400";

  // Check if item is favorited
  const { data: isFavorite = false } = useQuery({
    queryKey: [`/api/favorites/${item.id}/check`],
    enabled: !!user,
  });

  // Get user's own items for swapping
  const { data: userItems = [] } = useQuery({
    queryKey: ['/api/items', { userId: user?.id }],
    enabled: !!user && isSwapDialogOpen,
  });

  // Add favorite mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/favorites/${item.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${item.id}/check`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/favorites"] });
      toast({
        title: "Added to favorites",
        description: "Item has been added to your favorites.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add item to favorites.",
        variant: "destructive",
      });
    },
  });

  // Remove favorite mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/favorites/${item.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${item.id}/check`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/favorites"] });
      toast({
        title: "Removed from favorites",
        description: "Item has been removed from your favorites.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item from favorites.",
        variant: "destructive",
      });
    },
  });

  const toggleFavorite = () => {
    if (!user) return;
    
    if (isFavorite) {
      removeFavoriteMutation.mutate();
    } else {
      addFavoriteMutation.mutate();
    }
  };

  // Redeem mutation
  const redeemMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/swap-requests', {
        itemId: item.id,
        pointsOffered: item.pointValue,
        message: 'Direct redemption with points'
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Redemption Successful!",
        description: `You've redeemed ${item.title} for ${item.pointValue} points.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/swap-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/transactions'] });
      setIsRedeemDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Redemption Failed",
        description: error.message || "Failed to redeem item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRedeem = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to redeem items.",
        variant: "destructive",
      });
      return;
    }

    if (user.pointsBalance < item.pointValue) {
      toast({
        title: "Insufficient Points",
        description: `You need ${item.pointValue} points but only have ${user.pointsBalance}.`,
        variant: "destructive",
      });
      return;
    }

    setIsRedeemDialogOpen(true);
  };

  const handleSwap = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to swap items.",
        variant: "destructive",
      });
      return;
    }

    setIsSwapDialogOpen(true);
  };

  // Swap request mutation
  const swapMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/swap-requests', {
        itemId: item.id,
        offeredItemId: parseInt(selectedItemId),
        message: swapMessage || `Swap request for ${item.title}`,
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Swap Request Sent!",
        description: `Your swap request for ${item.title} has been sent to the owner.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/swap-requests'] });
      setIsSwapDialogOpen(false);
      setSelectedItemId("");
      setSwapMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Swap Request Failed",
        description: error.message || "Failed to send swap request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConfirmSwap = () => {
    if (!selectedItemId || selectedItemId === "no-items") {
      toast({
        title: "Select an Item",
        description: "Please select an item to offer for the swap.",
        variant: "destructive",
      });
      return;
    }
    swapMutation.mutate();
  };

  const getRatingDisplay = () => {
    if (item.user.rating === 0) {
      return <span className="text-xs text-gray-500">No Ratings Yet</span>;
    }
    return (
      <div className="flex items-center space-x-1">
        <Star className="w-3 h-3 text-yellow-400 fill-current" />
        <span className="text-xs text-gray-500">{(item.user.rating / 100).toFixed(1)}</span>
      </div>
    );
  };

  const getSwapTypeLabel = () => {
    return (
      <div className="flex items-center gap-1 text-purple-600 font-semibold text-sm">
        <Coins className="w-4 h-4" />
        <span>{item.pointValue} coins</span>
      </div>
    );
  };

  return (
    <>
      <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="relative overflow-hidden rounded-t-xl bg-gray-100 aspect-square">
            <img 
              src={imageUrl}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-purple-600">
              {item.pointValue} coins
            </div>
            {user && (
              <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  className="bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite();
                  }}
                  disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                >
                  <Heart 
                    className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
                  />
                </button>
              </div>
            )}
          </div>
          
          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                {item.title}
              </h3>
              <p className="text-sm text-gray-600">{item.category.name} • Size {item.size}</p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {item.condition}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Size {item.size}
                </Badge>
                {item.status === 'processing' && (
                  <Badge variant="default" className="text-xs bg-yellow-500">
                    Processing
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Eye className="w-3 h-3" />
                  <span>{item.views}</span>
                </div>
                {getRatingDisplay()}
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold text-xs">
                    {item.user.firstName[0]}
                  </span>
                </div>
                <span className="text-sm text-gray-600">{item.user.firstName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-xs px-3 h-8"
                  onClick={() => setIsModalOpen(true)}
                >
                  View More
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-xs px-3 h-8"
                  onClick={handleSwap}
                  disabled={!user || item.status !== 'active'}
                >
                  <ArrowLeftRight className="w-3 h-3 mr-1" />
                  Swap
                </Button>
                <Button 
                  size="sm" 
                  className="rewear-button text-xs px-3 h-8"
                  onClick={handleRedeem}
                  disabled={!user || user.pointsBalance < item.pointValue || item.status !== 'active'}
                >
                  <Coins className="w-3 h-3 mr-1" />
                  {item.status === 'processing' ? 'Processing' : 'Redeem'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ItemDetailModal 
        item={item}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <AlertDialog open={isRedeemDialogOpen} onOpenChange={setIsRedeemDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Redemption</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to redeem "{item.title}" for {item.pointValue} points?
              <br />
              <br />
              Your current balance: {user?.pointsBalance} points
              <br />
              After redemption: {user ? user.pointsBalance - item.pointValue : 0} points
              <br />
              <br />
              This action cannot be undone. The item will be set to processing status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => redeemMutation.mutate()}
              disabled={redeemMutation.isPending}
              className="rewear-button"
            >
              {redeemMutation.isPending ? "Redeeming..." : "Confirm Redemption"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isSwapDialogOpen} onOpenChange={setIsSwapDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Swap Request</DialogTitle>
            <DialogDescription>
              Select one of your items to offer in exchange for "{item.title}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="item-select">Select your item to offer:</Label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an item to swap" />
                </SelectTrigger>
                <SelectContent>
                  {userItems.length === 0 ? (
                    <SelectItem value="no-items" disabled>
                      No items available for swap
                    </SelectItem>
                  ) : (
                    userItems.map((userItem: Item & { user: User; category: Category }) => (
                      <SelectItem key={userItem.id} value={userItem.id.toString()}>
                        {userItem.title} - {userItem.pointValue} points
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message (optional):</Label>
              <Textarea
                id="message"
                placeholder="Add a message for the item owner..."
                value={swapMessage}
                onChange={(e) => setSwapMessage(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsSwapDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSwap}
              disabled={!selectedItemId || selectedItemId === "no-items" || swapMutation.isPending}
              className="rewear-button"
            >
              {swapMutation.isPending ? "Sending..." : "Send Swap Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
