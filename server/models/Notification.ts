import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  _id: string;
  title: string;
  message: string;
  toType: 'all' | 'faculty' | 'students' | 'specific_ids';
  recipientIds?: string[];
  isRead: boolean;
  createdBy: string;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  toType: {
    type: String,
    enum: ['all', 'faculty', 'students', 'specific_ids'],
    required: true
  },
  recipientIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
notificationSchema.index({ toType: 1 });
notificationSchema.index({ recipientIds: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ isRead: 1 });

// Virtual for id
notificationSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);