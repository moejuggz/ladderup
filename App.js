import React, { useState, useRef, useEffect } from "react";
import "./App.css";

export default function App() {
  const [tab, setTab] = useState("ladder");
  const [showSplash, setShowSplash] = useState(true); // splash screen state

  const [balances, setBalances] = useState({
    trading: 0,
    sports: 0,
    poker: 0,
    ladder: 0,
  });

  const [risks, setRisks] = useState({
    trading: 0.01,
    sports: 0.01,
    poker: 0.01,
    ladder: 0.15,
  });

  const [goalMultiplier, setGoalMultiplier] = useState(5);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [ladderTargets, setLadderTargets] = useState([]);
  const [levelHistory, setLevelHistory] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const ladderRef = useRef(null);
  const growthPerLevel = 0.15; // fixed 15%

  const riskCategories = {
    "Super Conservative": 0.01,
    Conservative: 0.02,
    Balanced: 0.04,
    Aggressive: 0.15,
  };

  const updateBalance = (tabName, value) => {
    setBalances((prev) => ({ ...prev, [tabName]: value }));
  };

  const updateRisk = (tabName, value) => {
    setRisks((prev) => ({ ...prev, [tabName]: value }));
  };

  const suggestLadder = (startBalance, goalMult) => {
    const levels = Math.ceil(Math.log(goalMult) / Math.log(1 + growthPerLevel));
    let targets = [];
    let amt = startBalance;
    for (let i = 0; i < levels; i++) {
      amt = amt * (1 + growthPerLevel);
      targets.push(amt.toFixed(2));
    }
    setCurrentLevel(0);
    setLevelHistory([]);
    setCompleted(false);
    updateBalance("ladder", startBalance);
    setLadderTargets(targets);
  };

  useEffect(() => {
    // hide splash screen after 2.5 seconds
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ladderRef.current && ladderTargets.length > 0) {
      const nodes = ladderRef.current.children;
      if (nodes[currentLevel]) {
        nodes[currentLevel].scrollIntoView({ behavior: "smooth", inline: "center" });
      }
    }
  }, [currentLevel, ladderTargets]);

  const handleResult = (result) => {
    let newLevel = currentLevel;
    let newBalance = balances.ladder;

    if (result === "win") {
      newBalance = Number(ladderTargets[currentLevel]);
      newLevel = Math.min(currentLevel + 1, ladderTargets.length - 1);
    } else if (result === "loss") {
      newLevel = Math.max(currentLevel - 1, 0);
      newBalance = Number(ladderTargets[newLevel]);
    }

    setCurrentLevel(newLevel);
    updateBalance("ladder", newBalance);
    setLevelHistory((prev) => [...prev, { level: newLevel, balance: newBalance, result }]);

    if (newLevel === ladderTargets.length - 1 && result === "win") {
      setCompleted(true);
    }
  };

  const getWinRate = () => {
    const wins = levelHistory.filter((h) => h.result === "win").length;
    const total = levelHistory.length;
    return total > 0 ? ((wins / total) * 100).toFixed(1) : 0;
  };

  const renderRiskButtons = (tabName) => (
    <div className="riskButtons">
      {Object.entries(riskCategories).map(([label, value]) => (
        <button
          key={label}
          className={`riskBtn ${risks[tabName] === value ? "activeRisk" : ""}`}
          onClick={() => updateRisk(tabName, value)}
          disabled={tabName === "ladder"}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const renderLadder = () => {
    const ladderBalance = balances.ladder;
    const risk = risks.ladder;
    const winRate = getWinRate();

    return (
      <div>
        <h3 style={{ textAlign: "center", marginBottom: "10px", color: "#4f46e5" }}>
          Ladder Up Instructions:
        </h3>
        <p style={{ textAlign: "center", marginBottom: "10px" }}>
          1️⃣ Enter your starting balance.<br />
          2️⃣ Select target multiplier.<br />
          3️⃣ Click "Start Ladder" to generate levels.<br />
          4️⃣ Track progress with "Win" or "Loss".
        </p>

        <label>Enter your starting balance:</label>
        <input
          type="number"
          placeholder="Starting Balance"
          value={ladderBalance}
          onChange={(e) => updateBalance("ladder", Number(e.target.value))}
          className="input"
        />

        <div className="goalBtns" style={{ marginTop: "10px" }}>
          <p style={{ marginBottom: "5px" }}>Select target multiplier:</p>
          {[5, 10, 20, 50, 100, 1000].map((m) => (
            <button
              key={m}
              className={`goalBtn ${goalMultiplier === m ? "activeGoal" : ""}`}
              onClick={() => setGoalMultiplier(m)}
            >
              {m}x
            </button>
          ))}
        </div>

        <button className="btn" style={{ marginTop: "10px" }} onClick={() => suggestLadder(ladderBalance, goalMultiplier)}>
          Start Ladder
        </button>

        {ladderTargets.length > 0 && (
          <div>
            <h2 style={{ textAlign: "center", margin: "15px 0", fontSize: "2rem", color: "#10b981" }}>
              🎯 Target Goal: ${ladderTargets[ladderTargets.length - 1]}
            </h2>

            {completed && (
              <h3 style={{ textAlign: "center", color: "#4f46e5", marginBottom: "15px" }}>
                🎉 Ladder Challenge Completed! 🎉
              </h3>
            )}

            <p>
              Level {currentLevel + 1} of {ladderTargets.length} | Risk per Level: ${(ladderBalance * risk).toFixed(2)} | Win Rate: {winRate}%
            </p>

            <div className="progressBar">
              <div className="progressFill" style={{ width: `${winRate}%`, background: "linear-gradient(to right, #10b981, #4f46e5)" }}></div>
            </div>

            <div className="ladderScroll" ref={ladderRef}>
              {ladderTargets.map((target, idx) => {
                const isCurrent = idx === currentLevel;
                const historyItem = levelHistory.find((h) => h.level === idx);
                return (
                  <div key={idx} className="ladderNodeWrapperH" style={{ opacity: historyItem?.result === "loss" ? 0.4 : 1 }}>
                    <div
                      className={`ladderNode ${idx < currentLevel ? "completedNode" : ""} ${historyItem?.result === "loss" ? "lostNode" : ""}`}
                      style={{
                        boxShadow: isCurrent ? "0 0 15px 4px #10b981, 0 0 30px #10b98170" : "",
                        transform: isCurrent ? "scale(1.2)" : "",
                        transition: "all 0.3s ease"
                      }}
                    >
                      {idx + 1}
                    </div>
                    <p className="goalText">${target}</p>
                    {idx < ladderTargets.length - 1 && <div className="connectorH" />}
                  </div>
                );
              })}
            </div>

            <div className="resultBtns">
              <button onClick={() => handleResult("win")} className="btn">Win</button>
              <button onClick={() => handleResult("loss")} className="btn">Loss</button>
            </div>

            <button className="btn" style={{ marginTop: "10px" }} onClick={() => setShowHistory((prev) => !prev)}>
              {showHistory ? "Hide History" : "Show History"}
            </button>

            {showHistory && levelHistory.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <h4>History:</h4>
                {levelHistory.map((h, i) => (
                  <p key={i}>
                    Level {h.level + 1} - ${h.balance} - {h.result.toUpperCase()}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderBalanceTab = (tabName) => {
    const balance = balances[tabName];
    const risk = risks[tabName];
    const shots = balance > 0 ? Math.floor(balance / (balance * risk)) : 0;

    return (
      <div>
        <label>Enter your balance:</label>
        <input
          type="number"
          placeholder="Enter Balance"
          value={balance}
          onChange={(e) => updateBalance(tabName, Number(e.target.value))}
          className="input"
        />
        {renderRiskButtons(tabName)}
        {balance > 0 && (
          <>
            <p>{tabName === "sports" ? "Max Bet" : "Max Risk Allowed"}: ${(balance * risk).toFixed(2)}</p>
            {tabName === "poker" && (
              <>
                <p>Cash Game Buy-in: ${(balance * risk).toFixed(2)}</p>
                <p>Tournament Buy-in Range: ${(Math.max(balance * 0.01, 1)).toFixed(2)} - ${(balance * 0.024).toFixed(2)}</p>
              </>
            )}
            <p>Possible Shots: {shots}</p>
          </>
        )}
      </div>
    );
  };

  const renderTab = () => {
    switch (tab) {
      case "ladder": return renderLadder();
      case "trading": return renderBalanceTab("trading");
      case "sports": return renderBalanceTab("sports");
      case "poker": return renderBalanceTab("poker");
      default: return null;
    }
  };

  const icons = {
    ladder: <span role="img" aria-label="ladder">🪜</span>,
    trading: <span role="img" aria-label="trading">📈</span>,
    sports: <span role="img" aria-label="sports">🏀</span>,
    poker: <span role="img" aria-label="poker">♠️</span>
  };

  // --- Splash screen ---
  if (showSplash) {
    return (
      <div className="splashScreen">
        <img src="https://i.ibb.co/rG8W7LKC/ladderup-logo.png" alt="LadderUp Logo" className="splashLogo" />
      </div>
    );
  }

  return (
    <div className="app">
      <div className="card">{renderTab()}</div>

      <div className="bottomTabs">
        {["ladder", "trading", "sports", "poker"].map((t) => (
          <div key={t} className={`bottomTabBtn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {icons[t]} <span style={{ marginLeft: "5px" }}>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
