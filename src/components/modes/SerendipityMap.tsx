import { useState } from "react";
import { MapPin } from "lucide-react";

interface SerendipityMapProps {
  profiles: any[];
  myCoordinates: [number, number]; // [lng, lat]
  onMarkerClick: (profile: any) => void;
}

export function SerendipityMap({ profiles, myCoordinates, onMarkerClick }: SerendipityMapProps) {
  
  // Calculate relative position.
  // We assume the map view represents roughly a 50-mile radius (approx 0.7 degrees of lat/lng).
  // We map this to 0-100% on the CSS top/left.
  const getRelativePosition = (coordinates: [number, number]) => {
    if (!coordinates || !myCoordinates) return { top: '50%', left: '50%' };
    
    const [myLng, myLat] = myCoordinates;
    const [theirLng, theirLat] = coordinates;

    const maxDegreeDiff = 0.7; // Approx 50 miles

    let leftPct = 50 + ((theirLng - myLng) / maxDegreeDiff) * 50;
    let topPct = 50 - ((theirLat - myLat) / maxDegreeDiff) * 50; // Invert Y for screen coords

    // Clamp between 10% and 90% so they don't fall off screen
    leftPct = Math.max(10, Math.min(90, leftPct));
    topPct = Math.max(10, Math.min(90, topPct));

    return { top: `${topPct}%`, left: `${leftPct}%` };
  };

  return (
    <div className="relative w-full h-[600px] bg-[#050505] rounded-3xl overflow-hidden border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
      {/* Grid Pattern Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(to right, #4f4f4f 1px, transparent 1px), linear-gradient(to bottom, #4f4f4f 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Radar Sweep Animation */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-indigo-500/20 rounded-full">
        <div className="absolute inset-0 rounded-full border border-indigo-500/10 scale-75" />
        <div className="absolute inset-0 rounded-full border border-indigo-500/5 scale-50" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[2px] bg-gradient-to-r from-transparent to-indigo-500 origin-left animate-[spin_4s_linear_infinite]" />
        
        {/* The glowing center (You) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-500 rounded-full shadow-[0_0_30px_10px_rgba(99,102,241,0.5)]">
           <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-indigo-300 font-bold">YOU</div>
        </div>
      </div>

      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2">
        <MapPin className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-bold text-white">Crossed Paths: {profiles.length} Nearby</span>
      </div>

      {/* Markers */}
      {profiles.map((profile) => {
        const { top, left } = getRelativePosition(profile.coordinates);
        
        return (
          <button
            key={profile.id}
            onClick={() => onMarkerClick(profile)}
            className="absolute -translate-x-1/2 -translate-y-1/2 group transition-all duration-300 hover:z-50"
            style={{ top, left }}
          >
            <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
            
            <div className="relative w-8 h-8 bg-rose-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(244,63,94,0.6)] flex items-center justify-center text-white font-bold text-xs">
              {profile.alias.charAt(0)}
            </div>

            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-black border border-white/10 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
              <p className="text-xs font-bold text-white truncate">{profile.alias}</p>
              <p className="text-[10px] text-gray-400 truncate">{profile.location}</p>
              <p className="text-[9px] text-rose-400 font-mono mt-1">{profile.distance} mi away</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
