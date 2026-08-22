import { createAdminClient } from '@/lib/supabase';
import { suspendUser } from '@/app/actions';
import Link from 'next/link';

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();

  const [{ data: user }, { data: profile }] = await Promise.all([
    supabase.from('users').select('*').eq('id', params.id).single(),
    supabase.from('profiles').select('*').eq('user_id', params.id).single()
  ]);

  if (!user) {
    return <div className="p-8 text-red-600">User not found</div>;
  }

  // Suspend action bounded to this user's ID
  const suspendAction = suspendUser.bind(null, user.id);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/users" className="text-sm text-blue-600 hover:underline mb-2 inline-block">&larr; Back to users</Link>
          <h1 className="text-3xl font-bold text-gray-800">User: {user.phone}</h1>
          <p className="text-gray-500 mt-1">ID: {user.id}</p>
        </div>
        
        {user.status !== 'paused' ? (
          <form action={suspendAction}>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition">
              Suspend User
            </button>
          </form>
        ) : (
          <span className="bg-red-100 text-red-800 px-4 py-2 rounded-md font-medium">Suspended</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Info */}
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Core Info</h2>
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className="font-medium">{user.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Trust Score</span>
            <span className="font-medium text-blue-600">{user.trust_score}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Phone Verified</span>
            <span className="font-medium">{user.verified ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Face Verified</span>
            <span className="font-medium">{user.face_verified ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Joined</span>
            <span className="font-medium">{new Date(user.created_at).toLocaleString()}</span>
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Profile</h2>
          {profile ? (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500">Mode</span>
                <span className="font-medium capitalize">{profile.mode}</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Bio</span>
                <p className="text-gray-800 bg-gray-50 p-3 rounded">{profile.bio || 'No bio'}</p>
              </div>
              {profile.location && (
                <div>
                  <span className="text-gray-500 block mb-1">Location</span>
                  <p className="text-gray-800 font-mono text-sm">{profile.location}</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 italic">No profile created yet.</p>
          )}
        </div>
      </div>

      {/* Prompts & Photos */}
      {profile && (
        <div className="space-y-6 mt-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold border-b pb-4 mb-4">Prompts</h2>
            {Array.isArray(profile.prompts) && profile.prompts.length > 0 ? (
              <div className="space-y-4">
                {profile.prompts.map((p: any, i: number) => (
                  <div key={i}>
                    <p className="font-medium text-gray-800">{p.q}</p>
                    <p className="text-gray-600 mt-1">{p.a}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No prompts answered.</p>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold border-b pb-4 mb-4">Photos</h2>
            {Array.isArray(profile.photos) && profile.photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {profile.photos.map((url: string, i: number) => (
                  <img key={i} src={url} alt={`Photo ${i+1}`} className="w-full h-48 object-cover rounded-md" />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No photos uploaded.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
