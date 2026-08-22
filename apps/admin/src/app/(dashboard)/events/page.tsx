import { supabaseAdmin } from '../../../../lib/supabase-admin';
import { revalidatePath } from 'next/cache';

export const revalidate = 0;

export default async function EventsPage() {
  const { data: events, error: eventsError } = await supabaseAdmin
    .from('events')
    .select('*, venues(name)')
    .order('start_time', { ascending: false });

  const { data: venues } = await supabaseAdmin
    .from('venues')
    .select('id, name')
    .order('name');

  async function createEvent(formData: FormData) {
    'use server';
    const venue_id = formData.get('venue_id') as string;
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    const start_time = formData.get('start_time') as string;
    const end_time = formData.get('end_time') as string;
    const radius = parseInt(formData.get('radius') as string) || 100;
    
    await supabaseAdmin.from('events').insert({
      venue_id,
      title,
      type,
      start_time: new Date(start_time).toISOString(),
      end_time: new Date(end_time).toISOString(),
      geofence_radius_meters: radius
    });
    
    revalidatePath('/events');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Partner Events</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Schedule Event</h2>
        <form action={createEvent} className="grid grid-cols-2 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700">Venue</label>
            <select name="venue_id" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
              {venues?.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Event Title</label>
            <input type="text" name="title" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type (e.g. mixer, speed-dating)</label>
            <input type="text" name="type" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Time</label>
            <input type="datetime-local" name="start_time" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Time</label>
            <input type="datetime-local" name="end_time" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Radius (meters)</label>
            <input type="number" name="radius" defaultValue={100} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div className="col-span-full">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
              Schedule Event
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Radius</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events?.map((e: any) => (
              <tr key={e.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{e.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.venues?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(e.start_time).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.geofence_radius_meters}m</td>
              </tr>
            ))}
            {(!events || events.length === 0) && (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No events found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
