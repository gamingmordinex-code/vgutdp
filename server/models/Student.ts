import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  _id: string;
  userId: string;
  enrollmentId: string;
  course: 'B.Tech' | 'MCA' | 'MBA' | 'M.Tech' | 'BCA' | 'BBA';
  year: number;
  batchId?: string;
  createdAt: Date;
}

const studentSchema = new Schema<IStudent>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  enrollmentId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  course: {
    type: String,
    enum: ['B.Tech', 'MCA', 'MBA', 'M.Tech', 'BCA', 'BBA'],
    required: true
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2030
  },
  batchId: {
    type: Schema.Types.ObjectId,
    ref: 'Batch',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
studentSchema.index({ userId: 1 });
studentSchema.index({ enrollmentId: 1 });
studentSchema.index({ course: 1 });
studentSchema.index({ year: 1 });
studentSchema.index({ batchId: 1 });

// Virtual for id
studentSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

export const Student = mongoose.model<IStudent>('Student', studentSchema);