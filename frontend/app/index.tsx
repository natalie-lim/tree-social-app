import { Redirect } from "expo-router";
import { CuteLoading } from "../components/CuteLoading";
import { useAuth } from "../contexts/AuthContext";

export default function Index() {
  const { user, loading } = useAuth();

  // Show cute loading spinner while checking authentication state
  if (loading) {
    return (
      <CuteLoading 
        message="welcome to leaflet" 
        size="large" 
        showMessage={true} 
      />
    );
  }

  // If user is logged in, redirect to main app
  if (user) {
    return <Redirect href="/(tabs)/feed" />;
  }

  // If user is not logged in, redirect to frontpage (auth flow)
  return <Redirect href="/(auth)/frontpage" />;
}
