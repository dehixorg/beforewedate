import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IProfile extends Document {
  userId: mongoose.Types.ObjectId;
  bio: string;
  age: number;
  gender: string;
  interestedIn: string[];
  height: string;
  jobTitle: string;
  education: string;
  drinking: string;
  smoking: string;
  photos: string[];
  prompts: { question: string; answer: string }[];
  mode: string; // 'dating' | 'bff' | 'bizz'
  relationshipGoal: string;
  communicationStyle: string;
  socialEnergy: string;
  interests: string[];
  datePreferences: string[];
  values: string[];
  boundaries: string[];
  locationApprox: string;
  // New GeoSpatial Data
  location?: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
  // Tinder Settings
  discoveryMaxDistance: number; // in miles/km
  discoveryAgeMin: number;
  discoveryAgeMax: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    bio: { type: String, default: '' },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    interestedIn: [{ type: String }],
    height: { type: String, default: '' },
    jobTitle: { type: String, default: '' },
    education: { type: String, default: '' },
    drinking: { type: String, default: '' },
    smoking: { type: String, default: '' },
    photos: [{ type: String }],
    prompts: [{
      question: { type: String, required: true },
      answer: { type: String, required: true },
    }],
    mode: { type: String, enum: ['dating', 'bff', 'bizz'], default: 'dating' },
    relationshipGoal: { type: String, required: true },
    communicationStyle: { type: String, required: true },
    socialEnergy: { type: String, required: true },
    interests: [{ type: String }],
    datePreferences: [{ type: String }],
    values: [{ type: String }],
    boundaries: [{ type: String }],
    locationApprox: { type: String },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    discoveryMaxDistance: { type: Number, default: 50 }, // default 50 miles
    discoveryAgeMin: { type: Number, default: 18 },
    discoveryAgeMax: { type: Number, default: 99 },
  },
  {
    timestamps: true,
  }
);

// Add 2dsphere index for GeoSpatial queries (Tinder distance algorithm)
ProfileSchema.index({ location: '2dsphere' });

export const Profile: Model<IProfile> = mongoose.models.Profile || mongoose.model<IProfile>('Profile', ProfileSchema);
