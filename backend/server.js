const express = require("express");
const multer = require("multer");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const initDB = require("./db");

const app = express();
const upload = multer({ dest: "uploads/" });
const SECRET = process.env.JWT_SECRET || "supersecretkey";

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

let db;

/* ===================== INIT DATABASE ===================== */
(async () => {
  db = await initDB();
  console.log("Database connected");

  try {
  await db.exec(`ALTER TABLE users ADD COLUMN email TEXT UNIQUE`);
  console.log("Email column added to users table");
  } catch (err) {

  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      location TEXT,
      photo TEXT,
      status TEXT DEFAULT 'pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER,
      username TEXT,
      email TEXT,
      name TEXT,
      reason TEXT,
      features TEXT,
      teacher TEXT,
      status TEXT DEFAULT 'pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const admin = await db.get(
    "SELECT * FROM admins WHERE username = ?",
    "admin"
  );

  if (!admin) {
    const hashed = await bcrypt.hash("password", 10);
    await db.run(
      "INSERT INTO admins (username, password) VALUES (?, ?)",
      "admin",
      hashed
    );
    console.log("Default admin created: admin / password");
  }
})();

/* ===================== ITEMS ===================== */
app.get("/api/items", async (req, res) => {
  const recent = req.query.recent;

  const items = recent
    ? await db.all(
        "SELECT * FROM items WHERE status='approved' ORDER BY createdAt DESC LIMIT 3"
      )
    : await db.all(
        "SELECT * FROM items WHERE status='approved'"
      );

  res.json(items);
});

app.post("/api/items", upload.single("image"), async (req, res) => {
  try {
    const { title, description, location } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title || !description || !location) {
      return res.json({ success: false, message: "All fields are required" });
    }

    await db.run(
      `
      INSERT INTO items (title, description, location, photo, status, createdAt)
      VALUES (?, ?, ?, ?, 'pending', datetime('now'))
      `,
      title,
      description,
      location,
      photo
    );

    res.json({
      success: true,
      message: "Item submitted for review!"
    });

  } catch (err) {
    console.error("Item upload error:", err);
    res.status(500).json({
      success: false,
      message: "Could not submit item"
    });
  }
});

/* ===================== ADMIN LOGIN ===================== */
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;

  const admin = await db.get(
    "SELECT * FROM admins WHERE username = ?",
    username
  );

  if (!admin)
    return res.json({ success: false, message: "Admin not found" });

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid)
    return res.json({ success: false, message: "Invalid password" });

  const token = jwt.sign({ admin: username }, SECRET, { expiresIn: "1h" });
  res.json({ success: true, token });
});

/* ===================== USER LOGIN ===================== */
app.post("/api/user/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await db.get(
    "SELECT * FROM users WHERE username = ?",
    username
  );

  if (!user)
    return res.json({ success: false, message: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid)
    return res.json({ success: false, message: "Invalid password" });

  const token = jwt.sign({ username }, SECRET, { expiresIn: "1h" });

  res.json({
    success: true,
    token,
    username: user.username,
    email: user.email
  });
});

/* ===================== USER SIGNUP ===================== */
app.post("/api/user/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.json({ success: false, message: "Missing fields" });
    }

    const existing = await db.get(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      username,
      email
    );

    if (existing) {
      return res.json({
        success: false,
        message: "Username or email already exists"
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    await db.run(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      username,
      email,
      hashed
    );

    res.json({ success: true });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ===================== ADMIN ITEMS ===================== */
app.get("/api/pending", async (req, res) => {
  const items = await db.all(
    "SELECT * FROM items WHERE status='pending'"
  );
  res.json(items);
});

app.put("/api/approve/:id", async (req, res) => {
  await db.run(
    "UPDATE items SET status='approved' WHERE id=?",
    req.params.id
  );
  res.json({ success: true });
});

app.put("/api/decline/:id", async (req, res) => {
  try {
    await db.run(
      "UPDATE items SET status = 'declined' WHERE id = ?",
      req.params.id
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Decline item error:", err);
    res.status(500).json({
      success: false,
      message: "Could not decline item"
    });
  }
});

/* ===================== CLAIMS ===================== */
app.post("/api/claims", async (req, res) => {
  try {
    const { username, email, item_id, name, reason, features, teacher } = req.body;

    if (!name || !reason || !teacher) {
      return res.json({ success: false, message: "Missing fields" });
    }

    await db.run(
      `
      INSERT INTO claims (username, email, item_id, name, reason, features, teacher)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      username || "anonymous",
      email || "N/A",
      item_id || null,
      name,
      reason,
      features || "",
      teacher
    );

    res.json({ success: true, message: "Claim submitted successfully!" });

  } catch (err) {
    console.error("Claim error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/claims/pending", async (req, res) => {
  try {
    const sql = `
      SELECT claims.*, items.title AS item_title, items.photo AS item_photo 
      FROM claims 
      LEFT JOIN items ON claims.item_id = items.id 
      WHERE claims.status = 'pending'
    `;
    
    const claims = await db.all(sql);
    res.json(claims);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch claims" });
  }
});

app.put("/api/claims/approve/:id", async (req, res) => {
  try {
    const claimId = req.params.id;

    const claim = await db.get("SELECT item_id FROM claims WHERE id = ?", [claimId]);
    
    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim not found" });
    }

    await db.run("UPDATE claims SET status = 'approved' WHERE id = ?", [claimId]);

    await db.run("UPDATE items SET status = 'claimed' WHERE id = ?", [claim.item_id]);

    await db.run(
      "UPDATE claims SET status = 'declined' WHERE item_id = ? AND id != ?", 
      [claim.item_id, claimId]
    );

    res.json({ success: true, message: "Approved and item hidden from public list." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.put('/api/claims/decline/:id', async (req, res) => {
  try {
    const claimId = req.params.id;

    // 1. Find the claim to get the item_id
    const row = await db.get("SELECT item_id FROM claims WHERE id = ?", [claimId]);
    
    if (!row) {
      return res.status(404).json({ success: false, error: "Claim not found" });
    }

    // 2. Set the item back to 'approved' so it appears on the public list again
    await db.run("UPDATE items SET status = 'approved' WHERE id = ?", [row.item_id]);

    // 3. Update the claim status to 'declined' (don't delete it!)
    await db.run("UPDATE claims SET status = 'declined' WHERE id = ?", [claimId]);
      
    res.json({ success: true, message: "Claim declined and item returned to list." });
  } catch (err) {
    console.error("Decline error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/* ===================== DELETE CLAIM (USER PROFILE) ===================== */
app.delete("/api/claims/:id", async (req, res) => {
  try {
    const claimId = req.params.id;

    // Find the claim first
    const claim = await db.get(
      "SELECT * FROM claims WHERE id = ?",
      [claimId]
    );

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: "Claim not found"
      });
    }

    // If the claim was approved, permanently remove the item
    if (claim.status === "approved") {
      await db.run(
        "UPDATE items SET status = 'declined' WHERE id = ?",
        [claim.item_id]
      );
    }

    // Always delete the claim itself
    await db.run(
      "DELETE FROM claims WHERE id = ?",
      [claimId]
    );

    res.json({
      success: true,
      message: "Claim deleted successfully"
    });

  } catch (err) {
    console.error("Delete claim error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ===================== USER PROFILE ===================== */
app.get("/api/user/claims/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const claims = await db.all(
      `
      SELECT claims.*, items.title, items.photo, items.location
      FROM claims
      LEFT JOIN items ON claims.item_id = items.id
      WHERE claims.username = ?
      ORDER BY claims.createdAt DESC
      `,
      username
    );

    res.json(claims);
  } catch (err) {
    console.error("Profile claims error:", err);
    res.status(500).json({ error: "Failed to load profile data" });
  }
});

/* ===================== START SERVER ===================== */
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});


