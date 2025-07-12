import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send, Eye, Trash2, Calendar, MessageSquare, Package } from "lucide-react";
import { SwapRequest, Item, User as UserType, Category } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface OutgoingSwapRequest extends SwapRequest {
  requester: UserType;
  item: Item & { user: UserType; category: Category };
  offeredItem?: Item;
}

export function OutgoingSwapRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<OutgoingSwapRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Get swap requests for current user
  const { data: swapRequests = [], isLoading } = useQuery({
    queryKey: ['/api/swap-requests'],
    enabled: !!user,
  });

  // Filter for outgoing requests only (requests made BY user)
  const outgoingRequests = swapRequests.filter((request: OutgoingSwapRequest) => 
    request.requesterId === user?.id
  );

  // Delete swap request mutation
  const deleteSwapRequestMutation = useMutation({
    mutationFn: async (swapRequestId: number) => {
      await apiRequest('DELETE', `/api/swap-requests/${swapRequestId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/swap-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/transactions'] });
      setIsDeleteDialogOpen(false);
      setSelectedRequest(null);
      toast({
        title: "Swap Request Deleted",
        description: "Your swap request has been cancelled. Points have been refunded if applicable.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete swap request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteRequest = (request: OutgoingSwapRequest) => {
    setSelectedRequest(request);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedRequest) {
      deleteSwapRequestMutation.mutate(selectedRequest.id);
    }
  };

  const handleViewDetails = (request: OutgoingSwapRequest) => {
    setSelectedRequest(request);
    setIsDetailModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Swap Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Loading swap requests...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            My Swap Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {outgoingRequests.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Send className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No outgoing swap requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {outgoingRequests.map((request: OutgoingSwapRequest) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Request for "{request.item.title}"</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        by {request.item.user?.firstName || 'Unknown User'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(request.status)}
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {request.offeredItem ? (
                        <span>You offered: "{request.offeredItem.title}" ({request.offeredItem.pointValue} points)</span>
                      ) : (
                        <span>You offered: {request.pointsOffered} points</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(request)}
                        className="text-xs flex items-center"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">View Details</span>
                        <span className="sm:hidden">View</span>
                      </Button>
                      
                      {(request.status === 'pending' || request.status === 'accepted') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteRequest(request)}
                          className="text-xs text-red-600 hover:text-red-700 flex items-center"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          <span className="hidden sm:inline">Cancel</span>
                          <span className="sm:hidden">✕</span>
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {request.message && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <div className="flex items-center gap-1 text-gray-600 mb-1">
                        <MessageSquare className="w-3 h-3" />
                        <span className="font-medium">Your Message:</span>
                      </div>
                      <p className="text-gray-700">{request.message}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Swap Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Requested Item</h4>
                  <div className="border rounded p-3">
                    <div className="font-medium">{selectedRequest.item.title}</div>
                    <div className="text-sm text-gray-600">
                      {selectedRequest.item.category?.name || 'Unknown Category'} • Size {selectedRequest.item.size}
                    </div>
                    <div className="text-sm text-purple-600 font-medium">
                      {selectedRequest.item.pointValue} points
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">
                    {selectedRequest.offeredItem ? 'Your Offered Item' : 'Your Offered Points'}
                  </h4>
                  <div className="border rounded p-3">
                    {selectedRequest.offeredItem ? (
                      <>
                        <div className="font-medium">{selectedRequest.offeredItem.title}</div>
                        <div className="text-sm text-gray-600">
                          Size {selectedRequest.offeredItem.size} • {selectedRequest.offeredItem.condition}
                        </div>
                        <div className="text-sm text-purple-600 font-medium">
                          {selectedRequest.offeredItem.pointValue} points
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <div className="font-medium text-purple-600">
                          {selectedRequest.pointsOffered} points
                        </div>
                        <div className="text-sm text-gray-600">Cash equivalent</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Item Owner</h4>
                <div className="border rounded p-3">
                  <div className="font-medium">{selectedRequest.item.user?.firstName || 'Unknown User'}</div>
                  <div className="text-sm text-gray-600">@{selectedRequest.item.user?.username || 'unknown'}</div>
                </div>
              </div>
              
              {selectedRequest.message && (
                <div>
                  <h4 className="font-medium mb-2">Your Message</h4>
                  <div className="border rounded p-3 bg-gray-50">
                    <p className="text-gray-700">{selectedRequest.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Swap Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this swap request? This will:
              <br />• Remove your request for "{selectedRequest?.item.title}"
              <br />• Make the item available to other users again
              {selectedRequest?.pointsOffered && (
                <>
                  <br />• Refund {selectedRequest.pointsOffered} points to your balance
                </>
              )}
              <br />• This action cannot be undone
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Request</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteSwapRequestMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteSwapRequestMutation.isPending ? 'Cancelling...' : 'Cancel Request'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}