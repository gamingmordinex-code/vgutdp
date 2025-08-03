import mongoose, { Schema, Document } from 'mongoose';

export interface IFacultyAssignment extends Document {
  _id: string;
  facultyId: string;
  batchId: string;
  year: number;
  assignedAt: Date;
}

const facultyAssignmentSchema = new Schema<IFacultyAssignment>({
  facultyId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  batchId: {
    type: Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2030
  },
  assignedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
facultyAssignmentSchema.index({ facultyId: 1, year: 1 });
facultyAssignmentSchema.index({ batchId: 1 });
facultyAssignmentSchema.index({ facultyId: 1, batchId: 1 }, { unique: true });

// Virtual for id
facultyAssignmentSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

export const FacultyAssignment = mongoose.model<IFacultyAssignment>('FacultyAssignment', facultyAssignmentSchema);