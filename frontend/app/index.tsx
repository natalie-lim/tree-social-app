import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";

export default function Index() {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If user is logged in, redirect to main app
  if (user) {
    return <Redirect href="/(tabs)/feed" />;
  }

  // If user is not logged in, redirect to frontpage (auth flow)
  return <Redirect href="/(auth)/frontpage" />;
}
