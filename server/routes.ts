import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertItemSchema, insertSwapRequestSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";

export function registerRoutes(app: Express): Server {
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Profile update route
  app.patch("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const updated = await storage.updateUser(req.user.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Initialize default categories
  initializeCategories();

  // Item routes
  app.get("/api/items", async (req, res) => {
    try {
      const { category, search, userId, status, excludeUserId } = req.query;
      const filters: any = {};
      
      if (category) filters.category = category as string;
      if (search) filters.search = search as string;
      if (userId && !isNaN(parseInt(userId as string))) filters.userId = parseInt(userId as string);
      if (status) filters.status = status as string;
      if (excludeUserId && !isNaN(parseInt(excludeUserId as string))) filters.excludeUserId = parseInt(excludeUserId as string);

      const items = await storage.getItems(filters);
      res.json(items);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get("/api/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      // Increment views
      await storage.incrementItemViews(id);
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });

  app.post("/api/items", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const validatedData = insertItemSchema.parse(req.body);
      const item = await storage.createItem({
        ...validatedData,
        userId: req.user!.id
      });
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create item" });
    }
  });

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Swap requests routes
  app.get("/api/swap-requests", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const { itemId, status } = req.query;
      const filters: any = { userId: req.user!.id };
      
      if (itemId) filters.itemId = parseInt(itemId as string);
      if (status) filters.status = status as string;

      const swapRequests = await storage.getSwapRequests(filters);
      res.json(swapRequests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch swap requests" });
    }
  });



  app.patch("/api/swap-requests/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      await storage.updateSwapRequestStatus(id, status);
      
      // Handle completed swaps
      if (status === "completed") {
        // Award points to both parties
        const swapRequests = await storage.getSwapRequests({ userId: req.user!.id });
        const swapRequest = swapRequests.find(sr => sr.id === id);
        
        if (swapRequest) {
          await storage.createTransaction({
            userId: swapRequest.requesterId,
            itemId: swapRequest.itemId,
            type: "earned",
            points: 25,
            description: "Successful swap completed"
          });
          
          await storage.updateUserPoints(swapRequest.requesterId, 25);
        }
      }
      
      res.json({ message: "Swap request updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update swap request" });
    }
  });

  // User stats routes
  app.get("/api/user/stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const stats = await storage.getUserStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.get("/api/user/transactions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const transactions = await storage.getTransactions(req.user!.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Platform stats (public)
  app.get("/api/platform/stats", async (req, res) => {
    try {
      const stats = await storage.getPlatformStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch platform stats" });
    }
  });

  // Swap request routes
  app.post("/api/swap-requests", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      console.log("Received swap request data:", req.body);
      const validatedData = insertSwapRequestSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      
      // Get the item to find its owner (receiver)
      const item = await storage.getItem(validatedData.itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      console.log("Found item:", item.id, "owner:", item.user.id);
      
      // Additional validation for points redeem
      if (validatedData.pointsOffered) {
        if (req.user!.pointsBalance < validatedData.pointsOffered) {
          return res.status(400).json({ 
            message: `Insufficient points. You have ${req.user!.pointsBalance} but need ${validatedData.pointsOffered}.` 
          });
        }
      }
      
      const swapRequestData = {
        ...validatedData,
        requesterId: req.user!.id,
        receiverId: item.user.id
      };
      console.log("Creating swap request with data:", swapRequestData);
      
      const swapRequest = await storage.createSwapRequest(swapRequestData);
      res.status(201).json(swapRequest);
    } catch (error) {
      console.error("Error creating swap request:", error);
      console.error("Error stack:", error.stack);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid swap request data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create swap request", error: error.message });
    }
  });

  app.get("/api/swap-requests", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const { userId, itemId, status } = req.query;
      const filters: any = {};
      
      // If userId is provided, use it; otherwise default to current user
      if (userId && !isNaN(parseInt(userId as string))) {
        filters.userId = parseInt(userId as string);
      } else {
        filters.userId = req.user!.id;
      }
      
      if (itemId && !isNaN(parseInt(itemId as string))) filters.itemId = parseInt(itemId as string);
      if (status) filters.status = status as string;

      const swapRequests = await storage.getSwapRequestsForUser(filters);
      res.json(swapRequests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch swap requests" });
    }
  });

  app.patch("/api/swap-requests/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      await storage.updateSwapRequestStatus(id, status);
      res.json({ message: "Swap request status updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update swap request status" });
    }
  });

  app.delete("/api/swap-requests/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const id = parseInt(req.params.id);
      await storage.deleteSwapRequest(id, req.user!.id);
      res.json({ message: "Swap request deleted and points refunded" });
    } catch (error) {
      console.error("Error deleting swap request:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to delete swap request" });
    }
  });

  // Favorites routes
  app.get("/api/user/favorites", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const favorites = await storage.getFavorites(req.user!.id);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });



  app.delete("/api/favorites/:itemId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const itemId = parseInt(req.params.itemId);
      await storage.removeFavorite(req.user!.id, itemId);
      res.json({ message: "Item removed from favorites" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  app.get("/api/favorites/:itemId/check", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const itemId = parseInt(req.params.itemId);
      const isFavorite = await storage.isFavorite(req.user!.id, itemId);
      res.json(isFavorite);
    } catch (error) {
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });

  // Admin routes
  app.get("/api/admin/items", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const items = await storage.getItems({ status: "active" });
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch items for moderation" });
    }
  });

  app.patch("/api/admin/items/:id/approve", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const id = parseInt(req.params.id);
      const { isApproved } = req.body;
      
      await storage.updateItemApproval(id, isApproved);
      res.json({ message: "Item approval updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update item approval" });
    }
  });

  app.delete("/api/admin/items/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const id = parseInt(req.params.id);
      await storage.updateItemStatus(id, "removed");
      res.json({ message: "Item removed" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove item" });
    }
  });

  // Get user's favorites
  app.get("/api/user/favorites", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const favorites = await storage.getFavorites(req.user.id);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ error: "Failed to fetch favorites" });
    }
  });

  // Add item to favorites
  app.post("/api/favorites/:itemId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const itemId = parseInt(req.params.itemId);
      if (isNaN(itemId)) {
        return res.status(400).json({ error: "Invalid item ID" });
      }

      await storage.addFavorite(req.user.id, itemId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ error: "Failed to add favorite" });
    }
  });

  // Remove item from favorites
  app.delete("/api/favorites/:itemId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const itemId = parseInt(req.params.itemId);
      if (isNaN(itemId)) {
        return res.status(400).json({ error: "Invalid item ID" });
      }

      await storage.removeFavorite(req.user.id, itemId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ error: "Failed to remove favorite" });
    }
  });

  // Check if item is favorited
  app.get("/api/favorites/:itemId/check", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const itemId = parseInt(req.params.itemId);
      if (isNaN(itemId)) {
        return res.status(400).json({ error: "Invalid item ID" });
      }

      const isFavorite = await storage.isFavorite(req.user.id, itemId);
      res.json({ isFavorite });
    } catch (error) {
      console.error("Error checking favorite:", error);
      res.status(500).json({ error: "Failed to check favorite" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function initializeCategories() {
  try {
    const existingCategories = await storage.getCategories();
    if (existingCategories.length === 0) {
      const defaultCategories = [
        { name: "Tops", description: "Shirts, blouses, sweaters, t-shirts" },
        { name: "Bottoms", description: "Pants, jeans, skirts, shorts" },
        { name: "Dresses", description: "Casual and formal dresses" },
        { name: "Outerwear", description: "Jackets, coats, blazers" },
        { name: "Shoes", description: "Sneakers, boots, heels, flats" },
        { name: "Accessories", description: "Bags, jewelry, scarves, belts" }
      ];

      for (const category of defaultCategories) {
        await storage.createCategory(category);
      }
    }
  } catch (error) {
    console.error("Failed to initialize categories:", error);
  }
}
