import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertItemSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CloudUpload, X, Plus } from "lucide-react";
import { useLocation } from "wouter";

const addItemSchema = insertItemSchema.extend({
  images: z.array(z.string()).min(1, "At least one image is required"),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
});

type AddItemFormData = z.infer<typeof addItemSchema>;

export default function AddItemPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const form = useForm<AddItemFormData>({
    resolver: zodResolver(addItemSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: 0,
      size: "",
      condition: "",
      pointValue: 0,
      tags: [],
      images: [],
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: AddItemFormData) => {
      const res = await apiRequest("POST", "/api/items", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your item has been listed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: AddItemFormData) => {
    // Update form with current images to trigger validation
    form.setValue("images", imageUrls);
    
    await createItemMutation.mutateAsync({
      ...data,
      images: imageUrls,
      tags: form.getValues("tags"),
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result && imageUrls.length < 5) {
            const newUrls = [...imageUrls, e.target!.result as string];
            setImageUrls(newUrls);
            // Update form to clear validation error
            form.setValue("images", newUrls);
            form.clearErrors("images");
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.getValues("tags").includes(tag)) {
      const currentTags = form.getValues("tags");
      form.setValue("tags", [...currentTags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags");
    form.setValue("tags", currentTags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-gray-900">List a New Item</CardTitle>
              <p className="text-gray-600">Share your pre-loved fashion with the community</p>
            </CardHeader>
            
            <CardContent className="p-8">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Image Upload */}
                <div>
                  <Label className="text-lg font-semibold text-gray-900 mb-4 block">Photos</Label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-purple-600 transition-colors cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg text-gray-600 mb-2">Drag and drop your photos here</p>
                      <p className="text-sm text-gray-500">or click to browse • Max 5 photos • JPG, PNG up to 10MB each</p>
                    </label>
                  </div>
                  
                  {imageUrls.length > 0 && (
                    <div className="grid grid-cols-5 gap-4 mt-4">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={url} 
                            alt={`Preview ${index + 1}`} 
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {form.formState.errors.images && (
                    <p className="text-sm text-red-500 mt-2">{form.formState.errors.images.message}</p>
                  )}
                </div>

                {/* Item Details */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-lg font-semibold text-gray-900">Title</Label>
                    <Input
                      id="title"
                      {...form.register("title")}
                      placeholder="e.g., Vintage Denim Jacket"
                      className="h-12"
                    />
                    {form.formState.errors.title && (
                      <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-lg font-semibold text-gray-900">Category</Label>
                    <Select onValueChange={(value) => form.setValue("categoryId", parseInt(value))}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.categoryId && (
                      <p className="text-sm text-red-500">{form.formState.errors.categoryId.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-lg font-semibold text-gray-900">Description</Label>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                    rows={4}
                    placeholder="Describe your item's condition, style, and any special features..."
                    className="resize-none"
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="size" className="text-lg font-semibold text-gray-900">Size</Label>
                    <Select onValueChange={(value) => form.setValue("size", value)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="XS">XS</SelectItem>
                        <SelectItem value="S">S</SelectItem>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="L">L</SelectItem>
                        <SelectItem value="XL">XL</SelectItem>
                        <SelectItem value="XXL">XXL</SelectItem>
                        <SelectItem value="One Size">One Size</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.size && (
                      <p className="text-sm text-red-500">{form.formState.errors.size.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="condition" className="text-lg font-semibold text-gray-900">Condition</Label>
                    <Select onValueChange={(value) => form.setValue("condition", value)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Like New">Like New</SelectItem>
                        <SelectItem value="Excellent">Excellent</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Fair">Fair</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.condition && (
                      <p className="text-sm text-red-500">{form.formState.errors.condition.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pointValue" className="text-lg font-semibold text-gray-900">Point Value</Label>
                    <Input
                      id="pointValue"
                      type="number"
                      {...form.register("pointValue", { valueAsNumber: true })}
                      placeholder="150"
                      className="h-12"
                    />
                    <p className="text-sm text-gray-500">Suggested: 100-200 points</p>
                    {form.formState.errors.pointValue && (
                      <p className="text-sm text-red-500">{form.formState.errors.pointValue.message}</p>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label className="text-lg font-semibold text-gray-900">Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add a tag..."
                      className="h-12"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} className="h-12 px-4">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {form.watch("tags").length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.watch("tags").map((tag) => (
                        <span
                          key={tag}
                          className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-purple-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-500">Add tags to help others find your item</p>
                  {form.formState.errors.tags && (
                    <p className="text-sm text-red-500">{form.formState.errors.tags.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/dashboard")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rewear-button"
                    disabled={createItemMutation.isPending || imageUrls.length === 0}
                  >
                    {createItemMutation.isPending ? "Listing Item..." : "List Item"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
