import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Baby, Calendar, ShieldCheck, PieChart, CheckCircle2 } from "lucide-react";

export function MarriageMode() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Marriage & Family Hub</h2>
        <p className="text-gray-400">Your A2A agents are now managing your household, scheduling, and finances.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shared Calendar / Child Care */}
        <Card className="bg-white/5 border-white/10 p-6 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-indigo-400" />
            <h3 className="text-xl font-bold text-white">Household Schedule</h3>
          </div>
          
          <div className="space-y-4">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Baby className="w-5 h-5 text-indigo-400" />
                <div>
                  <p className="font-bold text-white">Daycare Pickup</p>
                  <p className="text-sm text-gray-400">Today, 4:30 PM</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-indigo-500/50 text-indigo-300">
                A2A: Assign to Partner
              </Button>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between opacity-70">
              <div>
                <p className="font-bold text-white">Anniversary Dinner</p>
                <p className="text-sm text-gray-400">Next Friday, 7:00 PM</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </Card>

        {/* Joint Finances */}
        <Card className="bg-white/5 border-white/10 p-6 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6">
            <PieChart className="w-6 h-6 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">Joint Finances (CROO)</h3>
          </div>
          
          <div className="flex justify-between items-end mb-8">
            <div>
              <p className="text-sm text-gray-400 mb-1">Shared Wallet Balance</p>
              <p className="text-3xl font-bold text-emerald-400">14,250 USDC</p>
            </div>
            <ShieldCheck className="w-8 h-8 text-white/20" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Monthly Mortgage Auto-Pay</span>
              <span className="text-white">-2,400 USDC</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Joint Savings Goal</span>
              <span className="text-emerald-400">On Track (85%)</span>
            </div>
          </div>
          
          <Button className="w-full mt-6 bg-emerald-500 hover:bg-emerald-600 text-white">
            View Full On-Chain Statement
          </Button>
        </Card>
      </div>
    </div>
  );
}
