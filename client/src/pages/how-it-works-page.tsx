import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Recycle, 
  Users, 
  Coins, 
  ArrowLeftRight, 
  Upload, 
  Search, 
  MessageCircle, 
  CheckCircle,
  Star,
  Heart,
  Shield,
  Zap
} from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-purple-100 rounded-full">
                <Recycle className="w-12 h-12 text-purple-600" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How ReWear Works
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join the sustainable fashion revolution. Trade, swap, and redeem clothing items 
              with our community-driven platform that makes fashion circular and accessible.
            </p>
          </div>

          {/* Mission Section */}
          <Card className="mb-16 border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Our Mission
                </h2>
                <p className="text-lg text-gray-600 max-w-4xl mx-auto">
                  ReWear is committed to reducing fashion waste and promoting sustainable consumption. 
                  We believe that great fashion should be accessible to everyone while protecting our planet. 
                  Through our platform, we're building a community where style meets sustainability.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* How It Works Steps */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Get Started in 4 Easy Steps
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="mx-auto mb-4 p-4 bg-purple-100 rounded-full w-fit">
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">1. Sign Up</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Create your free account and join our sustainable fashion community. 
                    Get 100 points to start your journey!
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="mx-auto mb-4 p-4 bg-green-100 rounded-full w-fit">
                    <Upload className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">2. List Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Upload photos of your clothing items, add descriptions, and set point values. 
                    Our team reviews each listing for quality.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="mx-auto mb-4 p-4 bg-blue-100 rounded-full w-fit">
                    <Search className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">3. Browse & Discover</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Explore thousands of unique items from our community. 
                    Filter by category, size, and condition to find perfect matches.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="mx-auto mb-4 p-4 bg-orange-100 rounded-full w-fit">
                    <ArrowLeftRight className="w-8 h-8 text-orange-600" />
                  </div>
                  <CardTitle className="text-xl">4. Swap & Redeem</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Trade your items directly with other users or redeem using points. 
                    Every successful swap earns you more points!
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* How Swapping Works */}
          <Card className="mb-16 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                How Swapping & Redeeming Works
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <ArrowLeftRight className="w-5 h-5 text-purple-600" />
                    Item-for-Item Swaps
                  </h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Offer one of your listed items in exchange</li>
                    <li>• Both parties must agree to the trade</li>
                    <li>• Items are exchanged directly between users</li>
                    <li>• Both users earn bonus points on successful swaps</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Coins className="w-5 h-5 text-purple-600" />
                    Point-Based Redemption
                  </h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Use your points to redeem items directly</li>
                    <li>• Point values are set by item owners</li>
                    <li>• Instant redemption when you have enough points</li>
                    <li>• No waiting for approval from other users</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Points System */}
          <Card className="mb-16 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Understanding Our Points System
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="mx-auto mb-4 p-4 bg-green-100 rounded-full w-fit">
                    <Zap className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Earn Points</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>100 points on signup</li>
                    <li>25 points per successful swap</li>
                    <li>Points from item sales</li>
                    <li>Bonus points for quality listings</li>
                  </ul>
                </div>
                
                <div className="text-center">
                  <div className="mx-auto mb-4 p-4 bg-purple-100 rounded-full w-fit">
                    <Coins className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Spend Points</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Redeem for any listed item</li>
                    <li>Point values set by sellers</li>
                    <li>Instant transactions</li>
                    <li>No additional fees</li>
                  </ul>
                </div>
                
                <div className="text-center">
                  <div className="mx-auto mb-4 p-4 bg-blue-100 rounded-full w-fit">
                    <Shield className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Points Security</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Secure transaction history</li>
                    <li>Protected against fraud</li>
                    <li>Transparent point tracking</li>
                    <li>Customer support available</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Community Features */}
          <Card className="mb-16 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Community Features
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <h4 className="font-semibold mb-1">Rating System</h4>
                  <p className="text-sm text-gray-600">Rate users after successful transactions</p>
                </div>
                
                <div className="text-center">
                  <MessageCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <h4 className="font-semibold mb-1">Messaging</h4>
                  <p className="text-sm text-gray-600">Communicate with other users safely</p>
                </div>
                
                <div className="text-center">
                  <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <h4 className="font-semibold mb-1">Favorites</h4>
                  <p className="text-sm text-gray-600">Save items you love for later</p>
                </div>
                
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <h4 className="font-semibold mb-1">Verification</h4>
                  <p className="text-sm text-gray-600">All listings reviewed for quality</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="text-center bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Start Your Sustainable Fashion Journey?
            </h2>
            <p className="text-xl mb-6 opacity-90">
              Join thousands of users who are already making fashion more sustainable
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                  Get Started Now
                </Button>
              </Link>
              <Link href="/browse">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Browse Items
                </Button>
              </Link>
            </div>
            <div className="mt-6 flex justify-center gap-8 text-sm opacity-75">
              <div>✓ Free to join</div>
              <div>✓ 100 points to start</div>
              <div>✓ No hidden fees</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}