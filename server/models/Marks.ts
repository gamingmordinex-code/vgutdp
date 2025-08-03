import mongoose, { Schema, Document } from 'mongoose';

export interface IMarks extends Document {
  _id: string;
  studentId: string;
  batchId: string;
  subject: string;
  weekNumber: number;
  year: number;
  marks: number;
  submittedBy: string;
  submittedAt: Date;
}

const marksSchema = new Schema<IMarks>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  batchId: {
    type: Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  weekNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 52
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2030
  },
  marks: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
marksSchema.index({ studentId: 1, year: 1 });
marksSchema.index({ batchId: 1, weekNumber: 1, year: 1 });
marksSchema.index({ submittedBy: 1 });

// Virtual for id
marksSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

export const Marks = mongoose.model<IMarks>('Marks', marksSchema);