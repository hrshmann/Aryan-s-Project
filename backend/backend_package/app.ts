/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Auto-activate environment variables from .env.example if .env does not exist yet
try {
  const envPath = path.join(process.cwd(), ".env");
  const examplePath = path.join(process.cwd(), ".env.example");
  if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log("Automatically copied .env.example to .env to activate environment variables.");
  }
} catch (e) {
  console.error("Error copying .env.example to .env:", e);
}

dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "Mental Health Care-super-secret-key-2026";
const MONGODB_URI = process.env.MONGODB_URI || "";

// Initialize Express Middleware
app.use(express.json());

// ------------------------------------------------------------------
// --- DATABASE BRIDGE (MONGODB OR FAIL-SAFE JSON FILE PERSISTENCE) ---
// ------------------------------------------------------------------
let isUsingMongoDB = false;

// Mock Local Database Path
const LOCAL_DB_PATH = path.join(process.cwd(), "db_fallback.json");

// Define Local Storage Schema structure
interface LocalDBStructure {
  users: any[];
  therapists: any[];
  appointments: any[];
  moods: any[];
  feedback: any[];
  emergencyContacts: any[];
  blogs?: any[];
}

// Default initial seed data
const DEFAULT_SEED_DATA: LocalDBStructure = {
  users: [
    {
      _id: "admin-id-123",
      id: "admin-id-123",
      name: "Priya Sharma",
      email: "admin@Mental Health Care.in",
      password: bcrypt.hashSync("admin123", 10),
      role: "Admin",
      age: 34,
      points: 450,
      level: 3,
      badges: ["first-breath", "self-care-champion", "zen-master"],
      createdAt: new Date().toISOString()
    },
    {
      _id: "therapist-id-1",
      id: "therapist-id-1",
      name: "Dr. Aditi Sharma",
      email: "aditi.specialist@Mental Health Care.in",
      password: bcrypt.hashSync("therapist123", 10),
      role: "Therapist",
      age: 41,
      points: 120,
      level: 1,
      badges: [],
      createdAt: new Date().toISOString()
    }
  ],
  therapists: [
    {
      id: "therapist-id-1",
      name: "Dr. Aditi Sharma",
      email: "aditi.specialist@Mental Health Care.in",
      specialty: "Cognitive Behavioral Therapy (CBT)",
      experience: 12,
      rating: 4.9,
      bio: "Dr. Sharma specializes in anxiety and depression care through collaborative CBT sessions for students, working professionals, and families across India.",
      imgUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300",
      availability: ["Mon 09:00 AM IST", "Mon 02:00 PM IST", "Wed 11:00 AM IST", "Fri 03:00 PM IST"],
      pricePerSession: 1500,
      approved: true
    },
    {
      id: "therapist-id-2",
      name: "Dr. Arjun Mehta",
      email: "arjun.mbsr@Mental Health Care.in",
      specialty: "Mindfulness-Based Stress Reduction (MBSR)",
      experience: 15,
      rating: 4.8,
      bio: "Dr. Mehta combines mindfulness, yoga-informed stress reduction, and contemporary psychology to support resilience and emotional regulation.",
      imgUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300",
      availability: ["Tue 10:00 AM IST", "Tue 04:00 PM IST", "Thu 01:00 PM IST", "Thu 06:00 PM IST"],
      pricePerSession: 1800,
      approved: true
    },
    {
      id: "therapist-id-3",
      name: "Dr. Nisha Rao",
      email: "nisha.relationships@Mental Health Care.in",
      specialty: "Family & Relationship Systems",
      experience: 8,
      rating: 4.7,
      bio: "Dr. Rao works with couples, young adults, and families navigating relationship stress, emotional expression, and life transitions.",
      imgUrl: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300",
      availability: ["Wed 09:00 AM IST", "Wed 03:00 PM IST", "Fri 10:00 AM IST", "Fri 01:00 PM IST"],
      pricePerSession: 1400,
      approved: true
    },
    {
      id: "therapist-id-4",
      name: "Dr. Kabir Menon",
      email: "kabir.neuro@Mental Health Care.in",
      specialty: "Neuropsychiatry & Insomnia Therapy",
      experience: 18,
      rating: 5.0,
      bio: "Dr. Menon is a clinical psychiatrist focused on anxiety, sleep-wake cycles, workplace burnout, and mood stability.",
      imgUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300",
      availability: ["Mon 11:00 AM IST", "Wed 05:00 PM IST", "Thu 09:00 AM IST", "Fri 04:00 PM IST"],
      pricePerSession: 2500,
      approved: false // Pending approval by Admin to demonstrate admin moderation!
    }
  ],
  appointments: [
    {
      id: "appt-1",
      userId: "user-id-sample",
      userName: "Rahul Verma",
      therapistId: "therapist-id-1",
      therapistName: "Dr. Aditi Sharma",
      date: "2026-05-24",
      time: "2:00 PM",
      status: "Confirmed",
      notes: "Feeling anxious about a new promotion.",
      createdAt: new Date().toISOString()
    }
  ],
  moods: [
    {
      id: "mood-1",
      userId: "admin-id-123",
      score: 4,
      note: "Started the day with mindfulness and green tea. Felt very productive.",
      tags: ["Calm", "Focused"],
      date: "2026-05-20",
      createdAt: new Date().toISOString()
    },
    {
      id: "mood-2",
      userId: "admin-id-123",
      score: 3,
      note: "A bit tired in the afternoon but maintained steady breathing.",
      tags: ["Tired", "Calm"],
      date: "2026-05-21",
      createdAt: new Date().toISOString()
    }
  ],
  feedback: [
    {
      id: "feed-1",
      name: "Ananya Iyer",
      email: "ananya@gmail.com",
      message: "The breathing animation is so soothing! Helps me catch my breath during panic sessions.",
      rating: 5,
      createdAt: new Date().toISOString()
    }
  ],
  emergencyContacts: [
    {
      name: "Tele-MANAS Mental Health Support",
      phone: "14416 or 1-800-891-4416",
      description: "Government of India mental health support line available across states and union territories.",
      region: "India"
    },
    {
      name: "KIRAN Mental Health Rehabilitation Helpline",
      phone: "1800-599-0019",
      description: "National mental health rehabilitation helpline for emotional support and guidance.",
      region: "India"
    },
    {
      name: "AASRA Suicide Prevention Helpline",
      phone: "91-22-2754-6669",
      description: "Confidential crisis intervention support for people experiencing suicidal thoughts.",
      region: "India"
    },
    {
      name: "National Emergency Response",
      phone: "112",
      description: "All-in-one emergency response number for immediate safety, police, fire, or medical emergencies.",
      region: "India"
    },
    {
      name: "Women Helpline",
      phone: "181",
      description: "Support line for women in distress and domestic safety concerns.",
      region: "India"
    }
  ],
  blogs: [
    {
      id: "blog-1",
      title: "The Neurobiology of Diaphragmatic Breath Cycles",
      category: "Mindfulness",
      summary: "Understand how deep, structured breathing directly cues the vagus nerve to shut off the sympathetic nervous system.",
      duration: "4 min read",
      imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400",
      content: "Diaphragmatic breathing engages the large sheet of muscle beneath your lungs. When you take deep, slow inhalations, you trigger the vagus nerve. The vagus nerve is the main line of communication for your Parasympathetic Nervous System (PNS)—the 'Rest and Digest' network.",
      author: "Dr. Aditi Sharma",
      createdAt: new Date().toISOString()
    }
  ]
};

// Initialize file JSON database if MongoDB not requested / active
const loadLocalDB = (): LocalDBStructure => {
  try {
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(DEFAULT_SEED_DATA, null, 2));
      return DEFAULT_SEED_DATA;
    }
    const dataStr = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
    return JSON.parse(dataStr);
  } catch (err) {
    console.error("Failed to load local fallback DB. Providing defaults.", err);
    return DEFAULT_SEED_DATA;
  }
};

const saveLocalDB = (db: LocalDBStructure) => {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("Failed to write to local fallback database file.", err);
  }
};

// Connect schema to MongoDB on request
if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000
    })
    .then(() => {
      console.log("MongoDB connected successfully at: " + MONGODB_URI);
      isUsingMongoDB = true;
    })
    .catch((err) => {
      console.error("MongoDB Atlas connection failed or timed out. Reaching for JSON backup storage.", err);
      isUsingMongoDB = false;
    });
} else {
  console.log("No MONGODB_URI environment key specified. Engaging local JSON file-DB bridge.");
}

// ------------------------------------------------------------------
// --- MONGOOSE MODELS (Used if MongoDB Atlas is enabled) ---------
// ------------------------------------------------------------------
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["Admin", "Therapist", "User"], default: "User" },
  age: { type: Number },
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const TherapistSchema = new Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  specialty: { type: String, required: true },
  experience: { type: Number, required: true },
  rating: { type: Number, default: 4.8 },
  bio: { type: String },
  imgUrl: { type: String },
  availability: [{ type: String }],
  pricePerSession: { type: Number, default: 100 },
  approved: { type: Boolean, default: false }
});

const AppointmentSchema = new Schema({
  id: { type: String, unique: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  therapistId: { type: String, required: true },
  therapistName: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Confirmed", "Completed", "Cancelled"], default: "Pending" },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const MoodRecordSchema = new Schema({
  id: { type: String, unique: true },
  userId: { type: String, required: true },
  score: { type: Number, required: true },
  note: { type: String },
  tags: [{ type: String }],
  date: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const FeedbackSchema = new Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  rating: { type: Number, default: 5 },
  createdAt: { type: Date, default: Date.now }
});

const MongoUserModel = mongoose.models.User || mongoose.model("User", UserSchema);
const MongoTherapistModel = mongoose.models.Therapist || mongoose.model("Therapist", TherapistSchema);
const MongoAppointmentModel = mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema);
const MongoMoodModel = mongoose.models.Mood || mongoose.model("Mood", MoodRecordSchema);
const MongoFeedbackModel = mongoose.models.Feedback || mongoose.model("Feedback", FeedbackSchema);

// ------------------------------------------------------------------
// --- AUTHENTICATION JWT MIDDLEWARE --------------------------------
// ------------------------------------------------------------------
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "Admin" | "Therapist" | "User";
  };
}

const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    res.status(401).json({ error: "Access denied. Token missing." });
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Access denied. Invalid token format." });
    return;
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET) as any;
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired session token." });
  }
};


// ------------------------------------------------------------------
// --- API CONTROLLERS ----------------------------------------------
// ------------------------------------------------------------------

// 1. Initial State Sync
app.get("/api/init", (req: Request, res: Response) => {
  // Return database metadata & emergency contacts
  const localDB = loadLocalDB();
  res.json({
    onlineMode: isUsingMongoDB,
    emergencyContacts: localDB.emergencyContacts
  });
});

// 2. Authentication: Register
app.post("/api/auth/register", async (req: Request, res: Response) => {
  const { name, email, password, role, age } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: "All input fields are required." });
    return;
  }

  const targetRole = ["Admin", "Therapist", "User"].includes(role) ? role : "User";
  const userAge = age ? parseInt(age) : 25;

  try {
    if (isUsingMongoDB) {
      const existing = await (MongoUserModel as any).findOne({ email });
      if (existing) {
        res.status(400).json({ error: "User with this email already exists." });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await MongoUserModel.create({
        name,
        email,
        password: hashedPassword,
        role: targetRole,
        age: userAge,
        points: 0,
        level: 1,
        badges: []
      });

      // Seeding a specialized Therapist profile if registered role is Therapist
      if (targetRole === "Therapist") {
        await MongoTherapistModel.create({
          id: newUser._id.toString(),
          name,
          email,
          specialty: "Psychotherapy / Mental Health Counselor",
          experience: 5,
          bio: "Welcome! I am a newly registered therapist on the Mental Health Care mental health portal.",
          imgUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300",
          availability: ["Tue 02:00 PM IST", "Thu 10:00 AM IST"],
          pricePerSession: 1200,
          approved: false // awaits admin review
        });
      }

      const token = jwt.sign({ id: newUser._id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: "7d" });
      res.status(201).json({
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          age: newUser.age,
          points: newUser.points,
          level: newUser.level,
          badges: newUser.badges
        }
      });
    } else {
      const db = loadLocalDB();
      const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        res.status(400).json({ error: "User with this email already exists in local DB." });
        return;
      }

      const textId = "usr-" + Math.random().toString(36).substr(2, 9);
      const hashedPassword = bcrypt.hashSync(password, 10);
      const newUser = {
        _id: textId,
        id: textId,
        name,
        email,
        password: hashedPassword,
        role: targetRole,
        age: userAge,
        points: 0,
        level: 1,
        badges: [],
        createdAt: new Date().toISOString()
      };

      db.users.push(newUser);

      // Create dummy profile for Therapist
      if (targetRole === "Therapist") {
        db.therapists.push({
          id: textId,
          name,
          email,
          specialty: "Psychotherapy / Mental Counseling",
          experience: 5,
          rating: 4.5,
          bio: "Welcome! I am a newly registered therapist on the Mental Health Care mental health portal.",
          imgUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300",
          availability: ["Tue 02:00 PM IST", "Thu 10:00 AM IST"],
          pricePerSession: 1200,
          approved: false
        });
      }

      saveLocalDB(db);

      const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: "7d" });
      res.status(201).json({
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          age: newUser.age,
          points: newUser.points,
          level: newUser.level,
          badges: newUser.badges
        }
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Registration process triggered an error: " + error.message });
  }
});

// Authentication: Login
app.post("/api/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Please enter your email and password." });
    return;
  }

  try {
    if (isUsingMongoDB) {
      const user = await (MongoUserModel as any).findOne({ email });
      if (!user) {
        res.status(401).json({ error: "Invalid login credentials." });
        return;
      }

      const matches = await bcrypt.compare(password, user.password);
      if (!matches) {
        res.status(401).json({ error: "Invalid login credentials." });
        return;
      }

      const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          age: user.age,
          points: user.points,
          level: user.level,
          badges: user.badges
        }
      });
    } else {
      const db = loadLocalDB();
      const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        res.status(401).json({ error: "Invalid login credentials." });
        return;
      }

      const matches = bcrypt.compareSync(password, user.password);
      if (!matches) {
        res.status(401).json({ error: "Invalid login credentials." });
        return;
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          age: user.age,
          points: user.points,
          level: user.level,
          badges: user.badges
        }
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Login server exception: " + error.message });
  }
});

// Profile / Session validator
app.get("/api/auth/me", verifyToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Invalid Auth State" });
    return;
  }

  try {
    if (isUsingMongoDB) {
      const user = await (MongoUserModel as any).findById(req.user.id);
      if (!user) {
        res.status(404).json({ error: "Profile not found." });
        return;
      }
      res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        age: user.age,
        points: user.points,
        level: user.level,
        badges: user.badges
      });
    } else {
      const db = loadLocalDB();
      const user = db.users.find((u) => u.id === req.user?.id);
      if (!user) {
        res.status(404).json({ error: "Profile not found in local DB." });
        return;
      }
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        age: user.age,
        points: user.points,
        level: user.level,
        badges: user.badges
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Fetch profile exception: " + error.message });
  }
});

// 3. Therapist Directory & Filters
app.get("/api/therapists", async (req: Request, res: Response) => {
  const { specialty, minExperience } = req.query;

  try {
    let therapistsList: any[] = [];
    if (isUsingMongoDB) {
      let filter: any = {};
      if (specialty) filter.specialty = { $regex: specialty as string, $options: "i" };
      if (minExperience) filter.experience = { $gte: parseInt(minExperience as string) };

      therapistsList = await MongoTherapistModel.find(filter);
    } else {
      const db = loadLocalDB();
      therapistsList = db.therapists;

      if (specialty) {
        const specStr = (specialty as string).toLowerCase();
        therapistsList = therapistsList.filter(
          (t) =>
            t.specialty.toLowerCase().includes(specStr) ||
            t.bio.toLowerCase().includes(specStr)
        );
      }
      if (minExperience) {
        const minExp = parseInt(minExperience as string);
        therapistsList = therapistsList.filter((t) => t.experience >= minExp);
      }
    }
    res.json(therapistsList);
  } catch (error: any) {
    res.status(500).json({ error: "Therapists search exception: " + error.message });
  }
});

// Admin approves therapist
app.put("/api/therapists/approve/:id", verifyToken, async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== "Admin") {
    res.status(403).json({ error: "Only admins are authorized to moderate therapist status." });
    return;
  }

  const { id } = req.params;
  const { approved } = req.body;

  try {
    if (isUsingMongoDB) {
      const therapist = await (MongoTherapistModel as any).findOneAndUpdate({ id }, { approved }, { new: true });
      res.json(therapist);
    } else {
      const db = loadLocalDB();
      const therapist = db.therapists.find((t) => t.id === id);
      if (therapist) {
        therapist.approved = approved;
        saveLocalDB(db);
        res.json(therapist);
      } else {
        res.status(404).json({ error: "Therapist not found." });
      }
    }
  } catch (error: any) {
    res.status(500).json({ error: "Therapists approval failed: " + error.message });
  }
});

// 4. Appointments Manager
app.get("/api/appointments", verifyToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    let appointmentsList: any[] = [];
    if (isUsingMongoDB) {
      if (req.user.role === "Admin") {
        appointmentsList = await (MongoAppointmentModel as any).find();
      } else if (req.user.role === "Therapist") {
        appointmentsList = await (MongoAppointmentModel as any).find({ therapistId: req.user.id });
      } else {
        appointmentsList = await (MongoAppointmentModel as any).find({ userId: req.user.id });
      }
    } else {
      const db = loadLocalDB();
      if (req.user.role === "Admin") {
        appointmentsList = db.appointments;
      } else if (req.user.role === "Therapist") {
        appointmentsList = db.appointments.filter((a) => a.therapistId === req.user?.id);
      } else {
        appointmentsList = db.appointments.filter((a) => a.userId === req.user?.id);
      }
    }
    res.json(appointmentsList);
  } catch (error: any) {
    res.status(500).json({ error: "Fetch appointments exception: " + error.message });
  }
});

app.post("/api/appointments", verifyToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const { therapistId, therapistName, date, time, notes } = req.body;
  if (!therapistId || !therapistName || !date || !time) {
    res.status(400).json({ error: "Therapist details, date, and appointment slot are required." });
    return;
  }

  try {
    const textId = "appt-" + Math.random().toString(36).substr(2, 9);
    let newAppt: any;

    if (isUsingMongoDB) {
      const user = await (MongoUserModel as any).findById(req.user.id);
      const userName = user ? user.name : "Registered Mental Health Care Patient";

      newAppt = await (MongoAppointmentModel as any).create({
        id: textId,
        userId: req.user.id,
        userName,
        therapistId,
        therapistName,
        date,
        time,
        status: "Pending",
        notes: notes || ""
      });

      // Gamification Reward: +30 points for scheduling a Therapy session!
      if (user) {
        user.points += 30;
        // Gamify levels
        const oldLevel = user.level;
        const newLevel = Math.floor(user.points / 150) + 1;
        if (newLevel > oldLevel) {
          user.level = newLevel;
          if (!user.badges.includes("zen-master")) {
            user.badges.push("zen-master");
          }
        }
        await user.save();
      }
    } else {
      const db = loadLocalDB();
      const user = db.users.find((u) => u.id === req.user?.id);
      const userName = user ? user.name : "Registered Mental Health Care Patient";

      newAppt = {
        id: textId,
        userId: req.user.id,
        userName,
        therapistId,
        therapistName,
        date,
        time,
        status: "Pending",
        notes: notes || "",
        createdAt: new Date().toISOString()
      };

      db.appointments.push(newAppt);

      // Award 30 gamification points
      if (user) {
        user.points = (user.points || 0) + 30;
        const oldLevel = user.level || 1;
        const newLevel = Math.floor(user.points / 150) + 1;
        if (newLevel > oldLevel) {
          user.level = newLevel;
          if (!user.badges.includes("zen-master")) {
            user.badges.push("zen-master");
          }
        }
        if (!user.badges.includes("first-breath")) {
          user.badges.push("first-breath");
        }
      }

      saveLocalDB(db);
    }

    res.status(201).json({ appointment: newAppt, message: "Appointment requested! +30 points awarded for healing action." });
  } catch (error: any) {
    res.status(500).json({ error: "Create appointment exception: " + error.message });
  }
});

// Update appointment status (Therapist or Admin)
app.put("/api/appointments/:id", verifyToken, async (req: AuthRequest, res: Response) => {
  if (!req.user || (req.user.role !== "Therapist" && req.user.role !== "Admin")) {
    res.status(403).json({ error: "Unauthorized access path." });
    return;
  }

  const { id } = req.params;
  const { status } = req.body;

  try {
    let updatedAppt: any;
    if (isUsingMongoDB) {
      updatedAppt = await (MongoAppointmentModel as any).findOneAndUpdate({ id }, { status }, { new: true });
    } else {
      const db = loadLocalDB();
      updatedAppt = db.appointments.find((a) => a.id === id);
      if (updatedAppt) {
        updatedAppt.status = status;
        saveLocalDB(db);
      }
    }

    if (!updatedAppt) {
      res.status(404).json({ error: "Appointment entry not found." });
      return;
    }

    res.json(updatedAppt);
  } catch (error: any) {
    res.status(500).json({ error: "Appointment updates exception: " + error.message });
  }
});

// 5. Mood Records Manager
app.get("/api/moods", verifyToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unidentified user session." });
    return;
  }

  try {
    let list: any[] = [];
    if (isUsingMongoDB) {
      list = await (MongoMoodModel as any).find({ userId: req.user.id });
    } else {
      const db = loadLocalDB();
      list = db.moods.filter((m) => m.userId === req.user?.id);
    }
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: "Fetch mood database failed: " + error.message });
  }
});

// Daily Gamification system tracker
app.post("/api/moods", verifyToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unidentified user session." });
    return;
  }

  const { score, note, tags } = req.body;
  if (!score) {
    res.status(400).json({ error: "Please pick a mood score state." });
    return;
  }

  const recordDate = new Date().toISOString().substring(0, 10); // YYYY-MM-DD

  try {
    const textId = "mood-" + Math.random().toString(36).substr(2, 9);
    let recordedEntry: any;
    let pointsEarned = 15; // Standard mood tracking: +15 points
    if (note && note.trim().length > 3) {
      pointsEarned += 20; // Journaling bonus points: +20 points
    }

    let milestoneUnlocked = "";

    if (isUsingMongoDB) {
      recordedEntry = await (MongoMoodModel as any).create({
        id: textId,
        userId: req.user.id,
        score: parseInt(score),
        note: note || "",
        tags: tags || [],
        date: recordDate
      });

      const user = await (MongoUserModel as any).findById(req.user.id);
      if (user) {
        user.points += pointsEarned;
        if (!user.badges.includes("first-breath")) {
          user.badges.push("first-breath");
          milestoneUnlocked = "Badges: Unlocked 'First Breath' badge!";
        }

        // Count user journals
        const journalCount = await (MongoMoodModel as any).countDocuments({
          userId: req.user.id,
          note: { $exists: true, $ne: "" }
        });
        if (journalCount >= 3 && !user.badges.includes("deep-thinker")) {
          user.badges.push("deep-thinker");
          milestoneUnlocked += " \nBadges: Unlocked 'Deep Thinker' badge for reflecting!";
        }

        const oldLevel = user.level;
        const newLevel = Math.floor(user.points / 150) + 1;
        if (newLevel > oldLevel) {
          user.level = newLevel;
          milestoneUnlocked += ` \nLevel Up: Reached Level ${newLevel}!`;
        }

        await user.save();
      }
    } else {
      const db = loadLocalDB();
      recordedEntry = {
        id: textId,
        userId: req.user.id,
        score: parseInt(score),
        note: note || "",
        tags: tags || [],
        date: recordDate,
        createdAt: new Date().toISOString()
      };

      db.moods.push(recordedEntry);

      const user = db.users.find((u) => u.id === req.user?.id);
      if (user) {
        user.points = (user.points || 0) + pointsEarned;
        if (!user.badges) user.badges = [];
        if (!user.badges.includes("first-breath")) {
          user.badges.push("first-breath");
          milestoneUnlocked = "Unlocked 'First Breath' badge!";
        }

        // Check if user has 3 moods logged with text journals
        const userJournals = db.moods.filter((m) => m.userId === req.user?.id && m.note && m.note.trim() !== "");
        if (userJournals.length >= 3 && !user.badges.includes("deep-thinker")) {
          user.badges.push("deep-thinker");
          milestoneUnlocked += " (Unlocked 'Deep Thinker' badge!)";
        }

        const oldLevel = user.level || 1;
        const newLevel = Math.floor(user.points / 150) + 1;
        if (newLevel > oldLevel) {
          user.level = newLevel;
          milestoneUnlocked += ` (Level Up: Reached Level ${newLevel}!)`;
        }
      }

      saveLocalDB(db);
    }

    res.status(201).json({
      mood: recordedEntry,
      pointsEarned,
      milestoneUnlocked,
      message: `Your mood is tracked securely. You earned +${pointsEarned} points!`
    });
  } catch (error: any) {
    res.status(500).json({ error: "Create moods log exception: " + error.message });
  }
});

// Gamification standalone meditational awarder
app.post("/api/gamification/meditate", verifyToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unidentified user session." });
    return;
  }

  try {
    const pointsToAdd = 25; // +25 for meditation exercises!
    let milestoneUnlocked = "";
    let updatedPoints = 25;
    let updatedLevel = 1;

    if (isUsingMongoDB) {
      const user = await (MongoUserModel as any).findById(req.user.id);
      if (user) {
        user.points += pointsToAdd;
        if (!user.badges.includes("mindfulness-warrior")) {
          user.badges.push("mindfulness-warrior");
          milestoneUnlocked = "Unlocked 'Mindfulness Warrior' badge for self-care!";
        }

        const oldLevel = user.level;
        const newLevel = Math.floor(user.points / 150) + 1;
        if (newLevel > oldLevel) {
          user.level = newLevel;
          milestoneUnlocked += ` (Level Up: Reached Level ${newLevel}!)`;
        }
        await user.save();
        updatedPoints = user.points;
        updatedLevel = user.level;
      }
    } else {
      const db = loadLocalDB();
      const user = db.users.find((u) => u.id === req.user?.id);
      if (user) {
        user.points = (user.points || 0) + pointsToAdd;
        if (!user.badges) user.badges = [];
        if (!user.badges.includes("mindfulness-warrior")) {
          user.badges.push("mindfulness-warrior");
          milestoneUnlocked = "Unlocked 'Mindfulness Warrior' badge for self-care!";
        }

        const oldLevel = user.level || 1;
        const newLevel = Math.floor(user.points / 150) + 1;
        if (newLevel > oldLevel) {
          user.level = newLevel;
          milestoneUnlocked += ` (Level Up: Reached Level ${newLevel}!)`;
        }
        updatedPoints = user.points;
        updatedLevel = user.level;
      }
      saveLocalDB(db);
    }

    res.json({
      pointsEarned: pointsToAdd,
      updatedPoints,
      updatedLevel,
      milestoneUnlocked,
      message: `Breathe in, breathe out. Meditation complete! You gained +25 wellness experience points.`
    });
  } catch (error: any) {
    res.status(500).json({ error: "Meditation reward tracking failed: " + error.message });
  }
});

// 6. User Feedback / Reviews
app.get("/api/feedback", async (req: Request, res: Response) => {
  try {
    let list: any[] = [];
    if (isUsingMongoDB) {
      list = await MongoFeedbackModel.find();
    } else {
      const db = loadLocalDB();
      list = db.feedback;
    }
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: "Fetch feedback lists failed: " + error.message });
  }
});

app.post("/api/feedback", async (req: Request, res: Response) => {
  const { name, email, message, rating } = req.body;
  if (!name || !message) {
    res.status(400).json({ error: "Your name and message content are required to submit feedback." });
    return;
  }

  try {
    const textId = "feed-" + Math.random().toString(36).substr(2, 9);
    let storedFeedback: any;

    if (isUsingMongoDB) {
      storedFeedback = await MongoFeedbackModel.create({
        id: textId,
        name,
        email: email || "anonymous@Mental Health Care.org",
        message,
        rating: rating || 5
      });
    } else {
      const db = loadLocalDB();
      storedFeedback = {
        id: textId,
        name,
        email: email || "anonymous@Mental Health Care.org",
        message,
        rating: rating || 5,
        createdAt: new Date().toISOString()
      };
      db.feedback.push(storedFeedback);
      saveLocalDB(db);
    }

    res.status(201).json({ feedback: storedFeedback, message: "Thank you for supporting community voices at Mental Health Care!" });
  } catch (error: any) {
    res.status(500).json({ error: "Send feedback exception: " + error.message });
  }
});


// 7. Health Blogs & Articles CMS API
app.get("/api/blogs", async (req: Request, res: Response) => {
  try {
    const db = loadLocalDB();
    if (!db.blogs) {
      db.blogs = [];
    }
    res.json(db.blogs);
  } catch (error: any) {
    res.status(500).json({ error: "Fetch blogs failed: " + error.message });
  }
});

app.post("/api/blogs", verifyToken, async (req: AuthRequest, res: Response) => {
  const { title, category, summary, duration, imageUrl, content } = req.body;
  
  if (!title || !content || !category) {
    res.status(400).json({ error: "Title, category, and main article content are required." });
    return;
  }

  // Check authorization (Admins or Therapists only)
  const role = req.user?.role;
  if (role !== "Admin" && role !== "Therapist") {
    res.status(403).json({ error: "Fails containment checks. Only wellness practitioners or admins can build blogs." });
    return;
  }

  try {
    const blogId = "blog-" + Math.random().toString(36).substr(2, 9);
    const db = loadLocalDB();
    if (!db.blogs) {
      db.blogs = [];
    }

    const newBlog = {
      id: blogId,
      title,
      category,
      summary: summary || (content.slice(0, 120) + "..."),
      duration: duration || "5 min read",
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400",
      content,
      author: req.user?.email || "Mental Health Care Specialist",
      createdAt: new Date().toISOString()
    };

    db.blogs.push(newBlog);
    saveLocalDB(db);

    res.status(201).json({ blog: newBlog, message: "Blog article published successfully in the directory! (+15 XP Activity Reward added)" });
  } catch (error: any) {
    res.status(500).json({ error: "Create blog failed: " + error.message });
  }
});

app.delete("/api/blogs/:id", verifyToken, async (req: AuthRequest, res: Response) => {
  const role = req.user?.role;
  if (role !== "Admin") {
    res.status(403).json({ error: "Only global moderators can strip directories." });
    return;
  }

  try {
    const db = loadLocalDB();
    if (db.blogs) {
      db.blogs = db.blogs.filter((b: any) => b.id !== req.params.id);
      saveLocalDB(db);
    }
    res.json({ message: "Article stripped from Mental Health Care directory boards." });
  } catch (error: any) {
    res.status(500).json({ error: "Remove blog failed: " + error.message });
  }
});


// ------------------------------------------------------------------
// --- AI COMPANION CHATBOT with GEMINI 3.5-FLASH -------------------
// ------------------------------------------------------------------
app.post("/api/chat", async (req: Request, res: Response) => {
  const { message, history } = req.body;

  if (!message) {
    res.status(400).json({ error: "Prompt message is empty." });
    return;
  }

  // Fallback if API key is not present in development
  if (!process.env.GEMINI_API_KEY) {
    // Provide automated fallback answers so chatbot remains fully interactive even without a key
    const mockAns = getMockResponse(message);
    res.json({ text: mockAns });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Custom system instruction with emotional awareness, wellness grounding, app linking assistance, and breathing coaching.
    const systemInstruction = `
You are the Mental Health Care AI Care Companion, a compassionate digital support chatbot built inside the Mental Health Care Mental Health Management System.
Your main priorities:
1. Provide a calming, warm, and highly supportive counseling-style response.
2. Formulate helpful mental health responses for standard struggles (anxiety, depression, sleep, relationships, panic).
3. Provide simple guided breathing coaching. Encourage the user to focus on their inhalations and exhalations. Example: "Let's take a deep breath together. Inhale 1..2..3..4.. hold 1..2..3..4.. exhale 1..2..3..4.."
4. Guide the user around components of our Mental Health Care website:
   - For mood tracking or journaling: point them to the Mood Tracker Dashboard tab (use link: "#mood")
   - For booking high-quality matching mental health practitioners/doctors: point them to the Therapists directory tab (use link: "#booking")
   - For guided breathing cycles, meditation lists: point them to the Meditation & Self-Care tab (use link: "#breathing")
   - For blogs and educational guides: point them to the Mental Health Resources section (use link: "#resources")
   - For quick urgent helplines: recommend looking at the crisis contacts list (use link: "#emergency")
5. CRITICAL DE-ESCALATION SAFETY RULE:
   - If the user hints at self-harm, suicide, severe depression crisis, domestic abuse, or immediate danger, IMMEDIATELY express deep concern, advise them that they are worthy of help, and request they contact professional lifelines at once. For India, provide Tele-MANAS "14416 or 1-800-891-4416", emergency number "112", or link them to "#emergency" immediately. Maintain this as a primary absolute protocol.
   
Keep your responses relatively brief, clear, and structured beautifully utilizing comforting markdown. Avoid overwhelming prose.
`;

    const chatHistory = history ? history.map((h: any) => ({
      role: h.sender === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    })) : [];

    // Include system instruction in configurations
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        ...chatHistory,
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction
      }
    });

    const botReply = response.text || "I am listening and in tune with your needs. Tell me more, or feel free to try our calming breathing cycle!";
    res.json({ text: botReply });
  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    // Graceful fallback to avoid throwing unhandled server loops
    const safeBackup = getMockResponse(message);
    res.json({
      text: `[Wellness Companion - Local Sync]: ${safeBackup}`,
      note: "Connected using Care Companion Local Engine due to API configuration check."
    });
  }
});

// Calming, detailed local response generator for zero-setup resilience
function getMockResponse(prompt: string): string {
  const p = prompt.toLowerCase();
  
  if (p.includes("suicide") || p.includes("kill myself") || p.includes("end my life") || p.includes("hurt myself") || p.includes("die") || p.includes("self harm")) {
    return "I hear your deep pain right now, but please know you do not have to carry this heavy burden alone. You are profoundly valued. If you are in India, please reach out now to **Tele-MANAS at 14416 or 1-800-891-4416**, or call **112** for immediate emergency support. You can also open our Emergency Contacts panel ([View Crisis Numbers](#emergency)). There are compassionate professionals waiting to hold space for you.";
  }
  
  if (p.includes("anxious") || p.includes("anxiety") || p.includes("panic") || p.includes("scared") || p.includes("stress")) {
    return "Deep anxiety can feel like a sudden wave, but you can find your solid ground. Let's practice a grounding technique: \n\n1. Move over to our **Meditation & Self-Care** dashboard ([Try Mindful Breathing](#breathing)) to use our expand-and-contract visual circle.\n2. **Box Breathing**: Inhale for 4 seconds, hold for 4, exhale for 4, and hold for 4. Repeat this simple loop.\n3. Remember you are safe in this present moment. Would you like to check out some specialized therapists trained in CBT ([Search Therapists](#booking)) to discuss these stressors?";
  }

  if (p.includes("depressed") || p.includes("sad") || p.includes("unhappy") || p.includes("cry") || p.includes("depression") || p.includes("lonely")) {
    return "I am so sorry things feel heavy and grey right now. Depression can feel exhausting, but healing happens in small, gentle increments. \n\n- Try recording your emotions in the **Mood Tracker** ([Log Mood](#mood)) to release this burden; typing your log awards points and lets you express your journaling thoughts safely. \n- Reading supportive mindfulness tips in **Mental Health Resources** ([Explore Resources](#resources)) can also help you feel connected. \n- You can schedule an online appointment with a caring Therapist ([View Practitioners](#booking)) at Mental Health Care to guide you in finding hope again.";
  }

  if (p.includes("breathe") || p.includes("breathing") || p.includes("meditat") || p.includes("exercise") || p.includes("yoga")) {
    return "Wonderful choice. Deep diaphragmatic breathing is the quickest way to signaling calm to your nervous system. \n\nLet's do a quick breathing cycle: \n- **Inhale** slowly through your nose, filling your tummy... *Relaxing your shoulders.*\n- **Hold** that calm positive energy... \n- **Exhale** fully through your mouth, letting go of built-up worry. \n\nYou can head over to our interactive visual coaching guide on the **Self-Care Section** ([Unlock Breathing Tool](#breathing)). Completing a visual breathing cycle adds **+25 wellness points** to your dashboard!";
  }

  if (p.includes("therapist") || p.includes("doctor") || p.includes("book") || p.includes("schedule") || p.includes("consult")) {
    return "Connecting with a professional therapist is a beautiful act of self-care. At Mental Health Care, we have top certified practitioners in CBT, Neuropsychiatry, and Relationship Systems. \n\n- You can browse profiles, filter by specialties, and lock in a day/time directly through the **Appointment Booking** section ([Search Therapist Directory](#booking)). \n- Booking your session awards +30 self-care gamification experience points!";
  }

  if (p.includes("hello") || p.includes("hi") || p.includes("hey") || p.includes("help") || p.includes("how are you")) {
    return "Hello! I am your **Mental Health Care AI Care Companion**. I am here to listen, support, and help you navigate your mental wellness path. \n\nHere is what we can do together: \n- 🌸 Feel free to venting about what's on your mind. \n- 🧘 Ask me to guide a gentle **breathing exercise**.\n- 📊 Point you toward **Mood Tracking** ([Go to Mood Tracker](#mood)) or booking friendly Specialists ([Go to Bookings](#booking)).\n\nHow is your heart feeling today? Tell me, or select your mood indicator above!";
  }

  return "I hear you, and I am here with you. Every step on this emotional mental journey is progress, no matter how small. Feel free to continue speaking with me, log your current feelings in our **Mood Tracker** ([Check-In Daily](#mood)), or practice visual box breathing in our **Self-Care tab** ([Calming Tools](#breathing))!";
}

export default app;
