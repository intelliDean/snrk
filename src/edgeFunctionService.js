const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const registerPlayer = async (walletAddress, username) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/register-player`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        username,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Registration failed')
    }

    return result
  } catch (error) {
    console.error('Error registering player:', error)
    return { success: false, error: error.message }
  }
}

export const updateScore = async (walletAddress, score, gameDuration = 0) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/update-score`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        score,
        gameDuration,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Score update failed')
    }

    return result
  } catch (error) {
    console.error('Error updating score:', error)
    return { success: false, error: error.message }
  }
}
