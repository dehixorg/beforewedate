import Link from 'next/link';
import { Users, FileText, LogOut } from 'lucide-react';
import { adminLogout } from '../actions';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800">BeforeWeDate</h1>
          <p className="text-xs text-gray-500 mt-1">Admin Panel</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/users" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition">
            <Users size={20} />
            <span className="font-medium">Users</span>
          </Link>
          <Link href="/reports" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition">
            <FileText size={20} />
            <span className="font-medium">Reports</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <form action={adminLogout}>
            <button className="flex items-center gap-3 px-3 py-2 text-red-600 rounded-md hover:bg-red-50 transition w-full">
              <LogOut size={20} />
              <span className="font-medium">Log Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
