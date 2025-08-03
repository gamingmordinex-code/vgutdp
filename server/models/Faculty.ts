import mongoose, { Schema, Document } from 'mongoose';

export interface IFaculty extends Document {
  _id: string;
  userId: string;
  designation: string;
  department: string;
  createdAt: Date;
}

const facultySchema = new Schema<IFaculty>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  designation: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  department: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
facultySchema.index({ userId: 1 });
facultySchema.index({ department: 1 });

// Virtual for id
facultySchema.virtual('id').get(function() {
  return this._id.toHexString();
});

export const Faculty = mongoose.model<IFaculty>('Faculty', facultySchema);