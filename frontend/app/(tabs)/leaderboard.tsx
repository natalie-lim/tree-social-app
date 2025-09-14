// app/(tabs)/leaderboard.tsx
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { firestoreService } from "../../services/firestore";

interface LeaderboardUser {
  id: string;
  name: string;
  points: number;
  totalSpots: number;
  totalReviews: number;
  averageRating: number;
}

const COLORS = {
  bg: "#FFF6EC",          // soft cream
  text: "#3E3A44",        // deep gray/purple
  subtext: "#5A5561",
  card: "#E8EFE8",        // light desaturated green card
  accent: "#6C966E",      // leaf green
  accentSoft: "#D7E4D8",  // very light green
  divider: "rgba(62,58,68,0.08)",
};

export default function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all users from the database
        const allUsers = await firestoreService.query('users', []);
        
        // Calculate points for each user (spots + reviews + average rating)
        const leaderboardUsers: LeaderboardUser[] = allUsers.map((user: any) => ({
          id: user.id,
          name: user.displayName || 'Anonymous',
          points: (user.totalSpots || 0) + (user.totalReviews || 0) + Math.round((user.averageRating || 0) * 10),
          totalSpots: user.totalSpots || 0,
          totalReviews: user.totalReviews || 0,
          averageRating: user.averageRating || 0
        }));

        // Sort by points descending
        const sorted = leaderboardUsers.sort((a, b) => b.points - a.points);
        setUsers(sorted);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.screen}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  // sort high→low and split podium vs rest
  const sorted = [...users].sort((a, b) => b.points - a.points);
  const podium = sorted.slice(0, 3);
  const others = sorted.slice(3);

  return (
    <View style={styles.screen}>
      <Text style={styles.header}>leaderboard</Text>

      {/* --- PODIUM --- */}
      <View style={styles.podiumWrap}>
        <View style={styles.podiumBg} />
        <View style={styles.podiumRow}>
          {/* 2nd */}
          <PodiumBlock
            place={2}
            label={podium[1]?.name ?? "-"}
            points={podium[1]?.points ?? 0}
            height={120}
          />
          {/* 1st */}
          <PodiumBlock
            place={1}
            label={podium[0]?.name ?? "-"}
            points={podium[0]?.points ?? 0}
            height={150}
            crowned
          />
          {/* 3rd */}
          <PodiumBlock
            place={3}
            label={podium[2]?.name ?? "-"}
            points={podium[2]?.points ?? 0}
            height={105}
          />
        </View>
      </View>

      {/* --- LIST --- */}
      <FlatList
        data={sorted}
        keyExtractor={(item, idx) => item.name + idx}
        style={{ marginTop: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item, index }) => (
          <RowCard rank={index + 1} name={item.name} points={item.points} />
        )}
        ListFooterComponent={<View style={{ height: 12 }} />}
      />
    </View>
  );
}

function PodiumBlock({
  place,
  label,
  points,
  height,
  crowned = false,
}: {
  place: 1 | 2 | 3;
  label: string;
  points: number;
  height: number;
  crowned?: boolean;
}) {
  return (
    <View style={[styles.podiumCol, { height }]}>
      {crowned && (
        <Ionicons name="trophy" size={22} style={styles.crown} />
      )}
      <View style={styles.badge}>
        <Text style={styles.badgeInitial}>{label?.[0]?.toUpperCase() ?? "-"}</Text>
      </View>
      <Text style={styles.podiumName} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.podiumPoints}>{points}</Text>
    </View>
  );
}

function RowCard({
  rank,
  name,
  points,
}: {
  rank: number;
  name: string;
  points: number;
}) {
  return (
    <View style={styles.rowCard}>
      <Text style={styles.rank}>{rank}</Text>
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}>
        {/* small text badge since no avatar */}
        <View style={styles.smallBadge}>
          <Text style={styles.smallBadgeText}>{name[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.rowName} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <Text style={styles.rowPoints}>{points}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
  flex: 1,
  backgroundColor: "#FFFAF0",
  paddingHorizontal: 16,
  paddingTop: 60,
  },
  header: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: "lowercase",
  },

  // Podium
  podiumWrap: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 8,
  },
  podiumBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.accentSoft,
    borderRadius: 20,
  },
  podiumRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    gap: 12,
  },
  podiumCol: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 12,
  },
  crown: {
    color: COLORS.accent,
    position: "absolute",
    top: 6,
  },
  badge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  badgeInitial: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
  },
  podiumName: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 14,
    marginTop: 2,
  },
  podiumPoints: {
    color: COLORS.subtext,
    fontWeight: "700",
    fontSize: 12,
    marginTop: 2,
  },

  // Rows
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  rank: {
    width: 28,
    textAlign: "center",
    fontWeight: "800",
    color: COLORS.accent,
    fontSize: 18,
  },
  smallBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  smallBadgeText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  rowName: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 16,
    flexShrink: 1,
  },
  rowPoints: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 16,
    marginLeft: "auto",
  },

  // Loading and Error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.subtext,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.subtext,
    textAlign: 'center',
  },
});
