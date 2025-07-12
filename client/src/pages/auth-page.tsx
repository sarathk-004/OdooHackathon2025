import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { Recycle, Leaf, Users, DollarSign } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to terms"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  
  // Check URL for initial tab (for signup redirect)
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') === 'register' ? 'register' : 'login';
  const [activeTab, setActiveTab] = useState(initialTab);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      agreeToTerms: false,
    },
  });

  // Redirect if already logged in
  if (!isLoading && user) {
    return <Redirect to="/dashboard" />;
  }

  const onLogin = async (data: LoginFormData) => {
    await loginMutation.mutateAsync(data);
  };

  const onRegister = async (data: RegisterFormData) => {
    const { confirmPassword, agreeToTerms, ...userData } = data;
    await registerMutation.mutateAsync(userData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left side - Auth forms */}
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Recycle className="w-8 h-8 text-purple-600" />
                <span className="text-3xl font-bold text-gray-900">ReWear</span>
              </div>
              <p className="text-gray-600">Join the sustainable fashion revolution</p>
            </div>

            <Card className="shadow-xl border-0">
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Sign In</TabsTrigger>
                    <TabsTrigger value="register">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-4">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                      <p className="text-gray-600">Sign in to continue your sustainable fashion journey</p>
                    </div>

                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          {...loginForm.register("username")}
                          placeholder="Enter your username"
                          className="h-12"
                        />
                        {loginForm.formState.errors.username && (
                          <p className="text-sm text-red-500">{loginForm.formState.errors.username.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          {...loginForm.register("password")}
                          placeholder="Enter your password"
                          className="h-12"
                        />
                        {loginForm.formState.errors.password && (
                          <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full rewear-button h-12 text-lg"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Signing In..." : "Sign In"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="register" className="space-y-4">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Join ReWear</h2>
                      <p className="text-gray-600">Start your sustainable fashion journey today</p>
                    </div>

                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            {...registerForm.register("firstName")}
                            placeholder="John"
                            className="h-12"
                          />
                          {registerForm.formState.errors.firstName && (
                            <p className="text-sm text-red-500">{registerForm.formState.errors.firstName.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            {...registerForm.register("lastName")}
                            placeholder="Doe"
                            className="h-12"
                          />
                          {registerForm.formState.errors.lastName && (
                            <p className="text-sm text-red-500">{registerForm.formState.errors.lastName.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="username-register">Username</Label>
                        <Input
                          id="username-register"
                          {...registerForm.register("username")}
                          placeholder="Choose a username"
                          className="h-12"
                        />
                        {registerForm.formState.errors.username && (
                          <p className="text-sm text-red-500">{registerForm.formState.errors.username.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          {...registerForm.register("email")}
                          placeholder="your@email.com"
                          className="h-12"
                        />
                        {registerForm.formState.errors.email && (
                          <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password-register">Password</Label>
                        <Input
                          id="password-register"
                          type="password"
                          {...registerForm.register("password")}
                          placeholder="Create a password"
                          className="h-12"
                        />
                        {registerForm.formState.errors.password && (
                          <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          {...registerForm.register("confirmPassword")}
                          placeholder="Confirm your password"
                          className="h-12"
                        />
                        {registerForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-red-500">{registerForm.formState.errors.confirmPassword.message}</p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="agreeToTerms"
                          checked={registerForm.watch("agreeToTerms")}
                          onCheckedChange={(checked) => registerForm.setValue("agreeToTerms", !!checked)}
                        />
                        <Label htmlFor="agreeToTerms" className="text-sm">
                          I agree to the Terms of Service and Privacy Policy
                        </Label>
                      </div>
                      {registerForm.formState.errors.agreeToTerms && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.agreeToTerms.message}</p>
                      )}

                      <Button
                        type="submit"
                        className="w-full rewear-button h-12 text-lg"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Hero section */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Transform fashion through{" "}
                <span className="bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                  sustainable exchange
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Join a community of conscious consumers reducing waste and discovering unique pieces 
                through our premium clothing exchange platform.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Environmental Impact</h3>
                  <p className="text-gray-600">Reduce textile waste by extending clothing lifecycles</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Community Driven</h3>
                  <p className="text-gray-600">Connect with fashion enthusiasts who share your values</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Cost Effective</h3>
                  <p className="text-gray-600">Refresh your wardrobe without breaking the bank</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400" 
                alt="Sustainable fashion community" 
                className="w-full rounded-2xl shadow-lg" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
