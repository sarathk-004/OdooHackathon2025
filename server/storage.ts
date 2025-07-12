import { 
  users, 
  items, 
  categories, 
  swapRequests, 
  transactions,
  favorites,
  type User, 
  type InsertUser,
  type Item,
  type InsertItem,
  type Category,
  type InsertCategory,
  type SwapRequest,
  type InsertSwapRequest,
  type Transaction,
  type Favorite
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  updateUserPoints(userId: number, points: number): Promise<void>;

  // Item operations
  getItems(filters?: { category?: string; search?: string; userId?: number; status?: string; excludeUserId?: number }): Promise<(Item & { user: User; category: Category })[]>;
  getItem(id: number): Promise<(Item & { user: User; category: Category }) | undefined>;
  createItem(item: InsertItem & { userId: number }): Promise<Item>;
  updateItemStatus(id: number, status: string): Promise<void>;
  updateItemApproval(id: number, isApproved: boolean): Promise<void>;
  incrementItemViews(id: number): Promise<void>;

  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Swap request operations
  getSwapRequests(filters?: { userId?: number; itemId?: number; status?: string }): Promise<(SwapRequest & { requester: User; item: Item; offeredItem?: Item })[]>;
  getSwapRequestsForUser(filters?: { userId?: number; itemId?: number; status?: string }): Promise<(SwapRequest & { requester: User; item: Item; offeredItem?: Item })[]>;
  createSwapRequest(swapRequest: InsertSwapRequest & { requesterId: number }): Promise<SwapRequest>;
  updateSwapRequestStatus(id: number, status: string): Promise<void>;
  deleteSwapRequest(id: number, userId: number): Promise<void>;

  // Transaction operations
  getTransactions(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: { userId: number; itemId?: number; type: string; points: number; description: string }): Promise<Transaction>;

  // Favorites operations
  getFavorites(userId: number): Promise<(Item & { user: User; category: Category })[]>;
  addFavorite(userId: number, itemId: number): Promise<void>;
  removeFavorite(userId: number, itemId: number): Promise<void>;
  isFavorite(userId: number, itemId: number): Promise<boolean>;

  // Stats
  getUserStats(userId: number): Promise<{ itemsListed: number; successfulSwaps: number; rating: number }>;
  getPlatformStats(): Promise<{ totalUsers: number; itemsListed: number; successfulSwaps: number }>;

  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    
    // Give new user welcome bonus
    await this.createTransaction({
      userId: user.id,
      type: "bonus",
      points: 100,
      description: "Welcome bonus"
    });
    
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async updateUserPoints(userId: number, points: number): Promise<void> {
    await db
      .update(users)
      .set({ pointsBalance: sql`${users.pointsBalance} + ${points}` })
      .where(eq(users.id, userId));
  }

  async setUserPoints(userId: number, points: number): Promise<void> {
    await db
      .update(users)
      .set({ pointsBalance: points })
      .where(eq(users.id, userId));
  }

  async getItems(filters?: { category?: string; search?: string; userId?: number; status?: string; excludeUserId?: number }): Promise<(Item & { user: User; category: Category })[]> {
    let query = db
      .select()
      .from(items)
      .innerJoin(users, eq(items.userId, users.id))
      .innerJoin(categories, eq(items.categoryId, categories.id))
      .$dynamic();

    const conditions = [];

    if (filters?.category) {
      conditions.push(eq(categories.name, filters.category));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(items.title, `%${filters.search}%`),
          ilike(items.description, `%${filters.search}%`)
        )
      );
    }

    if (filters?.userId) {
      conditions.push(eq(items.userId, filters.userId));
    }

    if (filters?.excludeUserId) {
      conditions.push(sql`${items.userId} != ${filters.excludeUserId}`);
    }

    if (filters?.status) {
      conditions.push(eq(items.status, filters.status));
    } else {
      conditions.push(eq(items.status, "active"));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(desc(items.createdAt));
    
    return results.map(result => ({
      ...result.items,
      user: result.users,
      category: result.categories
    }));
  }

  async getItem(id: number): Promise<(Item & { user: User; category: Category }) | undefined> {
    const [result] = await db
      .select()
      .from(items)
      .innerJoin(users, eq(items.userId, users.id))
      .innerJoin(categories, eq(items.categoryId, categories.id))
      .where(eq(items.id, id));

    if (!result) return undefined;

    return {
      ...result.items,
      user: result.users,
      category: result.categories
    };
  }

  async createItem(item: InsertItem & { userId: number }): Promise<Item> {
    const [newItem] = await db
      .insert(items)
      .values(item)
      .returning();

    // Give user points for listing
    await this.createTransaction({
      userId: item.userId,
      itemId: newItem.id,
      type: "earned",
      points: 50,
      description: "Item listed"
    });

    await this.updateUserPoints(item.userId, 50);
    
    return newItem;
  }

  async updateItemStatus(id: number, status: string): Promise<void> {
    await db
      .update(items)
      .set({ status })
      .where(eq(items.id, id));
  }

  async updateItemApproval(id: number, isApproved: boolean): Promise<void> {
    await db
      .update(items)
      .set({ isApproved })
      .where(eq(items.id, id));
  }

  async incrementItemViews(id: number): Promise<void> {
    await db
      .update(items)
      .set({ views: sql`${items.views} + 1` })
      .where(eq(items.id, id));
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async getSwapRequests(filters?: { userId?: number; itemId?: number; status?: string }): Promise<(SwapRequest & { requester: User; item: Item; offeredItem?: Item })[]> {
    const baseQuery = db
      .select({
        swapRequest: swapRequests,
        requester: users,
        item: items
      })
      .from(swapRequests)
      .innerJoin(users, eq(swapRequests.requesterId, users.id))
      .innerJoin(items, eq(swapRequests.itemId, items.id));

    const conditions = [];

    if (filters?.userId) {
      conditions.push(eq(swapRequests.requesterId, filters.userId));
    }

    if (filters?.itemId) {
      conditions.push(eq(swapRequests.itemId, filters.itemId));
    }

    if (filters?.status) {
      conditions.push(eq(swapRequests.status, filters.status));
    }

    let query = baseQuery.$dynamic();
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(desc(swapRequests.createdAt));
    
    // Fetch offered items separately if needed
    const enrichedResults = await Promise.all(
      results.map(async (result) => {
        let offeredItem = undefined;
        if (result.swapRequest.offeredItemId) {
          const [offered] = await db
            .select()
            .from(items)
            .where(eq(items.id, result.swapRequest.offeredItemId));
          offeredItem = offered;
        }
        
        return {
          ...result.swapRequest,
          requester: result.requester,
          item: result.item,
          offeredItem
        };
      })
    );
    
    return enrichedResults;
  }

  async getSwapRequestsForUser(filters?: { userId?: number; itemId?: number; status?: string }): Promise<(SwapRequest & { requester: User; item: Item & { user: User; category: Category }; offeredItem?: Item })[]> {
    const userId = filters?.userId;
    if (!userId) {
      return [];
    }

    const baseQuery = db
      .select({
        swapRequest: swapRequests,
        requester: users,
        item: items,
        category: categories,
      })
      .from(swapRequests)
      .innerJoin(users, eq(swapRequests.requesterId, users.id))
      .innerJoin(items, eq(swapRequests.itemId, items.id))
      .innerJoin(categories, eq(items.categoryId, categories.id));

    const conditions = [];

    // Show both outgoing requests (made by user) and incoming requests (for user's items)
    conditions.push(
      or(
        eq(swapRequests.requesterId, userId), // Outgoing requests
        eq(swapRequests.receiverId, userId) // Incoming requests for user
      )
    );

    if (filters?.itemId) {
      conditions.push(eq(swapRequests.itemId, filters.itemId));
    }

    if (filters?.status) {
      conditions.push(eq(swapRequests.status, filters.status));
    }

    let query = baseQuery.$dynamic();
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(desc(swapRequests.createdAt));
    
    // Fetch offered items and item owners separately if needed
    const enrichedResults = await Promise.all(
      results.map(async (result) => {
        let offeredItem = undefined;
        if (result.swapRequest.offeredItemId) {
          const [offered] = await db
            .select()
            .from(items)
            .where(eq(items.id, result.swapRequest.offeredItemId));
          offeredItem = offered;
        }
        
        // Get item owner
        const [itemOwner] = await db
          .select()
          .from(users)
          .where(eq(users.id, result.item.userId));
        
        return {
          ...result.swapRequest,
          requester: result.requester,
          item: {
            ...result.item,
            user: itemOwner,
            category: result.category
          },
          offeredItem
        };
      })
    );
    
    return enrichedResults;
  }

  async createSwapRequest(swapRequest: InsertSwapRequest & { requesterId: number; receiverId: number }): Promise<SwapRequest> {
    const [newSwapRequest] = await db
      .insert(swapRequests)
      .values(swapRequest)
      .returning();
    
    // If it's a points redemption (no offeredItemId), process it immediately
    if (swapRequest.pointsOffered && !swapRequest.offeredItemId) {
      // Set item status to processing
      await this.updateItemStatus(swapRequest.itemId, 'processing');
      
      // Deduct points from user
      const currentUser = await this.getUser(swapRequest.requesterId);
      if (currentUser) {
        const newPointsBalance = currentUser.pointsBalance - swapRequest.pointsOffered;
        await db
          .update(users)
          .set({ pointsBalance: newPointsBalance })
          .where(eq(users.id, swapRequest.requesterId));
      }
      
      // Create transaction record
      await this.createTransaction({
        userId: swapRequest.requesterId,
        itemId: swapRequest.itemId,
        type: "spent",
        points: -swapRequest.pointsOffered,
        description: `Redeemed item with points`
      });
      
      // Update swap request status to accepted since it's an immediate redemption
      await this.updateSwapRequestStatus(newSwapRequest.id, 'accepted');
    }
    
    return newSwapRequest;
  }

  async updateSwapRequestStatus(id: number, status: string): Promise<void> {
    const updateData: any = { status };
    if (status === "completed") {
      updateData.completedAt = new Date();
    }

    await db
      .update(swapRequests)
      .set(updateData)
      .where(eq(swapRequests.id, id));
  }

  async deleteSwapRequest(id: number, userId: number): Promise<void> {
    // Get the swap request first to check if it involves points
    const [swapRequest] = await db
      .select()
      .from(swapRequests)
      .where(and(eq(swapRequests.id, id), eq(swapRequests.requesterId, userId)));

    if (!swapRequest) {
      throw new Error("Swap request not found or not authorized");
    }

    // If this was a point-based redemption, refund the points
    if (swapRequest.pointsOffered) {
      // Get the item to restore its status
      const [item] = await db
        .select()
        .from(items)
        .where(eq(items.id, swapRequest.itemId));

      if (item) {
        // Restore item status to active
        await db.update(items).set({ status: 'active' }).where(eq(items.id, swapRequest.itemId));
      }

      // Refund the points
      await db.update(users)
        .set({ pointsBalance: sql`${users.pointsBalance} + ${swapRequest.pointsOffered}` })
        .where(eq(users.id, userId));

      // Create a refund transaction
      await this.createTransaction({
        userId: userId,
        itemId: swapRequest.itemId,
        type: "refund",
        points: swapRequest.pointsOffered,
        description: `Refund for cancelled redemption of ${item?.title || 'item'}`
      });
    }

    // Delete the swap request
    await db.delete(swapRequests).where(eq(swapRequests.id, id));
  }

  async getTransactions(userId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transaction: { userId: number; itemId?: number; type: string; points: number; description: string }): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values({
        ...transaction,
        createdAt: new Date()
      })
      .returning();
    return newTransaction;
  }

  async getUserStats(userId: number): Promise<{ itemsListed: number; successfulSwaps: number; rating: number }> {
    const [itemsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(eq(items.userId, userId));

    const [swapsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(swapRequests)
      .where(and(
        eq(swapRequests.requesterId, userId),
        or(eq(swapRequests.status, "completed"), eq(swapRequests.status, "accepted"))
      ));

    const [user] = await db
      .select({ rating: users.rating })
      .from(users)
      .where(eq(users.id, userId));

    return {
      itemsListed: itemsCount?.count || 0,
      successfulSwaps: swapsCount?.count || 0,
      rating: user ? user.rating / 100 : 5.0
    };
  }

  async getPlatformStats(): Promise<{ totalUsers: number; itemsListed: number; successfulSwaps: number }> {
    const [usersCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const [itemsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(items);

    const [swapsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(swapRequests)
      .where(eq(swapRequests.status, "completed"));

    return {
      totalUsers: usersCount?.count || 0,
      itemsListed: itemsCount?.count || 0,
      successfulSwaps: swapsCount?.count || 0
    };
  }

  async getFavorites(userId: number): Promise<(Item & { user: User; category: Category })[]> {
    const result = await db.select({
      id: items.id,
      userId: items.userId,
      categoryId: items.categoryId,
      title: items.title,
      description: items.description,
      size: items.size,
      condition: items.condition,
      pointValue: items.pointValue,
      tags: items.tags,
      images: items.images,
      status: items.status,
      isApproved: items.isApproved,
      views: items.views,
      createdAt: items.createdAt,
      user: users,
      category: categories
    })
    .from(favorites)
    .innerJoin(items, eq(favorites.itemId, items.id))
    .innerJoin(users, eq(items.userId, users.id))
    .innerJoin(categories, eq(items.categoryId, categories.id))
    .where(and(
      eq(favorites.userId, userId),
      eq(items.status, "active")
    ))
    .orderBy(desc(favorites.createdAt));

    return result;
  }

  async addFavorite(userId: number, itemId: number): Promise<void> {
    await db.insert(favorites).values({
      userId,
      itemId
    }).onConflictDoNothing();
  }

  async removeFavorite(userId: number, itemId: number): Promise<void> {
    await db.delete(favorites).where(and(
      eq(favorites.userId, userId),
      eq(favorites.itemId, itemId)
    ));
  }

  async isFavorite(userId: number, itemId: number): Promise<boolean> {
    const result = await db.select({ id: favorites.id })
      .from(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.itemId, itemId)
      ))
      .limit(1);

    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
