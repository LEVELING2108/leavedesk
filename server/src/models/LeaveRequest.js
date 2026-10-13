import mongoose from 'mongoose';

export const LEAVE_TYPES = ['casual', 'sick', 'earned'];
export const LEAVE_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];
// Statuses that block the same dates from being requested again
export const ACTIVE_STATUSES = ['pending', 'approved'];

const DAY_MS = 24 * 60 * 60 * 1000;

const leaveRequestSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Snapshot of the employee's manager at creation, so reassignment doesn't move open requests
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    type: { type: String, enum: LEAVE_TYPES, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, min: 1 },
    reason: { type: String, trim: true, maxlength: 500, default: '' },
    status: { type: String, enum: LEAVE_STATUSES, default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewComment: { type: String, trim: true, maxlength: 500, default: '' },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

leaveRequestSchema.index({ employee: 1, startDate: 1, endDate: 1 });
leaveRequestSchema.index({ approver: 1, status: 1, createdAt: -1 });

leaveRequestSchema.pre('validate', function checkDates() {
  if (this.startDate && this.endDate) {
    if (this.endDate < this.startDate) {
      this.invalidate('endDate', 'endDate must be on or after startDate');
      return;
    }
    // Inclusive calendar days; dates are stored at UTC midnight
    this.days = Math.round((this.endDate - this.startDate) / DAY_MS) + 1;
  }
});

leaveRequestSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);
