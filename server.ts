import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from './src/firebase-config.js';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';

// Define the JWT decoding function
function decodeIdToken(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadBase64 = parts[1];
    // Decode base64url or standard base64 safely in Node
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const decodedPayload = Buffer.from(base64, 'base64').toString('utf8');
    const payload = JSON.parse(decodedPayload);
    
    // Check expiration (optional safety, allow 5 min clock skew)
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSeconds - 300) {
      console.warn("Token expired");
      return null;
    }
    return payload;
  } catch (e) {
    console.error("Error decoding token:", e);
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json());

  // Simple token authentication middleware
  app.use(async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = decodeIdToken(token);
      if (decoded) {
        req.user = decoded;
      }
    }
    
    // Role Resolution: Default to admin if email matches, or if header simulates it, or if it is the workspace developer
    const isBootstrappedAdmin = req.user?.email === "24eg107f29@anurag.edu.in";
    const simulatedRole = req.headers['x-simulate-role'];
    
    if (simulatedRole === 'admin') {
      req.isAdmin = true;
      req.role = 'admin';
    } else if (simulatedRole === 'user') {
      req.isAdmin = false;
      req.role = 'user';
    } else {
      req.isAdmin = isBootstrappedAdmin;
      req.role = isBootstrappedAdmin ? 'admin' : 'user';
    }
    
    next();
  });

  // Seed default products if database is empty
  async function ensureSeededProducts() {
    try {
      const prodColRef = collection(db, "products");
      const prodSnapshot = await getDocs(prodColRef);
      if (prodSnapshot.empty) {
        console.log("Database is empty, seeding default high-quality products...");
        const defaultProducts = [
          {
            name: "Premium Wireless Headphones",
            description: "High-fidelity audio with hybrid active noise cancellation, ambient sound pass-through, and up to 40 hours of continuous battery life. Made with ultra-soft memory foam earcups.",
            price: 199.99,
            imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
            category: "Electronics",
            stock: 25,
            createdAt: new Date().toISOString()
          },
          {
            name: "Ergonomic Mechanical Keyboard",
            description: "Anodized aluminum frame mechanical keyboard featuring hot-swappable linear switches, sound-dampening foam, per-key customizable RGB, and multi-device wireless pairing.",
            price: 129.99,
            imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
            category: "Accessories",
            stock: 15,
            createdAt: new Date().toISOString()
          },
          {
            name: "Ultra-Wide Curved Monitor",
            description: "Immersive 34-inch curved display with 144Hz refresh rate, HDR400 support, 1ms response time, and stunning QHD resolution. Ideal for dual-window productivity and gaming.",
            price: 449.99,
            imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80",
            category: "Electronics",
            stock: 8,
            createdAt: new Date().toISOString()
          },
          {
            name: "Smart Fitness Watch Active",
            description: "Sleek fitness tracker with always-on AMOLED touchscreen, blood oxygen monitoring, 24/7 heart-rate analysis, built-in dual-band GPS, and comprehensive stress sleep diagnostics.",
            price: 179.99,
            imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
            category: "Wearables",
            stock: 30,
            createdAt: new Date().toISOString()
          },
          {
            name: "Studio Condenser USB Microphone",
            description: "Professional high-resolution USB microphone featuring cardioid, omni, bidirectional, and stereo polar patterns. Perfect for streaming, vocal recording, and crystal-clear calls.",
            price: 89.99,
            imageUrl: "https://images.unsplash.com/photo-1590608897129-79da98d15969?w=600&auto=format&fit=crop&q=80",
            category: "Accessories",
            stock: 20,
            createdAt: new Date().toISOString()
          },
          {
            name: "Minimalist Leather Backpack",
            description: "Water-resistant, full-grain Italian leather laptop backpack. Designed with a padded 16-inch sleeve, integrated luggage strap, and hidden anti-theft pocket.",
            price: 149.99,
            imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
            category: "Apparel",
            stock: 12,
            createdAt: new Date().toISOString()
          }
        ];

        for (const prod of defaultProducts) {
          const docId = prod.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          await setDoc(doc(db, "products", docId), prod);
        }
        console.log("Seeding complete!");
      }
    } catch (err) {
      console.error("Error seeding products database:", err);
    }
  }

  // Run seeder once database client is initialized
  await ensureSeededProducts();

  // --- API ROUTES ---

  // GET: /api/products (All products)
  app.get("/api/products", async (req, res) => {
    try {
      const prodSnapshot = await getDocs(collection(db, "products"));
      const products: any[] = [];
      prodSnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() as any });
      });
      res.json(products);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch products", details: err.message });
    }
  });

  // GET: /api/products/:id (Single product)
  app.get("/api/products/:id", async (req, res) => {
    try {
      const productDoc = await getDoc(doc(db, "products", req.params.id));
      if (!productDoc.exists()) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json({ id: productDoc.id, ...productDoc.data() as any });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch product", details: err.message });
    }
  });

  // POST: /api/products (Create Product - Admin only)
  app.post("/api/products", async (req: any, res) => {
    if (!req.isAdmin) {
      return res.status(403).json({ error: "Permission denied. Admin authorization required." });
    }
    try {
      const { name, description, price, imageUrl, category, stock } = req.body;
      if (!name || price === undefined || !imageUrl || !category || stock === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const newProduct = {
        name,
        description: description || "",
        price: parseFloat(price),
        imageUrl,
        category,
        stock: parseInt(stock),
        createdAt: new Date().toISOString()
      };
      
      const docId = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.floor(Math.random() * 10000);
      await setDoc(doc(db, "products", docId), newProduct);
      res.status(201).json({ id: docId, ...newProduct });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to create product", details: err.message });
    }
  });

  // PUT: /api/products/:id (Update Product - Admin only)
  app.put("/api/products/:id", async (req: any, res) => {
    if (!req.isAdmin) {
      return res.status(403).json({ error: "Permission denied. Admin authorization required." });
    }
    try {
      const { name, description, price, imageUrl, category, stock } = req.body;
      const prodRef = doc(db, "products", req.params.id);
      const prodSnap = await getDoc(prodRef);
      if (!prodSnap.exists()) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      const updatedFields: any = {};
      if (name !== undefined) updatedFields.name = name;
      if (description !== undefined) updatedFields.description = description;
      if (price !== undefined) updatedFields.price = parseFloat(price);
      if (imageUrl !== undefined) updatedFields.imageUrl = imageUrl;
      if (category !== undefined) updatedFields.category = category;
      if (stock !== undefined) updatedFields.stock = parseInt(stock);

      await updateDoc(prodRef, updatedFields);
      res.json({ id: req.params.id, ...prodSnap.data() as any, ...updatedFields });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update product", details: err.message });
    }
  });

  // DELETE: /api/products/:id (Delete Product - Admin only)
  app.delete("/api/products/:id", async (req: any, res) => {
    if (!req.isAdmin) {
      return res.status(403).json({ error: "Permission denied. Admin authorization required." });
    }
    try {
      const prodRef = doc(db, "products", req.params.id);
      const prodSnap = await getDoc(prodRef);
      if (!prodSnap.exists()) {
        return res.status(404).json({ error: "Product not found" });
      }
      await deleteDoc(prodRef);
      res.json({ success: true, message: "Product deleted successfully" });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to delete product", details: err.message });
    }
  });

  // POST: /api/orders (Create Order - Authenticated User)
  app.post("/api/orders", async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required to place an order" });
    }
    try {
      const { items, shippingAddress, totalAmount } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0 || !shippingAddress || !totalAmount) {
        return res.status(400).json({ error: "Missing order items, total, or shipping details." });
      }

      // Check stock and update inventory atomically or iteratively
      for (const item of items) {
        const prodRef = doc(db, "products", item.productId);
        const prodSnap = await getDoc(prodRef);
        if (!prodSnap.exists()) {
          return res.status(404).json({ error: `Product ${item.name} not found in inventory` });
        }
        const currentStock = prodSnap.data().stock;
        if (currentStock < item.quantity) {
          return res.status(400).json({ error: `Insufficient stock for product ${item.name}. Available: ${currentStock}` });
        }
      }

      // Deduct stock
      for (const item of items) {
        const prodRef = doc(db, "products", item.productId);
        const prodSnap = await getDoc(prodRef);
        const currentStock = prodSnap.data().stock;
        await updateDoc(prodRef, { stock: currentStock - item.quantity });
      }

      const orderData = {
        userId: req.user.uid,
        userEmail: req.user.email || req.user.email_verified || "user@example.com",
        items,
        totalAmount: parseFloat(totalAmount),
        status: "pending",
        shippingAddress,
        createdAt: new Date().toISOString()
      };

      const orderId = "ord-" + Math.floor(Math.random() * 900000 + 100000);
      await setDoc(doc(db, "orders", orderId), orderData);

      res.status(201).json({ id: orderId, ...orderData });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to submit order", details: err.message });
    }
  });

  // GET: /api/orders (All orders for Admin, Personal orders for User)
  app.get("/api/orders", async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required to fetch orders" });
    }
    try {
      const ordersCol = collection(db, "orders");
      let ordersQuery;

      if (req.isAdmin) {
        // Admins can see all orders
        ordersQuery = query(ordersCol, orderBy("createdAt", "desc"));
      } else {
        // Standard users can only see their own orders
        ordersQuery = query(ordersCol, where("userId", "==", req.user.uid));
      }

      const ordersSnap = await getDocs(ordersQuery);
      const orders: any[] = [];
      ordersSnap.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() as any });
      });

      // Simple fallback sort if client-side or Firestore ordering needs help
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch orders", details: err.message });
    }
  });

  // PATCH: /api/orders/:id (Update Order Status)
  app.patch("/api/orders/:id", async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const orderRef = doc(db, "orders", req.params.id);
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) {
        return res.status(404).json({ error: "Order not found" });
      }

      const orderData = orderSnap.data();

      // Authorization Gate: Admin can update any status. User can only cancel their OWN pending order.
      const isOwner = orderData.userId === req.user.uid;
      const isAllowedCancel = isOwner && status === "cancelled" && orderData.status === "pending";

      if (!req.isAdmin && !isAllowedCancel) {
        return res.status(403).json({ error: "Unauthorized status modification" });
      }

      // If cancelled by customer or admin, return inventory stock
      if (status === "cancelled" && orderData.status !== "cancelled") {
        for (const item of orderData.items) {
          try {
            const prodRef = doc(db, "products", item.productId);
            const prodSnap = await getDoc(prodRef);
            if (prodSnap.exists()) {
              const currentStock = prodSnap.data().stock;
              await updateDoc(prodRef, { stock: currentStock + item.quantity });
            }
          } catch (e) {
            console.error(`Failed to return stock for cancelled product ${item.productId}`, e);
          }
        }
      }

      await updateDoc(orderRef, { status });
      res.json({ id: req.params.id, ...orderData, status });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update order status", details: err.message });
    }
  });

  // GET: /api/admin/stats (Admin dashboard stats overview)
  app.get("/api/admin/stats", async (req: any, res) => {
    if (!req.isAdmin) {
      return res.status(403).json({ error: "Permission denied. Admin authorization required." });
    }
    try {
      // Gather orders
      const ordersSnap = await getDocs(collection(db, "orders"));
      const productsSnap = await getDocs(collection(db, "products"));

      let totalSales = 0;
      let orderCount = 0;
      let pendingCount = 0;
      let shippedCount = 0;
      let processingCount = 0;
      
      ordersSnap.forEach((doc) => {
        const order = doc.data();
        orderCount++;
        if (order.status !== "cancelled") {
          totalSales += order.totalAmount;
        }
        if (order.status === "pending") pendingCount++;
        if (order.status === "processing") processingCount++;
        if (order.status === "shipped") shippedCount++;
      });

      let lowStockCount = 0;
      let totalProductsCount = 0;
      productsSnap.forEach((doc) => {
        totalProductsCount++;
        if (doc.data().stock < 5) {
          lowStockCount++;
        }
      });

      res.json({
        totalSales: parseFloat(totalSales.toFixed(2)),
        totalOrders: orderCount,
        totalProducts: totalProductsCount,
        pendingOrders: pendingCount,
        processingOrders: processingCount,
        shippedOrders: shippedCount,
        lowStockAlerts: lowStockCount
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch dashboard stats", details: err.message });
    }
  });

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
