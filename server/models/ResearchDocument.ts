import mongoose, { Schema, Document } from 'mongoose';

export interface IResearchDocument extends Document {
  _id: string;
  studentId: string;
  batchId: string;
  title: string;
  fileUrl: string;
  remarks?: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: Date;
}

const researchDocumentSchema = new Schema<IResearchDocument>({
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
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  fileUrl: {
    type: String,
    required: true
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
researchDocumentSchema.index({ studentId: 1 });
researchDocumentSchema.index({ batchId: 1 });
researchDocumentSchema.index({ status: 1 });
researchDocumentSchema.index({ uploadedAt: -1 });

// Virtual for id
researchDocumentSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

export const ResearchDocument = mongoose.model<IResearchDocument>('ResearchDocument', researchDocumentSchema);