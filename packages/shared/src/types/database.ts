export type UserStatus = 'dating' | 'official' | 'paused';
export type ProfileMode = 'dating' | 'bff';
export type InteractionAction = 'like' | 'pass';
export type RelationshipState = 'dating' | 'official' | 'paused' | 'ended';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type CoachMemoryScope = 'user' | 'couple';
export type CoachMemoryKind = 'profile' | 'resolution' | 'session';

export interface User {
  id: string; // UUID
  phone: string;
  verified: boolean;
  face_verified: boolean;
  trust_score: number;
  status: UserStatus;
}

export interface Profile {
  user_id: string; // UUID
  mode: ProfileMode;
  location: any; // PostGIS Geometry Point
  embedding: number[]; // Vector(1536)
  photos: string[];
  prompts: any; // JSONB
  bio: string | null;
}

export interface Interaction {
  id: string; // UUID
  from_user_id: string; // UUID
  to_user_id: string; // UUID
  action: InteractionAction;
  ts: string; // TIMESTAMPTZ
}

export interface Match {
  id: string; // UUID
  user_a: string; // UUID
  user_b: string; // UUID
  initiator_id: string; // UUID
  is_initiated: boolean;
  expires_at: string; // TIMESTAMPTZ
  created_at: string; // TIMESTAMPTZ
}

export interface Message {
  id: string; // UUID
  match_id: string; // UUID
  sender_id: string | null; // UUID (null if System/AI)
  text: string;
  is_ai: boolean;
  moderation_flags: any; // JSONB
  created_at: string; // TIMESTAMPTZ
}

export interface Relationship {
  id: string; // UUID
  user_a: string; // UUID
  user_b: string; // UUID
  state: RelationshipState;
  entered_at: string; // TIMESTAMPTZ
  paused_at: string | null; // TIMESTAMPTZ
  ended_at: string | null; // TIMESTAMPTZ
  initiated_by: string | null; // UUID
}

export interface Venue {
  id: string; // UUID
  name: string;
  location: any; // PostGIS Geometry Point
  partner_tier: string;
  offers_dates: boolean;
}

export interface Event {
  id: string; // UUID
  venue_id: string; // UUID
  type: string;
  starts_at: string; // TIMESTAMPTZ
  geofence: any; // PostGIS Geometry Polygon
  beacon_id: string | null;
}

export interface EventAttendee {
  event_id: string; // UUID
  user_id: string; // UUID
  discovery_opt_in: boolean;
}

export interface Booking {
  id: string; // UUID
  relationship_id: string; // UUID
  venue_id: string; // UUID
  date_time: string; // TIMESTAMPTZ
  status: BookingStatus;
}

export interface CoachMemory {
  id: string; // UUID
  scope: CoachMemoryScope;
  ref_id: string; // UUID (user_id or relationship_id)
  kind: CoachMemoryKind;
  summary: string;
  embedding: number[]; // Vector(1536)
  created_at: string; // TIMESTAMPTZ
}

export interface Pulse {
  id: string; // UUID
  relationship_id: string; // UUID
  user_id: string; // UUID
  score: number;
  note: string | null;
  ts: string; // TIMESTAMPTZ
}
