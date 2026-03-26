/**
 * Persist a run to the server leaderboard (registered users only).
 * @param {{ gameMode: string, score: number }} scoreData
 */
export async function submitScoreIfLoggedIn(scoreData) {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch("/api/scores", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        gameMode: scoreData.gameMode,
        score: scoreData.score,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn("Leaderboard submit failed:", err.error || res.status);
    }
  } catch (e) {
    console.warn("Leaderboard submit failed", e);
  }
}
