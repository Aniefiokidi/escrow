import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ["buyer", "seller", "admin"],
      default: "buyer"
    },
    trustScore: { type: Number, default: 50, min: 0, max: 100 },
    profile: {
      bio: { type: String, default: "" },
      phone: { type: String, default: "" },
      country: { type: String, default: "" },
      avatarUrl: { type: String, default: "" }
    },
    stats: {
      completedTransactions: { type: Number, default: 0 },
      disputesCount: { type: Number, default: 0 },
      lateDeliveries: { type: Number, default: 0 },
      avgRating: { type: Number, default: 0 },
      ratingsCount: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

userSchema.pre("save", async function preSave(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

userSchema.methods.matchPassword = function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
