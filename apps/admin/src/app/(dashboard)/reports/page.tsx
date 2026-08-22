import { supabaseAdmin } from '../../../lib/supabase-admin';

export const revalidate = 0; // Disable cache for this page

export default async function ReportsPage() {
  const { data: reports, error } = await supabaseAdmin
    .from('reports')
    .select(`
      id,
      reason,
      message_context,
      status,
      created_at,
      reported_id,
      reporter_id
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return <div>Error loading reports: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Moderation Queue</h1>
      
      {reports && reports.length > 0 ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Context</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((r: any) => (
                <tr key={r.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {r.reason}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {r.message_context ? `"${r.message_context}"` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a href={`/users/${r.reported_id}`} className="text-indigo-600 hover:text-indigo-900">Review User</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
          <p className="mb-2">No active reports.</p>
          <p className="text-sm">When users flag abusive behavior or safety concerns, they will appear here for review.</p>
        </div>
      )}
    </div>
  );
}
