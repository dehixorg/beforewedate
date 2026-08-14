import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, Heart, MessageSquare, Flame } from "lucide-react";

export function CoupleMode() {
  const [argument, setArgument] = useState("");
  const [mediating, setMediating] = useState(false);
  const [resolution, setResolution] = useState<string | null>(null);

  const handleMediate = () => {
    if (!argument.trim()) return;
    setMediating(true);
    // Simulate hitting Azure OpenAI for mediation (Demo mode fallback logic)
    setTimeout(() => {
      setResolution(
        "I've analyzed the conflict based on your shared consent policies and past communication styles. It seems this stems from a misunderstanding regarding social energy levels. I recommend a 30-minute cool-off period followed by a structured conversation where Partner A speaks uninterrupted for 3 minutes."
      );
      setMediating(false);
    }, 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2 bg-gradient-to-br from-indigo-500/10 to-rose-500/10 border-indigo-500/30 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-8 h-8 text-rose-400" />
            <h2 className="text-2xl font-bold text-white">Relationship Coach</h2>
          </div>
          
          <p className="text-gray-300 mb-6">
            Your CROO A2A Agents are now actively monitoring your relationship health. Log arguments or disagreements below for unbiased, AI-driven mediation based on your mutual compatibility parameters.
          </p>

          <div className="space-y-4">
            <Input 
              value={argument}
              onChange={(e) => setArgument(e.target.value)}
              placeholder="What are you currently disagreeing about?"
              className="bg-black/50 border-white/10 text-white focus:border-rose-500 h-14"
            />
            <Button 
              onClick={handleMediate}
              disabled={mediating || !argument.trim()}
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {mediating ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Agent analyzing dispute... ($0.75 USDC)
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Trigger Argument Mediator
                </span>
              )}
            </Button>
          </div>

          {resolution && (
            <div className="mt-8 bg-black/40 border border-emerald-500/30 rounded-xl p-6">
              <div className="flex items-center gap-2 text-emerald-400 mb-3">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-bold">Mediator Agent Resolution</h3>
              </div>
              <p className="text-gray-300 italic">"{resolution}"</p>
              <div className="mt-4 flex justify-between items-center text-xs">
                <span className="text-gray-500">Transaction ID: 0x9f8...2a1</span>
                <span className="text-emerald-400">-0.75 USDC</span>
              </div>
            </div>
          )}
        </Card>

        <Card className="col-span-1 bg-white/5 border-white/10 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              Relationship Stats
            </h3>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-sm text-gray-400 mb-1">Time Dating</p>
                <p className="text-xl font-bold text-white">8 Months</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-sm text-gray-400 mb-1">Health Score</p>
                <p className="text-xl font-bold text-emerald-400">94 / 100</p>
              </div>
            </div>
          </div>
          <Button variant="outline" className="w-full mt-6 border-white/20 text-white hover:bg-white/10">
            Schedule Date Night
          </Button>
        </Card>
      </div>
    </div>
  );
}
