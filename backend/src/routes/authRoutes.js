import express from "express";
import {
  getMyProfile,
  loginUser,
  registerUser,
  updateMyProfile
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);

export default router;
