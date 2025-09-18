const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['user', 'provider', 'admin'], // Correctly defined role field
    default: 'user',
  },
  // --- CORRECTED: These fields are now top-level within the schema ---
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude] -> [longitude, latitude]
      default: [0, 0],
    },
  },
  providerStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Approved', // Default is 'Approved' so regular users are unaffected
  },
  earnings: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Ensure the 2dsphere index is defined on the top-level 'location' field
UserSchema.index({ location: '2dsphere' });

// Hash password before saving the user
UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) { // Check specifically for password modification
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Set providerStatus to 'Pending' if role is changed to 'provider' and it's a new provider
  // This needs to be careful not to reset existing providers
  if (this.isModified('role') && this.role === 'provider' && this.isNew) {
    this.providerStatus = 'Pending';
  } else if (this.isModified('role') && this.role === 'provider' && !this.providerStatus) {
      // If an existing user changes role to provider and providerStatus isn't set
      this.providerStatus = 'Pending';
  }
  // If role is changed *from* provider, you might want to reset providerStatus or earnings
  // (e.g., if changing from provider back to user) - this is a design decision.

  next();
});

// Method to compare entered password with the hashed one
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);