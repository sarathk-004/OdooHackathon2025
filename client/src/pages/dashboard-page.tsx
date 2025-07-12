import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { IncomingSwapRequests } from "@/components/incoming-swap-requests";
import { OutgoingSwapRequests } from "@/components/outgoing-swap-requests";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Coins,
  Package,
  Handshake,
  Star,
  Plus,
  TrendingUp,
  Activity,
  Trash2
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const { data: userItems } = useQuery({
    queryKey: ["/api/items", { userId: user?.id }],
    enabled: !!user?.id,
  });

  const { data: swapRequests } = useQuery({
    queryKey: ["/api/swap-requests", { userId: user?.id }],
    enabled: !!user?.id,
  });

  const { data: transactions } = useQuery({
    queryKey: ["/api/user/transactions"],
  });

  const recentTransactions = transactions?.slice(0, 5) || [];
  const recentItems = userItems?.slice(0, 3) || [];
  const recentSwaps = swapRequests?.slice(0, 3) || [];

  // Delete swap request mutation
  const deleteSwapRequestMutation = useMutation({
    mutationFn: async (swapRequestId: number) => {
      await apiRequest('DELETE', `/api/swap-requests/${swapRequestId}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Redemption Cancelled",
        description: "Your points have been refunded and the item is available again.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/swap-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/transactions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel redemption. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-gray-600">Here's what's happening with your exchanges</p>
            </div>
            <Link href="/add-item">
              <Button className="rewear-button">
                <Plus className="w-4 h-4 mr-2" />
                List New Item
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Points Balance</p>
                    <p className="text-2xl font-bold text-gray-900">{user?.pointsBalance || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                    <Coins className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Items Listed</p>
                    <p className="text-2xl font-bold text-gray-900">{userStats?.itemsListed || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Successful Swaps</p>
                    <p className="text-2xl font-bold text-gray-900">{userStats?.successfulSwaps || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                    <Handshake className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Rating</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {userStats?.rating > 0 ? (userStats.rating / 100).toFixed(1) : 'No Ratings Yet'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-400/10 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Swaps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Handshake className="w-5 h-5 mr-2" />
                    Recent Swap Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentSwaps.length > 0 ? (
                    <div className="space-y-4">
                      {recentSwaps.map((swap) => (
                        <div key={swap.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-500" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{swap.item?.title || 'Unknown Item'}</h4>
                              <p className="text-sm text-gray-600">
                                {swap.offeredItem ? `Offered: ${swap.offeredItem.title}` : `Points: ${swap.pointsOffered}`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {swap.status === 'accepted' && swap.pointsOffered ? 'Redeemed with points' : 'Swap request'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <Badge variant={
                                swap.status === 'accepted' ? 'default' : 
                                swap.status === 'pending' ? 'secondary' : 'destructive'
                              }>
                                {swap.status === 'accepted' && swap.pointsOffered ? 'Processing' : swap.status}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(swap.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {swap.pointsOffered && (swap.status === 'accepted' || swap.status === 'pending') && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteSwapRequestMutation.mutate(swap.id)}
                                disabled={deleteSwapRequestMutation.isPending}
                                className="text-xs px-2 py-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No swap requests yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Points Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentTransactions.length > 0 ? (
                    <div className="space-y-4">
                      {recentTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <p className="text-sm text-gray-600">{transaction.type}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {transaction.points > 0 ? '+' : ''}{transaction.points} pts
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No transactions yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Incoming Swap Requests */}
              <IncomingSwapRequests />
              
              {/* Outgoing Swap Requests */}
              <OutgoingSwapRequests />
              
              {/* Your Listed Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Your Listed Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentItems.length > 0 ? (
                    <div className="space-y-4">
                      {recentItems.map((item) => (
                        <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{item.title}</p>
                            <p className="text-sm text-gray-600">{item.views} views</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                              {item.status}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">{item.pointValue} pts</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No items listed yet</p>
                      <Link href="/add-item">
                        <Button size="sm" className="rewear-button">
                          <Plus className="w-4 h-4 mr-2" />
                          List Your First Item
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              {/* <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/browse">
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Browse Items
                    </Button>
                  </Link>
                  <Link href="/add-item">
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="w-4 h-4 mr-2" />
                      List New Item
                    </Button>
                  </Link>
                </CardContent>
              </Card> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
