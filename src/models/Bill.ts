import mongoose, { Schema, model, models } from 'mongoose';

const billSchema = new Schema({
  sn: { type: String, required: true },
  name: { type: String, required: true },
  amtPaid: { type: String, default: "0" },
  school: { type: String, required: true },
  schoolType: {
    type: String,
    enum: ['primary', 'secondary', 'university'],
    required: true
  },
  // Primary school terms
  primary1stTerm: { type: String, default: "" },
  primary2ndTerm: { type: String, default: "" },
  primary3rdTerm: { type: String, default: "" },
  // Secondary school terms
  secondary1stTerm: { type: String, default: "" },
  secondary2ndTerm: { type: String, default: "" },
  secondary3rdTerm: { type: String, default: "" },
  // University semesters
  university1stSemester: { type: String, default: "" },
  university2ndSemester: { type: String, default: "" },
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Prevent model recompilation in development
const Bill = models.Bill || model('Bill', billSchema);
export default Bill;