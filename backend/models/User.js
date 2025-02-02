import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  emailAddress: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  location: { type: String, required: true },
  membership: {
    startDate: { type: Date, required: true },
    endDate: { type: Date }
  },
  subscriptionPlan: { type: String, required: true },
  renewalStatus: { type: String, enum: ['Active', 'Expired', 'Pending'], required: true },
  usageFrequency: { type: String, required: true },
  sentimentScore: { type: Number, min: -1, max: 1, default: null },
  churnCategory: { type: String, enum: ['Likely', 'Unlikely', 'Unknown'], default: null }
}, { timestamps: true });

// ✅ Check if the model already exists before defining it
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
