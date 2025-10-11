import { createClient } from 'npm:@supabase/supabase-js@2.75.0';
import { Contract, RpcProvider, shortString } from 'npm:starknet@6.7.0';

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
        "name": "player_registers",
        "inputs": [
          {
            "name": "player_address",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          { "name": "username", "type": "core::felt252" }
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

    const { walletAddress, username } = await req.json();

    if (!walletAddress || !username) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing walletAddress or username' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingUser) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'User already registered',
          data: existingUser,
        }),
        {
          status: 200,
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
      const usernameEncoded = shortString.encodeShortString(username);
      
      await contract.player_registers(walletAddress, usernameEncoded);
    } catch (contractError) {
      console.error('Smart contract call error:', contractError);
    }

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        wallet_address: walletAddress,
        username: username,
        highest_score: 0,
        total_accumulated_score: 0,
        games_played: 0,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User registered successfully',
        data: newUser,
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in register-player function:', error);
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