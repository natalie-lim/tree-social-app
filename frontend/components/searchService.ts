// services/searchService.ts
import { Spot as SpotCardType } from "@/components/SpotCard";
import {
  collection,
  endAt,
  getDocs,
  orderBy,
  query as q,
  limit as qLimit,
  startAt,
} from "firebase/firestore";
import React from "react";
import { db } from "../config/firebase";

export type TabKey = "locations" | "members";

export type Spot = {
  id: string;
  name: string;
  name_lower?: string;
  city?: string;
  category?: string;
};

export type UserLite = {
  id: string;
  userId?: string; // Auth UID stored in the document
  handle?: string;
  username_lower?: string;
  displayName?: string;
  rank?: number;
  followers?: number;
};

export type ResultItem = {
  id: string;
  title: string;
  subtitle?: string;
  spotData?: SpotCardType;
};

// Utility function to convert string to title case
export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean) // remove extra spaces
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

// Strip diacritics + lowercase to match your `*_lower` fields
export function normalize(s: string): string {
  return (
    s
      .normalize("NFKD")
      // @ts-ignore — Unicode property escapes supported in Hermes/JSI RN 0.72+
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim()
  );
}

// Build location subtitle for search results
export function buildLocationSubtitle(s: SpotCardType): string | undefined {
  if (!s) return undefined;
  const bits = [];

  // Add location
  if (s.location?.address) {
    bits.push(s.location.address);
  }

  // Add category
  if (s.category) {
    const categoryFormatted = s.category.replace(/_/g, " ").toUpperCase();
    bits.push(categoryFormatted);
  }

  // Add rating if available
  if (s.averageRating > 0) {
    bits.push(`⭐ ${s.averageRating.toFixed(1)}`);
  }

  // Add verification badge
  if (s.isVerified) {
    bits.push("✓ Verified");
  }

  return bits.length ? bits.join(" • ") : undefined;
}

/**
 * Firestore prefix search
 * - locations -> collection("spots"), orderBy("name")
 * - members   -> collection("users"), orderBy("displayName")
 * Returns a unified ResultItem[]
 *
 * NOTE: Ensure you have composite indexes if you add extra where() later.
 */
export async function searchFirestore(
  tab: TabKey,
  queryInput: string,
  currentUserId?: string
): Promise<ResultItem[]> {
  if (!queryInput) return [];

  console.log("Searching for:", queryInput);

  if (tab === "locations") {
    const ref = collection(db, "spots");
    const formattedQuery = toTitleCase(queryInput);

    const queryRef = q(
      ref,
      orderBy("name"),
      startAt(formattedQuery),
      endAt(formattedQuery + "\uf8ff"),
      qLimit(20)
    );
    const snap = await getDocs(queryRef);

    return snap.docs.map((d) => {
      const data = d.data() as SpotCardType;
      // Ensure the spot data includes the document ID
      const spotDataWithId = {
        ...data,
        id: d.id || `spot_${Date.now()}_${Math.random()}`,
      };
      return {
        id: d.id || `spot_${Date.now()}_${Math.random()}`,
        title: data?.name || "(untitled)",
        subtitle: buildLocationSubtitle(data),
        spotData: spotDataWithId, // Add the full spot data with ID
      };
    });
  } else {
    const ref = collection(db, "users");
    const normalizedQuery = normalize(queryInput); // Convert to lowercase for comparison

    // Get users and filter client-side to handle mixed case displayNames
    const queryRef = q(ref, qLimit(100)); // Get more users to filter from
    const snap = await getDocs(queryRef);

    // Filter users where displayName starts with the normalized query (case-insensitive)
    // and exclude the current user if provided
    const filteredUsers = snap.docs
      .filter((d) => {
        const u = d.data() as UserLite;
        const displayName = u?.displayName || "";
        const normalizedDisplayName = normalize(displayName);
        const matchesQuery = normalizedDisplayName.startsWith(normalizedQuery);
        const isNotCurrentUser = !currentUserId || u?.userId !== currentUserId;

        // Debug logging
        console.log(
          `User ${d.id}: displayName="${displayName}", userId="${u?.userId}", matchesQuery=${matchesQuery}, isNotCurrentUser=${isNotCurrentUser}, currentUserId="${currentUserId}"`
        );

        return matchesQuery && isNotCurrentUser;
      })
      .slice(0, 20); // Limit to 20 results

    console.log("Found users:", filteredUsers.length);
    return filteredUsers.map((d) => {
      const u = d.data() as UserLite;
      const title = u?.handle ? `@${u.handle}` : u?.displayName || "(user)";
      const subtitle =
        u?.displayName && u?.handle
          ? `${u.displayName}`
          : u?.followers || u?.rank
          ? `Rank #${u.rank ?? "-"} • ${u.followers ?? 0} followers`
          : undefined;
      return {
        id: d.id || `user_${Date.now()}_${Math.random()}`,
        title,
        subtitle,
      };
    });
  }
}

// Hook for debounced values
export function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
