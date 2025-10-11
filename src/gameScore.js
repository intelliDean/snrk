const submitGameScore = async (walletAddress, score, gameDuration = 0) => {
  try {
    const response = await fetch(`${backendUrl}/submit_score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        wallet_address: walletAddress,
        score,
        game_duration: gameDuration,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to submit score: ${errorData.error || "Unknown error"}`
      );
    }

    const data = await response.json();
    console.log("Submit score response:", data);
    setPlayerDetails({
      ...playerDetails,
      score: data.highest_score.toString(),
      totalScore: data.total_score,
      gamesPlayed: data.games_played,
    });
    return {
      success: true,
      data: {
        totalScore: data.total_score,
        gamesPlayed: data.games_played,
        highestScore: data.highest_score,
      },
    };
  } catch (error) {
    console.error("Error submitting game score:", error);
    setError(error.message);
    return { success: false, error: error.message };
  }
};

const getPlayerStats = async (walletAddress) => {
  try {
    const response = await fetch(
      `${backendUrl}/player_stats/${walletAddress}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to fetch player stats: ${errorData.error || "Unknown error"}`
      );
    }

    const data = await response.json();
    console.log("Player stats response:", data);
    setPlayerDetails({
      username: data.username,
      position: data.position,
      walletAddress: data.address,
      score: data.highest_score.toString(),
      totalScore: data.total_accumulated_score,
      gamesPlayed: data.games_played,
    });
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error fetching player stats:", error);
    setError(error.message);
    return { success: false, error: error.message };
  }
};

const getRecentGames = async (walletAddress, limit = 10) => {
  try {
    const response = await fetch(
      `${backendUrl}/recent_games/${walletAddress}?limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to fetch recent games: ${errorData.error || "Unknown error"}`
      );
    }

    const data = await response.json();
    console.log("Recent games response:", data);
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error fetching recent games:", error);
    setError(error.message);
    return { success: false, error: error.message };
  }
};
