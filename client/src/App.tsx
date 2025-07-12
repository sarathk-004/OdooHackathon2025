import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import HomePage from "@/pages/home-page";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import BrowseItemsPage from "@/pages/browse-items-page";
import AddItemPage from "@/pages/add-item-page";
import ItemDetailPage from "@/pages/item-detail-page";
import AdminPage from "@/pages/admin-page";
import ProfilePage from "@/pages/profile-page";
import HowItWorksPage from "@/pages/how-it-works-page";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/browse" component={BrowseItemsPage} />
      <ProtectedRoute path="/add-item" component={AddItemPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/items/:id" component={ItemDetailPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <Route path="/how-it-works" component={HowItWorksPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
