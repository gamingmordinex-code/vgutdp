import mongoose, { Schema, Document } from 'mongoose';

export interface IOtpSession extends Document {
  _id: string;
  email: string;
  phone: string;
  otp: string;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const otpSessionSchema = new Schema<IOtpSession>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  otp: {
    type: String,
    required: true,
    length: 6
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
otpSessionSchema.index({ email: 1, phone: 1, otp: 1 });
otpSessionSchema.index({ isUsed: 1 });

// Virtual for id
otpSessionSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

export const OtpSession = mongoose.model<IOtpSession>('OtpSession', otpSessionSchema);