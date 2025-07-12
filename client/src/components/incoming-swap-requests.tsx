import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Eye, ArrowLeftRight, User, Calendar, MessageSquare } from "lucide-react";
import { SwapRequest, Item, User as UserType, Category } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface IncomingSwapRequest extends SwapRequest {
  requester: UserType;
  item: Item & { user: UserType; category: Category };
  offeredItem?: Item;
}

export function IncomingSwapRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<IncomingSwapRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'accept' | 'reject'>('accept');

  // Get swap requests for current user
  const { data: swapRequests = [], isLoading } = useQuery({
    queryKey: ['/api/swap-requests'],
    enabled: !!user,
  });

  // Filter for incoming requests only (requests made FOR user's items)
  const incomingRequests = swapRequests.filter((request: IncomingSwapRequest) => 
    request.receiverId === user?.id && request.requesterId !== user?.id
  );

  // Update swap request status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest('PATCH', `/api/swap-requests/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/swap-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/transactions'] });
      setIsApprovalDialogOpen(false);
      setSelectedRequest(null);
      toast({
        title: approvalAction === 'accept' ? "Swap Request Accepted" : "Swap Request Rejected",
        description: approvalAction === 'accept' 
          ? "The swap has been approved and is now processing." 
          : "The swap request has been rejected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update swap request status.",
        variant: "destructive",
      });
    },
  });

  const handleApprovalAction = (request: IncomingSwapRequest, action: 'accept' | 'reject') => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setIsApprovalDialogOpen(true);
  };

  const handleConfirmApproval = () => {
    if (selectedRequest) {
      updateStatusMutation.mutate({
        id: selectedRequest.id,
        status: approvalAction === 'accept' ? 'accepted' : 'rejected'
      });
    }
  };

  const handleViewDetails = (request: IncomingSwapRequest) => {
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
          <CardTitle>Incoming Swap Requests</CardTitle>
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
            <ArrowLeftRight className="w-5 h-5" />
            Incoming Swap Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {incomingRequests.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <ArrowLeftRight className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No incoming swap requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incomingRequests.map((request: IncomingSwapRequest) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{request.requester?.firstName || 'Unknown User'}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        wants to swap for your "{request.item.title}"
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
                        <span>Offering: "{request.offeredItem.title}" ({request.offeredItem.pointValue} points)</span>
                      ) : (
                        <span>Offering: {request.pointsOffered} points</span>
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
                      
                      {request.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprovalAction(request, 'reject')}
                            className="text-xs text-red-600 hover:text-red-700 flex items-center"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">Reject</span>
                            <span className="sm:hidden">✕</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprovalAction(request, 'accept')}
                            className="text-xs rewear-button flex items-center"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">Accept</span>
                            <span className="sm:hidden">✓</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {request.message && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <div className="flex items-center gap-1 text-gray-600 mb-1">
                        <MessageSquare className="w-3 h-3" />
                        <span className="font-medium">Message:</span>
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
                  <h4 className="font-medium mb-2">Your Item</h4>
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
                    {selectedRequest.offeredItem ? 'Offered Item' : 'Offered Points'}
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
                <h4 className="font-medium mb-2">Requester</h4>
                <div className="border rounded p-3">
                  <div className="font-medium">{selectedRequest.requester?.firstName || 'Unknown User'}</div>
                  <div className="text-sm text-gray-600">@{selectedRequest.requester?.username || 'unknown'}</div>
                </div>
              </div>
              
              {selectedRequest.message && (
                <div>
                  <h4 className="font-medium mb-2">Message</h4>
                  <div className="border rounded p-3 bg-gray-50">
                    <p className="text-gray-700">{selectedRequest.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <AlertDialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {approvalAction === 'accept' ? 'Accept Swap Request' : 'Reject Swap Request'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {approvalAction === 'accept' ? (
                <>
                  Are you sure you want to accept this swap request? This will:
                  <br />• Transfer your "{selectedRequest?.item.title}" to {selectedRequest?.requester?.firstName || 'the requester'}
                  <br />• {selectedRequest?.offeredItem ? 
                    `Transfer "${selectedRequest.offeredItem.title}" to you` : 
                    `Add ${selectedRequest?.pointsOffered} points to your balance`}
                  <br />• Mark the swap as completed
                </>
              ) : (
                "Are you sure you want to reject this swap request? This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmApproval}
              disabled={updateStatusMutation.isPending}
              className={approvalAction === 'accept' ? 'rewear-button' : 'bg-red-600 hover:bg-red-700'}
            >
              {updateStatusMutation.isPending ? 
                (approvalAction === 'accept' ? 'Accepting...' : 'Rejecting...') : 
                (approvalAction === 'accept' ? 'Accept Swap' : 'Reject Swap')
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}