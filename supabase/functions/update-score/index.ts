import { createClient } from 'npm:@supabase/supabase-js@2.75.0';
import { Contract, RpcProvider, uint256 } from 'npm:starknet@6.7.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const contractABI = [
  {
    "type": "impl",
    "name": "Starknake",
    "interface_name": "starknake::interfaces::IStarknake"
  },
  {
    "type": "struct",
    "name": "core::integer::u256",
    "members": [
      { "name": "low", "type": "core::integer::u128" },
      { "name": "high", "type": "core::integer::u128" }
    ]
  },
  {
    "type": "interface",
    "name": "starknake::interfaces::IStarknake",
    "items": [
      {
        "type": "function",
        "name": "update_player_score",
        "inputs": [
          {
            "name": "address",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          { "name": "current_score", "type": "core::integer::u256" }
        ],
        "outputs": [],
        "state_mutability": "external"
      }
    ]
  }
];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { walletAddress, score, gameDuration = 0 } = await req.json();

    if (!walletAddress || score === undefined) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing walletAddress or score' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (userError) throw userError;

    if (!userData) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const provider = new RpcProvider({
      nodeUrl: 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_9/PP5-km-xd8s0Ui0FrVxyBSEfD_UhS0e9'
    });

    const contractAddress = '0x3060854ecff13fd7f72caf971475823ff457fed1de616e70cd5342ffa345d88';
    const contract = new Contract(contractABI, contractAddress, provider);

    try {
      const scoreUint256 = uint256.bnToUint256(score);
      
      await contract.update_player_score(walletAddress, scoreUint256);
    } catch (contractError) {
      console.error('Smart contract call error:', contractError);
    }

    const { error: scoreError } = await supabase
      .from('game_scores')
      .insert({
        user_id: userData.id,
        wallet_address: walletAddress,
        score: score,
        game_duration: gameDuration,
        played_at: new Date().toISOString()
      });

    if (scoreError) throw scoreError;

    const newTotalScore = userData.total_accumulated_score + score;
    const newGamesPlayed = userData.games_played + 1;
    const newHighestScore = Math.max(userData.highest_score, score);

    const { error: updateError } = await supabase
      .from('users')
      .update({
        total_accumulated_score: newTotalScore,
        games_played: newGamesPlayed,
        highest_score: newHighestScore,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', walletAddress);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Score updated successfully',
        data: {
          totalScore: newTotalScore,
          gamesPlayed: newGamesPlayed,
          highestScore: newHighestScore
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in update-score function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});