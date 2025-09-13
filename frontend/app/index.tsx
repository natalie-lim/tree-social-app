import { Redirect } from "expo-router";

export default function Index() {
  // Automatically redirect to your main tab
  return <Redirect href="/leaderboard" />;
}