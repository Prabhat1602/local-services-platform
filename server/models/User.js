const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');//new
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
   // --- NEW FIELDS FOR PASSWORD RESET ---
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    // --- END NEW FIELDS ---
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
// Generate JWT token method
userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: '1h', // Or whatever your token expiry is
  });
};
// --- NEW METHOD FOR GENERATING PASSWORD RESET TOKEN ---
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex'); // Generate random hex token

  // Hash token and save to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set token expire time (e.g., 15 minutes)
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken; // Return the unhashed token to send in email
};
// --- END NEW METHOD ---
module.exports = mongoose.model('User', UserSchema);