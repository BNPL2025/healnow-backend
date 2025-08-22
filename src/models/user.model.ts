import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import { IUser } from "../types/index.js";

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address"
      ]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false // Never include password in queries by default
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: {
        values: ["patient", "doctor"],
        message: "Role must be either 'patient' or 'doctor'"
      }
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"]
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"]
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
      transform: function (doc, ret) {
        // Remove sensitive fields from JSON output
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      transform: function (doc, ret) {
        // Remove sensitive fields from object output
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    // Hash the password using bcrypt
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12");
    this.password = await bcrypt.hash(this.password, saltRounds);

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    // Get the user with password field
    const userWithPassword = await User.findById(this._id).select("+password");
    if (!userWithPassword) return false;

    // Compare the candidate password with the stored hash
    return await bcrypt.compare(candidatePassword, userWithPassword.password);
  } catch (error) {
    return false;
  }
};

// Create indexes for better performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, createdAt: -1 });

// Create and export the User model
export const User = mongoose.model<IUser>("User", userSchema);