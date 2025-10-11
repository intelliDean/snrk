import React, { Suspense, useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { connect, disconnect } from "starknetkit";
import { Contract, RpcProvider } from "starknet";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import GamePage from "./pages/GamePage";
import { contractABI } from "./abi";
import { registerPlayer, updateScore } from "./edgeFunctionService";
import { getPlayerStats, getRecentGames } from "./gameScoreService";

function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [address, setAddress] = useState(null);
  const [playerDetails, setPlayerDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  const CONTRACT_ADDRESS =
    import.meta.env.VITE_CONTRACT ||
    "0x3060854ecff13fd7f72caf971475823ff457fed1de616e70cd5342ffa345d88";

  const PROVIDER = new RpcProvider({
    nodeUrl:
      import.meta.env.VITE_SEPOLIA_URL ||
      "https://free-rpc.nethermind.io/sepolia-juno",
  });

  useEffect(() => {
    console.log("App mounted, delaying wallet connection");
    const timer = setTimeout(() => {
      connectWallet();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const connectWallet = async () => {
    if (address) {
      try {
        await disconnect();
        setProvider(PROVIDER);
        setAccount(null);
        setAddress(null);
        setPlayerDetails(null);
        setError(null);
        console.log("Wallet disconnected");
      } catch (err) {
        console.error("Disconnect error:", err);
        setError("Failed to disconnect wallet");
      }
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log("Connecting to wallet...");
      if (typeof window === "undefined" || !window.starknet) {
        throw new Error(
          "No StarkNet wallet detected. Please install Argent X or Braavos."
        );
      }

      const { wallet } = await connect({
        provider: PROVIDER,
      });

      console.log("Wallet object:", wallet);

      if (
        wallet &&
        wallet.isConnected &&
        wallet.account &&
        wallet.selectedAddress
      ) {
        setProvider(wallet.provider || PROVIDER);
        setAccount(wallet.account);
        setAddress(wallet.selectedAddress);

        try {
          console.log("Checking/registering user:", wallet.selectedAddress);
          const username = `user_${wallet.selectedAddress.slice(2, 10)}`;

          const registerResult = await registerPlayer(wallet.selectedAddress, username);

          if (!registerResult.success) {
            throw new Error(registerResult.error || "Registration failed");
          }

          console.log("Registration response:", registerResult);

          const statsResult = await getPlayerStats(wallet.selectedAddress);

          if (statsResult.success && statsResult.data) {
            setPlayerDetails({
              username: statsResult.data.username,
              position: 0,
              walletAddress: statsResult.data.wallet_address,
              score: statsResult.data.highest_score.toString(),
            });
          } else {
            setPlayerDetails({
              username: username,
              position: 0,
              walletAddress: wallet.selectedAddress,
              score: "0",
            });
          }

          console.log(`Connected: ${wallet.selectedAddress.slice(0, 10)}...`);
        } catch (fetchError) {
          console.warn("Backend sync failed, using local data:", fetchError);
          setPlayerDetails({
            username: `user_${wallet.selectedAddress.slice(2, 10)}`,
            position: 0,
            walletAddress: wallet.selectedAddress,
            score: "0",
          });
        }
      } else {
        throw new Error("Failed to connect wallet");
      }
    } catch (error) {
      const message = getFriendlyErrorMessage(error);
      setError(message);
      console.error("Connection error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFriendlyErrorMessage = (error) => {
    const message = error.message || "Failed to connect wallet";
    if (message.includes("user rejected") || message.includes("authorize")) {
      return "Connection cancelled. Please approve the connection in your wallet.";
    }
    if (message.includes("detected")) {
      return "No StarkNet wallet found. Please install Argent X or Braavos and refresh the page.";
    }
    if (message.includes("version")) {
      return "Wallet version issue. Please update your wallet extension to the latest version.";
    }
    return `Wallet connection failed: ${message}. Please ensure your wallet is unlocked and set to Sepolia testnet.`;
  };

  const getContract = async (contractAddress, contractType) => {
    console.log("getting contract with: ", contractAddress);
    console.log("user address: ", address);
    console.log("account: ", account);
    console.log("provider: ", provider);

    // const { abi } = await provider.getClassAt(contractAddress);
    console.log("Contract ABI:", contractABI);

    try {
      // if (!abi) {
      //   throw new Error("No ABI found for the contract.");
      // }

      if (contractType === 1) {
        if (!address) {
          toast.error("Connect wallet!");
          return;
        }
        return new Contract(contractABI, contractAddress, provider);
      } else if (contractType === 2) {
        if (!address || !account) {
          toast.error("Account not initialized");
          return;
        }
        return new Contract(contractABI, contractAddress, account);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to initialize contract at ${contractAddress}: ${error.message}`
        );
      } else {
        throw new Error(
          `Failed to initialize contract at ${contractAddress}: Unknown error`
        );
      }
    }
  };

  const updateUsername = async (newUsername) => {
    if (!address || !newUsername || newUsername.length > 50) {
      setError("Please enter a valid username (1-50 characters)");
      return;
    }
    if (!newUsername.match(/^[a-zA-Z0-9_]+$/)) {
      setError(
        "Username must contain only alphanumeric characters or underscores"
      );
      return;
    }

    setUpdateLoading(true);
    setError(null);
    try {
      console.log("Username update feature not yet implemented");
      setError("Username update feature coming soon");
    } catch (error) {
      const message = error.message || "Unknown error";
      setError(message);
      console.error("Update error:", message);
    } finally {
      setUpdateLoading(false);
    }
  };

 return (
   <Suspense fallback={<div className="loading-container">Loading App...</div>}>
     <div className="app-container">
       <h1 style={{ color: "white" }}>App is Running</h1>
       <Router>
         <Routes>
           <Route
             path="/"
             element={
               address ? (
                 <Navigate to="/dashboard" replace />
               ) : (
                 <LandingPage
                   connectWallet={connectWallet}
                   loading={loading}
                   error={error}
                 />
               )
             }
           />
           <Route
             path="/dashboard"
             element={
               address ? (
                 <Dashboard
                   playerDetails={playerDetails}
                   address={address}
                   connectWallet={connectWallet}
                   updateUsername={updateUsername}
                   submitGameScore={updateScore}
                   getPlayerStats={getPlayerStats}
                   getRecentGames={getRecentGames}
                   loading={updateLoading}
                   error={error}
                 />
               ) : (
                 <Navigate to="/" replace />
               )
             }
           />
           <Route
             path="/game"
             element={
               address ? (
                 <GamePage
                   playerDetails={playerDetails}
                   submitGameScore={updateScore}
                 />
               ) : (
                 <Navigate to="/" replace />
               )
             }
           />
           <Route
             path="*"
             element={
               <div className="error-container">404: Page Not Found</div>
             }
           />
         </Routes>
       </Router>
     </div>
   </Suspense>
 );
}

export default App;

//=========
