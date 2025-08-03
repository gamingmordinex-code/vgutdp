import mongoose, { Schema, Document } from 'mongoose';

export interface IBatch extends Document {
  _id: string;
  name: string;
  year: number;
  isActive: boolean;
  createdAt: Date;
}

const batchSchema = new Schema<IBatch>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2030
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
batchSchema.index({ name: 1 });
batchSchema.index({ year: 1 });
batchSchema.index({ isActive: 1 });

// Virtual for id
batchSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

export const Batch = mongoose.model<IBatch>('Batch', batchSchema);