import mongoose, { Schema, Document } from 'mongoose';

export interface IPendingUser extends Document {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'faculty' | 'student';
  // Student specific fields
  enrollmentId?: string;
  course?: 'B.Tech' | 'MCA' | 'MBA' | 'M.Tech' | 'BCA' | 'BBA';
  year?: number;
  // Faculty specific fields
  designation?: string;
  department?: string;
  // Status fields
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  remarks?: string;
}

const pendingUserSchema = new Schema<IPendingUser>({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 10,
    maxlength: 15
  },
  role: {
    type: String,
    enum: ['faculty', 'student'],
    required: true
  },
  // Student specific fields
  enrollmentId: {
    type: String,
    trim: true,
    uppercase: true,
    required: function() { return this.role === 'student'; }
  },
  course: {
    type: String,
    enum: ['B.Tech', 'MCA', 'MBA', 'M.Tech', 'BCA', 'BBA'],
    required: function() { return this.role === 'student'; }
  },
  year: {
    type: Number,
    min: 2020,
    max: 2030,
    required: function() { return this.role === 'student'; }
  },
  // Faculty specific fields
  designation: {
    type: String,
    trim: true,
    maxlength: 100,
    required: function() { return this.role === 'faculty'; }
  },
  department: {
    type: String,
    trim: true,
    maxlength: 100,
    required: function() { return this.role === 'faculty'; }
  },
  // Status fields
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
pendingUserSchema.index({ email: 1 });
pendingUserSchema.index({ phone: 1 });
pendingUserSchema.index({ status: 1 });
pendingUserSchema.index({ appliedAt: -1 });

// Virtual for id
pendingUserSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

export const PendingUser = mongoose.model<IPendingUser>('PendingUser', pendingUserSchema);