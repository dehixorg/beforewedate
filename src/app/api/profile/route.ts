import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/connect';
import { User } from '@/lib/db/models/User';
import { Profile } from '@/lib/db/models/Profile';
import { writeFile } from 'fs/promises';
import path from 'path';

import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    await connectToDatabase();
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const profile = await Profile.findOne({ userId: me._id });
    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const formData = await req.formData();
    
    // Parse fields
    const bio = formData.get('bio')?.toString();
    const age = Number(formData.get('age'));
    const gender = formData.get('gender')?.toString();
    const interestedInRaw = formData.get('interestedIn')?.toString();
    const interestedIn = interestedInRaw ? JSON.parse(interestedInRaw) : undefined;
    
    // Bumble Features
    const mode = formData.get('mode')?.toString();
    const promptsRaw = formData.get('prompts')?.toString();
    const prompts = promptsRaw ? JSON.parse(promptsRaw) : undefined;
    
    // GeoSpatial
    const lat = Number(formData.get('lat'));
    const lng = Number(formData.get('lng'));
    let location;
    if (!isNaN(lat) && !isNaN(lng)) {
      location = { type: 'Point', coordinates: [lng, lat] };
    }

    // Settings
    const discoveryMaxDistance = Number(formData.get('discoveryMaxDistance'));
    
    // Handle Images
    const newPhotoUrls: string[] = [];
    const files = formData.getAll('photos');
    for (const file of files) {
      if (file && typeof file === 'object' && 'arrayBuffer' in file) {
        const buffer = Buffer.from(await (file as File).arrayBuffer());
        const filename = `${Date.now()}_${(file as File).name.replace(/\s+/g, '_')}`;
        const filepath = path.join(process.cwd(), 'public/uploads', filename);
        await writeFile(filepath, buffer);
        newPhotoUrls.push(`/uploads/${filename}`);
      } else if (typeof file === 'string' && file.startsWith('/')) {
        // Keep existing URLs
        newPhotoUrls.push(file);
      }
    }

    // Build update object
    const updateData: any = {};
    if (bio !== undefined) updateData.bio = bio;
    if (!isNaN(age)) updateData.age = age;
    if (gender) updateData.gender = gender;
    if (interestedIn) updateData.interestedIn = interestedIn;
    if (mode) updateData.mode = mode;
    if (prompts) updateData.prompts = prompts;
    if (location) updateData.location = location;
    if (!isNaN(discoveryMaxDistance)) updateData.discoveryMaxDistance = discoveryMaxDistance;
    if (newPhotoUrls.length > 0) updateData.photos = newPhotoUrls;

    const profile = await Profile.findOneAndUpdate(
      { userId: me._id },
      { $set: updateData },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
