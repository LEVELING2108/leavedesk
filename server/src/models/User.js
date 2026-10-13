import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['employee', 'manager', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ROLES, default: 'employee', index: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    isActive: { type: Boolean, default: true },
    // SHA-256 of the current refresh token; rotated on every refresh, cleared on logout
    refreshTokenHash: { type: String, select: false, default: null },
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Hashes never leave the server, even if a query selected them
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.refreshTokenHash;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
