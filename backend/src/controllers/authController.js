import User from "../models/User.js";
import { generateToken } from "../utils.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({ name, email, password, role: role || "buyer" });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    trustScore: user.trustScore,
    token: generateToken(user._id)
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    trustScore: user.trustScore,
    profile: user.profile,
    token: generateToken(user._id)
  });
});

export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json(user);
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const { name, bio, phone, country, avatarUrl } = req.body;
  if (name) user.name = name;
  user.profile.bio = bio ?? user.profile.bio;
  user.profile.phone = phone ?? user.profile.phone;
  user.profile.country = country ?? user.profile.country;
  user.profile.avatarUrl = avatarUrl ?? user.profile.avatarUrl;

  await user.save();
  res.json(user);
});
