import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { ItemCard } from "@/components/item-card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Edit, Star, Package, TrendingUp, Camera } from "lucide-react";

const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  bio: z.string().optional(),
  profileImage: z.string().optional(),
});

type UpdateProfileData = z.infer<typeof updateProfileSchema>;

export default function ProfilePage(): JSX.Element {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string>("");

  const form = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      bio: user?.bio || "",
      profileImage: user?.profileImage || "",
    },
  });

  // Get user's items
  const { data: userItems } = useQuery({
    queryKey: ["/api/items", { userId: user?.id }],
    enabled: !!user,
  });

  // Get user stats
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: UpdateProfileData) => {
    await updateProfileMutation.mutateAsync({
      ...data,
      profileImage: profileImage || data.profileImage,
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setProfileImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getRatingDisplay = () => {
    if (!user || user.rating === 0) {
      return <span className="text-gray-500">No Ratings Yet</span>;
    }
    return (
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="font-medium">{(user.rating / 100).toFixed(1)}</span>
      </div>
    );
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Info */}
            <div className="lg:col-span-1">
              <Card className="shadow-xl border-0">
                <CardHeader className="text-center pb-4">
                  <div className="relative">
                    <Avatar className="w-24 h-24 mx-auto mb-4">
                      {profileImage || user.profileImage ? (
                        <img 
                          src={profileImage || user.profileImage} 
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <AvatarFallback className="text-2xl bg-purple-100 text-purple-600">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {isEditing && (
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="profile-image"
                        />
                        <label
                          htmlFor="profile-image"
                          className="bg-purple-600 text-white p-2 rounded-full cursor-pointer hover:bg-purple-700 transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                        </label>
                      </div>
                    )}
                  </div>
                  
                  {!isEditing ? (
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        {user.firstName} {user.lastName}
                      </h1>
                      <p className="text-gray-600">@{user.username}</p>
                      <p className="text-gray-600 mt-2">{user.email}</p>
                      {user.bio && (
                        <p className="text-gray-700 mt-3 text-sm">{user.bio}</p>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-left">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          {...form.register("firstName")}
                        />
                        {form.formState.errors.firstName && (
                          <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          {...form.register("lastName")}
                        />
                        {form.formState.errors.lastName && (
                          <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="bio">Bio (optional)</Label>
                        <Textarea
                          id="bio"
                          {...form.register("bio")}
                          placeholder="Tell us about yourself..."
                          rows={3}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          className="rewear-button flex-1"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </CardHeader>

                {!isEditing && (
                  <CardContent className="space-y-6">
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      className="w-full"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>

                    {/* Stats */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Statistics</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <Package className="w-6 h-6 mx-auto mb-1 text-purple-600" />
                          <p className="text-2xl font-bold text-purple-600">
                            {userStats?.itemsListed || 0}
                          </p>
                          <p className="text-xs text-gray-600">Items Listed</p>
                        </div>
                        
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <TrendingUp className="w-6 h-6 mx-auto mb-1 text-green-600" />
                          <p className="text-2xl font-bold text-green-600">
                            {userStats?.successfulSwaps || 0}
                          </p>
                          <p className="text-xs text-gray-600">Successful Swaps</p>
                        </div>
                      </div>
                      
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Star className="w-5 h-5 text-yellow-500" />
                          <span className="text-lg font-bold text-yellow-600">
                            {getRatingDisplay()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">Rating</p>
                      </div>
                      
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{user.pointsBalance}</p>
                        <p className="text-xs text-gray-600">Available Points</p>
                      </div>
                    </div>

                    {/* Account Info */}
                    <div className="space-y-2 pt-4 border-t border-gray-100">
                      <h3 className="font-semibold text-gray-900">Account</h3>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Member since:</span>
                        <span className="text-gray-900">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {user.isAdmin && (
                        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                          Administrator
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>

            {/* User's Items */}
            <div className="lg:col-span-2">
              <Card className="shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900">My Items</CardTitle>
                  <p className="text-gray-600">Items you've listed on the platform</p>
                </CardHeader>
                
                <CardContent>
                  {userItems && userItems.length > 0 ? (
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {userItems.map((item) => (
                        <ItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No items yet</h3>
                      <p className="text-gray-600 mb-6">Start sharing your fashion items with the community!</p>
                      <Button onClick={() => window.location.href = '/add-item'} className="rewear-button">
                        List Your First Item
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}