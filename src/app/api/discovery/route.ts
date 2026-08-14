import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/connect';
import { User } from '@/lib/db/models/User';
import { Profile } from '@/lib/db/models/Profile';
import { Interaction } from '@/lib/db/models/Interaction';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Get the current user
    const me = await getCurrentUser();
    if (!me) {
      return NextResponse.json({ error: 'Demo user not found' }, { status: 404 });
    }

    const myProfile = await Profile.findOne({ userId: me._id });
    if (!myProfile || !myProfile.location?.coordinates) {
      return NextResponse.json({ error: 'Profile location not set' }, { status: 400 });
    }

    // 2. Fetch users I have already interacted with (Liked or Passed)
    const myInteractions = await Interaction.find({ fromUserId: me._id }).select('toUserId');
    const interactedUserIds = myInteractions.map(interaction => interaction.toUserId);

    // 3. Build GeoSpatial Query
    const maxDistanceMeters = (myProfile.discoveryMaxDistance || 50) * 1609.34; // miles to meters
    const lng = myProfile.location.coordinates[0];
    const lat = myProfile.location.coordinates[1];

    // Find profiles near me, matching gender/age preferences, excluding interacted users, and MATCHING MODE
    const nearbyProfiles = await Profile.find({
      userId: { 
        $ne: me._id,
        $nin: interactedUserIds
      },
      mode: myProfile.mode || 'dating',
      gender: { $in: myProfile.interestedIn || [] },
      age: { 
        $gte: myProfile.discoveryAgeMin || 18, 
        $lte: myProfile.discoveryAgeMax || 99 
      },
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat]
          },
          $maxDistance: maxDistanceMeters
        }
      }
    });
    
    const results = [];

    for (const profile of nearbyProfiles) {
      // Fetch their user document for Trust Score
      const user = await User.findById(profile.userId);
      if (!user) continue;

      // Skip if they are not interested in my gender (Double Opt-In visibility filtering)
      if (
        profile.interestedIn?.length > 0 && 
        !profile.interestedIn.includes(myProfile.gender)
      ) {
        continue;
      }

      // Calculate shared interests loosely for the UI
      const myInterests = myProfile.interests || [];
      const theirInterests = profile.interests || [];
      const sharedInterests = myInterests.filter((i: string) => theirInterests.includes(i)).length;

      // Calculate Dynamic Trust Score
      let dynamicTrustScore = 50; // Base score
      if (user.isVerified) dynamicTrustScore += 20;
      if (profile.photos && profile.photos.length > 0) dynamicTrustScore += (profile.photos.length * 5); // +5 per photo
      if (profile.prompts && profile.prompts.length > 0) dynamicTrustScore += (profile.prompts.length * 3); // +3 per prompt
      if (profile.bio && profile.bio.length > 20) dynamicTrustScore += 5;
      dynamicTrustScore = Math.min(100, dynamicTrustScore); // Cap at 100

      // Calculate distance roughly for display (since we already used $nearSphere)
      // This is a simple euclidean mock for UI, real app would use the distance calculated by $nearSphere if using aggregate
      const dist = Math.floor(Math.random() * myProfile.discoveryMaxDistance) + 1; // mock distance in miles

      results.push({
        id: profile.userId.toString(),
        alias: `Anonymous Match #${profile.userId.toString().substring(18)}`,
        location: profile.locationApprox || 'Unknown',
        distance: dist,
        coordinates: profile.location?.coordinates || [0,0],
        bio: profile.bio || '',
        prompts: profile.prompts || [],
        age: profile.age,
        jobTitle: profile.jobTitle || '',
        photos: profile.photos || [],
        sharedInterests,
        trustScore: dynamicTrustScore,
        crossedPaths: Math.random() > 0.5, // Mock serendipity based on distance
      });
    }

    // Sort by shared interests for now
    results.sort((a, b) => b.sharedInterests - a.sharedInterests);

    return NextResponse.json({
      success: true,
      myUserId: me._id.toString(),
      myMode: myProfile.mode || 'dating',
      myCoordinates: [lng, lat],
      profiles: results,
    });
  } catch (error: any) {
    console.error('Discovery Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
