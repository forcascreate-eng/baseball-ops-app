"use client";

import { useState, useEffect } from "react";

type Result =
  | "単打" | "二塁打" | "三塁打" | "HR"
  | "四球" | "死球" | "三振" | "ゴロ" | "フライ" | "犠飛";

type PlateAppearance = {
  inning: number;
  result: Result;
};

type Player = {
  name: string;
  position?: string;
  results: PlateAppearance[];
  career: {
    results: PlateAppearance[];
  };
};

type GameRecord = {
  date: string;
  title: string;
  players: Player[];
};

const resultOptions: Result[] = [
  "単打", "二塁打", "三塁打", "HR", "四球",
  "死球", "三振", "ゴロ", "フライ", "犠飛",
];

const initialPlayers = (): Player[] =>
  Array.from({ length: 12 }, (_, i) => ({
    name: `選手${i + 1}`,
    results: [],
    career: { results: [] },
    position: "",
  }));

const normalizePlayers = (data: any[]): Player[] => {
  return data.map((p, i) => ({
    name: p.name ?? `選手${i + 1}`,
    position: p.position ?? "",
    results: (p.results ?? []).map((r: any) =>
      typeof r === "string"
        ? { inning: 1, result: r }
        : { inning: r.inning ?? 1, result: r.result }
    ),
    career: {
      results: (p.career?.results ?? []).map((r: any) =>
        typeof r === "string"
          ? { inning: 1, result: r }
          : { inning: r.inning ?? 1, result: r.result }
      ),
    },
  }));
};

export default function Home() {
  const [players, setPlayers] = useState<Player[]>(initialPlayers());
  const [openPlayers, setOpenPlayers] = useState<number[]>([]);
  const [currentInning, setCurrentInning] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [gameTitle, setGameTitle] = useState("");
  const [gameHistory, setGameHistory] = useState<GameRecord[]>([]);
  const [sortBy, setSortBy] = useState<"ops" | "avg" | "hits" | "homeRuns">("ops");
  const [gameDate, setGameDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
  const saved = localStorage.getItem("players");
  const savedGameTitle = localStorage.getItem("gameTitle");
  const savedGameDate = localStorage.getItem("gameDate");
  const savedGameHistory = localStorage.getItem("gameHistory");

  if (saved) {
    setPlayers(normalizePlayers(JSON.parse(saved)));
  }

  if (savedGameTitle) {
    setGameTitle(savedGameTitle);
  }
  if (savedGameDate) {
  setGameDate(savedGameDate);
  }
  if (savedGameHistory) {
  setGameHistory(JSON.parse(savedGameHistory));
}

  setLoaded(true);
}, []);

  useEffect(() => {
  if (loaded) {
    localStorage.setItem("gameTitle", gameTitle);
    localStorage.setItem("gameDate", gameDate);
    localStorage.setItem("gameHistory", JSON.stringify(gameHistory));
  }
}, [gameTitle, gameDate, gameHistory, loaded]);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem("players", JSON.stringify(players));
    }
  }, [players, loaded]);

  const getStats = (results: PlateAppearance[]) => {
    let hits = 0, homeRuns = 0, walks = 0, hbp = 0;
    let atBats = 0, sacFlies = 0, totalBases = 0;

    results.forEach(({ result }) => {
      if (result === "単打") { hits++; atBats++; totalBases += 1; }
      if (result === "二塁打") { hits++; atBats++; totalBases += 2; }
      if (result === "三塁打") { hits++; atBats++; totalBases += 3; }
      if (result === "HR") { hits++; homeRuns++; atBats++; totalBases += 4; }
      if (result === "四球") walks++;
      if (result === "死球") hbp++;
      if (result === "三振" || result === "ゴロ" || result === "フライ") atBats++;
      if (result === "犠飛") sacFlies++;
    });

    const avg = hits / Math.max(atBats, 1);
    const obp = (hits + walks + hbp) / Math.max(atBats + walks + hbp + sacFlies, 1);
    const slg = totalBases / Math.max(atBats, 1);
    const ops = obp + slg;

    return {
      atBats,
      hits,
      homeRuns,
      walks,
      avg: avg.toFixed(3),
      obp: obp.toFixed(3),
      slg: slg.toFixed(3),
      ops: ops.toFixed(3),
    };
  };

  const addResult = (playerIndex: number, result: Result) => {
    const updated = [...players];
    updated[playerIndex].results.push({
      inning: currentInning,
      result,
    });
    setPlayers(updated);
  };

  const editResult = (
    playerIndex: number,
    resultIndex: number,
    newResult: Result
  ) => {
    const updated = [...players];
    updated[playerIndex].results[resultIndex].result = newResult;
    setPlayers(updated);
  };

  const editInning = (
    playerIndex: number,
    resultIndex: number,
    inning: number
  ) => {
    const updated = [...players];
    updated[playerIndex].results[resultIndex].inning = inning;
    setPlayers(updated);
  };

  const deleteResult = (playerIndex: number, resultIndex: number) => {
    const updated = [...players];
    updated[playerIndex].results.splice(resultIndex, 1);
    setPlayers(updated);
  };

  const changeName = (playerIndex: number, name: string) => {
    const updated = [...players];
    updated[playerIndex].name = name;
    setPlayers(updated);
  };

  const movePlayer = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= players.length) return;

    const updated = [...players];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setPlayers(updated);
  };

  const resetPlayerGame = (playerIndex: number) => {
  if (confirm("この選手の今回の試合記録を削除しますか？")) {
    const updated = [...players];
    updated[playerIndex].results = [];
    setPlayers(updated);
  }
};

const resetPlayerCareer = (playerIndex: number) => {
  if (confirm("この選手の通算成績を削除しますか？")) {
    const updated = [...players];
    updated[playerIndex].career.results = [];
    setPlayers(updated);
  }
};

const togglePlayerHistory = (playerIndex: number) => {
  if (openPlayers.includes(playerIndex)) {
    setOpenPlayers(openPlayers.filter((i) => i !== playerIndex));
  } else {
    setOpenPlayers([...openPlayers, playerIndex]);
  }
};

const deleteGameHistory = (index: number) => {
  if (confirm("この過去試合を削除しますか？")) {
    setGameHistory((prev) =>
      prev.filter((_, i) => i !== index)
    );
  }
};

const restoreGameHistory = (index: number) => {
  const game = gameHistory[index];

  if (confirm("この過去試合を開きますか？現在の試合内容は上書きされます。")) {
    setGameDate(game.date);
    setGameTitle(game.title);
    setPlayers(game.players);
  }
};

  const teamResults = players.flatMap((p) => p.results);
  const teamStats = getStats(teamResults);
  const gameRanking = players
  .map((player) => ({
    player,
    stats: getStats(player.results),
  }))
  .sort((a, b) => Number(b.stats[sortBy]) - Number(a.stats[sortBy]));

  return (
    <main className="p-4">
      <h1 className="text-3xl font-bold mb-4">
        野球 OPS記録アプリ
      </h1>
      <div className="bg-white text-black rounded-xl p-4 mb-4 shadow">
       <label className="block text-sm font-bold mb-1">
         対戦名
       </label>
       <input
         value={gameTitle}
         onChange={(e) => setGameTitle(e.target.value)}
         placeholder="例：vs イーグルス"
         className="border rounded-lg px-3 py-3 mb-4 w-full text-black text-lg"
       />

       <label className="block text-sm font-bold mb-1">
          試合日
       </label>
       <input
         type="date"
         value={gameDate}
         onChange={(e) => setGameDate(e.target.value)}
         className="border rounded-lg px-3 py-3 max-w-full text-black text-lg"
       />
     </div>

      <div className="border rounded-xl p-4 mb-4 bg-gray-100 text-black">
        <h2 className="font-bold mb-2">チーム累計</h2>
        <div>
          打数: {teamStats.atBats}
        </div>

        <div className="font-bold">
          OPS: {teamStats.ops}
      </div>
    </div>

{/* 過去試合一覧 */}
<div className="bg-white text-black rounded-xl p-3 mb-4 shadow">
  <h2 className="font-bold text-lg mb-2">過去試合一覧</h2>

  {gameHistory.length === 0 ? (
    <div className="text-sm text-gray-500">
      まだ保存された試合はありません
    </div>
  ) : (
    <div className="space-y-2">
      {gameHistory.map((game, index) => (
        <div
          key={index}
          className="border rounded-lg p-2 flex items-center justify-between"
        >
          <div>
            <div className="font-bold">
              {game.date}　{game.title || "対戦名未入力"}
            </div>
            <div className="text-sm text-gray-600">
              登録選手: {game.players.length}人
            </div>
          </div>

        <div className="flex flex-col gap-2">
           <button
             onClick={() => restoreGameHistory(index)}
             className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
           >
             開く
           </button>

           <button
             onClick={() => deleteGameHistory(index)}
             className="bg-red-500 text-white px-3 py-1 rounded text-sm"
           >
             削除
           </button>
        </div>
        </div>
      ))}
    </div>
  )}
</div>

{/* 試合成績一覧 */}
<div className="bg-white text-black rounded-xl p-3 mb-4 shadow">
  <div className="mb-3">
    <div className="text-sm text-gray-500">{gameDate}</div>
    <div className="text-xl font-bold">
      {gameTitle || "対戦名未入力"}
    </div>
  </div>

  <div className="flex items-center justify-between mb-2">
    <h2 className="font-bold text-lg">試合成績一覧</h2>

    <select
      value={sortBy}
      onChange={(e) =>
        setSortBy(e.target.value as "ops" | "avg" | "hits" | "homeRuns")
      }
      className="border rounded px-2 py-1 text-sm"
    >
      <option value="ops">OPS順</option>
      <option value="avg">打率順</option>
      <option value="hits">安打順</option>
      <option value="homeRuns">HR順</option>
    </select>
  </div>

  <table className="w-full text-sm">
    <thead>
      <tr className="border-b h-10">
        <th className="text-left">順</th>
        <th className="text-left">選手</th>
        <th>守</th>
        <th>打</th>
        <th>安</th>
        <th>率</th>
        <th>OPS</th>
      </tr>
    </thead>

    <tbody>
      {gameRanking.map(({ player, stats }, index) => (
        <tr key={index} className="border-b">
          <td>{index + 1}</td>
          <td className="font-bold">
            {player.name}
            {index === 0 && " 🥇"}
            {index === 1 && " 🥈"}
            {index === 2 && " 🥉"}
          </td>
          <td className="text-center">{player.position || "-"}</td>
          <td className="text-center">{stats.atBats}</td>
          <td className="text-center">{stats.hits}</td>
          <td className="text-center">{stats.avg}</td>
          <td className="text-center font-bold text-blue-600">
            {stats.ops}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>