import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  _id: string;
  batchId: string;
  weekNumber: number;
  year: number;
  data: Record<string, 'present' | 'absent'>;
  submittedBy: string;
  submittedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>({
  batchId: {
    type: Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
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
  data: {
    type: Map,
    of: String,
    required: true,
    validate: {
      validator: function(v: Map<string, string>) {
        for (let value of v.values()) {
          if (!['present', 'absent'].includes(value)) {
            return false;
          }
        }
        return true;
      },
      message: 'Attendance data must contain only "present" or "absent" values'
    }
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
attendanceSchema.index({ batchId: 1, weekNumber: 1, year: 1 }, { unique: true });
attendanceSchema.index({ submittedBy: 1 });

// Virtual for id
attendanceSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);