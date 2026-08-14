import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import { User } from '../src/lib/db/models/User';
import { Profile } from '../src/lib/db/models/Profile';
import { ConsentPolicy } from '../src/lib/db/models/ConsentPolicy';
import { Interaction } from '../src/lib/db/models/Interaction';
import { Match } from '../src/lib/db/models/Match';
import { Message } from '../src/lib/db/models/Message';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for Seeding...');

  // Clear existing collections
  await User.deleteMany({});
  await Profile.deleteMany({});
  await ConsentPolicy.deleteMany({});
  await Interaction.deleteMany({});
  await Match.deleteMany({});
  await Message.deleteMany({});
  console.log('Cleared existing collections.');

  const users = await User.create([
    { walletAddress: '0xME', trustScore: 85 },
    { walletAddress: '0xAlice', trustScore: 92 },
    { walletAddress: '0xBob', trustScore: 88 },
  ]);

  const [me, alice, bob] = users;

  await Profile.create([
    {
      userId: users[0]._id, // Demo user
      bio: 'Tech enthusiast. Looking for someone who understands my obscure references.',
      age: 26,
      gender: 'Male',
      interestedIn: ['Female', 'Non-binary'],
      height: '5\'10"',
      jobTitle: 'Software Engineer',
      education: 'B.S. Computer Science',
      drinking: 'Socially',
      smoking: 'Never',
      relationshipGoal: 'Long-term relationship',
      communicationStyle: 'Direct and honest',
      socialEnergy: 'Introverted but adaptable',
      interests: ['Coding', 'Coffee', 'Sci-Fi', 'Hiking'],
      datePreferences: ['Quiet Cafe', 'Museum', 'Walk in the park'],
      values: ['Honesty', 'Ambition', 'Empathy'],
      boundaries: ['No smoking', 'No heavy drinking'],
      locationApprox: 'Downtown',
      location: { type: 'Point', coordinates: [-74.0060, 40.7128] }, // NYC
      discoveryMaxDistance: 50,
      photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop']
    },
    {
      userId: users[1]._id,
      bio: 'Coffee addict and part-time photographer. Let\'s explore the city.',
      age: 24,
      gender: 'Female',
      interestedIn: ['Male', 'Female'],
      height: '5\'6"',
      jobTitle: 'Graphic Designer',
      education: 'B.F.A. Design',
      drinking: 'Socially',
      smoking: 'Never',
      relationshipGoal: 'Long-term relationship',
      communicationStyle: 'Expressive and thoughtful',
      socialEnergy: 'Extroverted',
      interests: ['Photography', 'Coffee', 'Art Galleries', 'Travel'],
      datePreferences: ['Art Gallery', 'Coffee shop', 'Concert'],
      values: ['Creativity', 'Open-mindedness', 'Kindness'],
      boundaries: ['No disrespect', 'No bad tippers'],
      locationApprox: 'Downtown',
      location: { type: 'Point', coordinates: [-74.0160, 40.7228] }, // NYC Close
      discoveryMaxDistance: 50,
      mode: 'dating',
      prompts: [
        { question: "A non-negotiable for me is...", answer: "Good communication and strong coffee." },
        { question: "I'm looking for...", answer: "Someone to explore all the hidden art galleries with." }
      ],
      photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop']
    },
    {
      userId: users[2]._id,
      bio: 'Fitness fanatic and outdoor adventurer. Looking for a workout buddy and more.',
      age: 28,
      gender: 'Female',
      interestedIn: ['Male'],
      height: '5\'8"',
      jobTitle: 'Personal Trainer',
      education: 'B.S. Kinesiology',
      drinking: 'Rarely',
      smoking: 'Never',
      relationshipGoal: 'Something casual but open',
      communicationStyle: 'Direct and action-oriented',
      socialEnergy: 'High energy',
      interests: ['Hiking', 'Gym', 'Nutrition', 'Dogs'],
      datePreferences: ['Active date', 'Smoothie bar', 'Beach walk'],
      values: ['Health', 'Discipline', 'Loyalty'],
      boundaries: ['No laziness', 'No smokers'],
      locationApprox: 'Uptown',
      location: { type: 'Point', coordinates: [-73.9560, 40.7828] }, // NYC Farther
      discoveryMaxDistance: 50,
      mode: 'dating',
      prompts: [
        { question: "My personal hell is...", answer: "People who walk slowly in groups on the sidewalk." },
        { question: "We'll get along if...", answer: "You can keep up with my morning runs." }
      ],
      photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop']
    },
  ]);

  // Create Consent Policies for all
  for (const u of users) {
    await ConsentPolicy.create({
      userId: u._id,
      purpose: 'dating_compatibility',
      allowedFields: ['relationshipGoal', 'communicationStyle', 'socialEnergy', 'interests', 'drinking', 'smoking', 'education'],
      revealAfterMatchFields: ['locationApprox', 'photos', 'bio', 'jobTitle'],
      privateFields: [],
      identityReveal: false,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
    });
  }

  // Pre-seed a Like from Alice to Me so the demo is fun
  await Interaction.create({
    fromUserId: alice._id,
    toUserId: me._id,
    action: 'like'
  });

  // Pre-seed an existing Match with Bob (Bob is initiator)
  const match = await Match.create({
    users: [me._id, bob._id],
    initiatorId: bob._id, // Bob initiated
    isInitiated: true,
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours left
  });

  // Seed real Messages for that Match
  await Message.create([
    {
      matchId: match._id,
      senderId: bob._id,
      text: 'Hey there! Looks like we both value honest communication. How has your week been?'
    },
    {
      matchId: match._id,
      senderId: bob._id,
      text: 'System: Anonymous connection established. Identities are hidden. You have 30 minutes to evaluate your connection.',
      isAI: true
    }
  ]);

  console.log('Successfully seeded database with GeoSpatial Profiles.');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
