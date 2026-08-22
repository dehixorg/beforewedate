import { supabaseAdmin } from '../../../../lib/supabase-admin';
import { revalidatePath } from 'next/cache';

export const revalidate = 0;

export default async function VenuesPage() {
  const { data: venues, error } = await supabaseAdmin
    .from('venues')
    .select('*')
    .order('created_at', { ascending: false });

  async function createVenue(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const tier = formData.get('tier') as string;
    const lat = parseFloat(formData.get('lat') as string);
    const lng = parseFloat(formData.get('lng') as string);
    
    await supabaseAdmin.from('venues').insert({
      name,
      partner_tier: tier,
      location: `POINT(${lng} ${lat})`
    });
    
    revalidatePath('/venues');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Partner Venues</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Venue</h2>
        <form action={createVenue} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input type="text" name="name" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700">Tier</label>
            <select name="tier" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700">Lat</label>
            <input type="number" step="any" name="lat" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700">Lng</label>
            <input type="number" step="any" name="lng" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
          </div>
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
            Create
          </button>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {venues?.map(v => (
              <tr key={v.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{v.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{v.partner_tier}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(v.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {(!venues || venues.length === 0) && (
              <tr><td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">No venues found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
