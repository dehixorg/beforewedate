"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (walletAddress: string) => {
    // Store globally in local storage for API routes to read via an interceptor or header
    // Since we are mocking, we will just set a cookie that the server can read.
    document.cookie = `walletAddress=${walletAddress}; path=/`;
    router.push("/dashboard");
  };

  const users = [
    { name: "Demo User (You)", address: "0xME", role: "Male" },
    { name: "Alice (Female)", address: "0xAlice", role: "Female" },
    { name: "Bob (Male)", address: "0xBob", role: "Male" }
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Select Account</h1>
          <p className="text-gray-400">Mock Wallet Connection for Testing</p>
        </div>

        <div className="grid gap-4">
          {users.map(u => (
            <Card 
              key={u.address}
              onClick={() => handleLogin(u.address)}
              className="bg-white/5 border-white/10 p-6 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <UserCircle2 className="w-10 h-10 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors">{u.name}</h3>
                  <p className="text-sm text-gray-400">{u.address} • {u.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
