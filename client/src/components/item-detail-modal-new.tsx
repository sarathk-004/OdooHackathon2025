import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Coins, 
  ArrowLeftRight, 
  Eye, 
  MapPin, 
  Star, 
  Calendar, 
  Package,
  MessageCircle,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import type { Item, User, Category } from "@shared/schema";

interface ItemDetailModalProps {
  item: Item & { user: User; category: Category };
  isOpen: boolean;
  onClose: () => void;
}

export function ItemDetailModal({ item, isOpen, onClose }: ItemDetailModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [swapMode, setSwapMode] = useState<'points' | 'item'>('points');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [message, setMessage] = useState('');

  const { data: userItems } = useQuery({
    queryKey: ['/api/items', { userId: user?.id, status: 'active' }],
    enabled: !!user && swapMode === 'item'
  });

  const createSwapRequestMutation = useMutation({
    mutationFn: async (data: { itemId: number; offeredItemId?: number; pointsOffered?: number; message?: string }) => {
      const res = await apiRequest('/api/swap-requests', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: swapMode === 'points' ? "Points redeemed successfully!" : "Your swap request has been sent.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/swap-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      onClose();
      // Reset form
      setMessage('');
      setSelectedItemId('');
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
    if (!user) return;

    // Validation checks
    if (swapMode === 'points') {
      if (user.pointsBalance < item.pointValue) {
        toast({
          title: "Insufficient Points",
          description: `You need ${item.pointValue} points but only have ${user.pointsBalance}.`,
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!selectedItemId) {
        toast({
          title: "Error",
          description: "Please select an item to offer in exchange.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if selected item is available
      const selectedItem = userItems?.find(i => i.id === parseInt(selectedItemId));
      if (!selectedItem || selectedItem.status !== 'active') {
        toast({
          title: "Error",
          description: "Selected item is not available for trade.",
          variant: "destructive",
        });
        return;
      }
    }

    const requestData: any = {
      itemId: item.id,
      message: message.trim() || undefined,
    };

    if (swapMode === 'points') {
      requestData.pointsOffered = item.pointValue;
    } else {
      requestData.offeredItemId = parseInt(selectedItemId);
    }

    createSwapRequestMutation.mutate(requestData);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { icon: CheckCircle, text: 'Available', color: 'text-green-600' };
      case 'swapped':
        return { icon: XCircle, text: 'Unavailable', color: 'text-red-600' };
      case 'pending':
        return { icon: Clock, text: 'Processing', color: 'text-yellow-600' };
      default:
        return { icon: Clock, text: 'Unknown', color: 'text-gray-600' };
    }
  };

  const statusInfo = getStatusInfo(item.status);
  const StatusIcon = statusInfo.icon;
  const isOwner = user?.id === item.userId;
  const canRequest = user && !isOwner && item.status === 'active' && item.isApproved;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{item.title}</DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              {item.images && item.images.length > 0 ? (
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
            
            {/* Additional Images */}
            {item.images && item.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {item.images.slice(1, 5).map((image, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
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
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
              <span className={`font-medium ${statusInfo.color}`}>{statusInfo.text}</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold">{item.pointValue} Points</span>
            </div>

            {/* Category & Condition */}
            <div className="flex gap-2">
              <Badge variant="secondary">{item.category.name}</Badge>
              <Badge variant="outline">{item.condition}</Badge>
              <Badge variant="outline">Size: {item.size}</Badge>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{item.views} views</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Listed {new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{item.description}</p>
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Owner Info */}
            <div>
              <h3 className="font-semibold mb-2">Listed by</h3>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {item.user.firstName[0]}{item.user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{item.user.firstName} {item.user.lastName}</p>
                  <p className="text-sm text-gray-600">@{item.user.username}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm">
                      {item.user.rating > 0 ? (item.user.rating / 100).toFixed(1) : 'No Ratings Yet'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {canRequest && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        variant={swapMode === 'points' ? 'default' : 'outline'}
                        onClick={() => setSwapMode('points')}
                        className="flex-1"
                        disabled={user!.pointsBalance < item.pointValue}
                      >
                        <Coins className="w-4 h-4 mr-2" />
                        Redeem with Points
                        {user!.pointsBalance < item.pointValue && (
                          <span className="text-xs ml-1">(Need {item.pointValue - user!.pointsBalance} more)</span>
                        )}
                      </Button>
                      <Button
                        variant={swapMode === 'item' ? 'default' : 'outline'}
                        onClick={() => setSwapMode('item')}
                        className="flex-1"
                        disabled={!userItems?.some(item => item.status === 'active' && item.isApproved)}
                      >
                        <ArrowLeftRight className="w-4 h-4 mr-2" />
                        Swap with Item
                        {!userItems?.some(item => item.status === 'active' && item.isApproved) && (
                          <span className="text-xs ml-1">(No items available)</span>
                        )}
                      </Button>
                    </div>

                    {swapMode === 'item' && (
                      <div>
                        <Label htmlFor="offered-item">Select your item to offer</Label>
                        {userItems?.filter(item => item.status === 'active' && item.isApproved).length === 0 ? (
                          <div className="p-4 border rounded-lg bg-gray-50 text-center">
                            <p className="text-gray-600">You don't have any available items to trade.</p>
                            <p className="text-sm text-gray-500 mt-1">List an item first to enable swapping.</p>
                          </div>
                        ) : (
                          <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose an item from your collection" />
                            </SelectTrigger>
                            <SelectContent>
                            {userItems?.filter(userItem => userItem.status === 'active' && userItem.isApproved)
                              .length > 0 ? (
                                userItems.filter(userItem => userItem.status === 'active' && userItem.isApproved)
                                  .map((userItem) => (
                                    <SelectItem key={userItem.id} value={userItem.id.toString()}>
                                      {userItem.title} ({userItem.pointValue} points)
                                    </SelectItem>
                                  ))
                              ) : (
                                <SelectItem value="no-items" disabled>
                                  No available items to trade
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}

                    <div>
                      <Label htmlFor="message">Message (optional)</Label>
                      <Textarea
                        id="message"
                        placeholder="Add a message to your swap request..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <Button 
                      onClick={handleSwapRequest}
                      disabled={
                        createSwapRequestMutation.isPending ||
                        (swapMode === 'points' && user!.pointsBalance < item.pointValue) ||
                        (swapMode === 'item' && !selectedItemId)
                      }
                      className="w-full rewear-button"
                    >
                      {createSwapRequestMutation.isPending ? (
                        "Sending Request..."
                      ) : swapMode === 'points' ? (
                        user!.pointsBalance >= item.pointValue ? (
                          `Redeem for ${item.pointValue} Points`
                        ) : (
                          `Need ${item.pointValue - user!.pointsBalance} more points`
                        )
                      ) : (
                        selectedItemId ? "Send Swap Request" : "Select an item to swap"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!user && (
              <Button 
                onClick={() => window.location.href = '/auth'}
                className="w-full rewear-button"
              >
                Login to Request This Item
              </Button>
            )}

            {isOwner && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600">This is your item</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}