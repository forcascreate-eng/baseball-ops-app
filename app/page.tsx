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
  results: PlateAppearance[];
  career: {
    results: PlateAppearance[];
  };
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
  }));

const normalizePlayers = (data: any[]): Player[] => {
  return data.map((p, i) => ({
    name: p.name ?? `選手${i + 1}`,
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

  useEffect(() => {
  const saved = localStorage.getItem("players");
  const savedGameTitle = localStorage.getItem("gameTitle");

  if (saved) {
    setPlayers(normalizePlayers(JSON.parse(saved)));
  }

  if (savedGameTitle) {
    setGameTitle(savedGameTitle);
  }

  setLoaded(true);
}, []);
  const saved = localStorage.getItem("players");
  const savedGameTitle = localStorage.getItem("gameTitle");

  if (saved) {
    setPlayers(normalizePlayers(JSON.parse(saved)));
  }

  if (savedGameTitle) {
    setGameTitle(savedGameTitle);
  }

  setLoaded(true);
}, []);

  useEffect(() => {
  if (loaded) {
    localStorage.setItem("gameTitle", gameTitle);
  }
}, [gameTitle, loaded]);

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

  const teamResults = players.flatMap((p) => p.results);
  const teamStats = getStats(teamResults);

  return (
    <main className="p-4">
      <h1 className="text-3xl font-bold mb-4">
        野球 OPS記録アプリ
      </h1>
      <input
        value={gameTitle}
        onChange={(e) => setGameTitle(e.target.value)}
        placeholder="例：vs イーグルス / 春季大会1回戦"
        className="border rounded-lg px-3 py-2 mb-4 w-full text-black"
     />

      <div className="border rounded-xl p-4 mb-4 bg-gray-100 text-black">
        <h2 className="font-bold mb-2">チーム累計</h2>
        <div>
          打数: {teamStats.atBats} / 安打: {teamStats.hits} / HR:{" "}
          {teamStats.homeRuns} / 四球: {teamStats.walks}
        </div>
        <div className="font-bold">
          打率: {teamStats.avg} / 出塁率: {teamStats.obp} / 長打率:{" "}
          {teamStats.slg} / OPS: {teamStats.ops}
        </div>
      </div>

      <div className="mb-4">
        <label className="font-bold mr-2">現在のイニング</label>
        <select
          value={currentInning}
          onChange={(e) => setCurrentInning(Number(e.target.value))}
          className="border rounded px-3 py-2"
        >
          {Array.from({ length: 9 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}回
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={() => {
          if (confirm("新しい試合を開始しますか？現在の試合記録は通算に追加されます。")) {
            setPlayers((prev) =>
              prev.map((player) => ({
                ...player,
                career: {
                  results: [
                    ...(player.career?.results ?? []),
                    ...player.results,
                  ],
                },
                results: [],
              }))
            );
          }
        }}
        className="bg-red-600 text-white px-4 py-2 rounded-lg mb-4"
      >
        新しい試合
      </button>

      <div className="space-y-4">
        {players.map((player, playerIndex) => {
          const stats = getStats(player.results);
          const careerStats = getStats([
            ...(player.career?.results ?? []),
            ...player.results,
          ]);

          return (
            <div key={playerIndex} className="border rounded-xl p-4 shadow">
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => movePlayer(playerIndex, "up")}
                  className="bg-gray-500 text-white px-2 py-1 rounded"
                >
                  ↑
                </button>

                <button
                  onClick={() => movePlayer(playerIndex, "down")}
                  className="bg-gray-500 text-white px-2 py-1 rounded"
                >
                  ↓
                </button>

                <input
                  value={player.name}
                  onChange={(e) => changeName(playerIndex, e.target.value)}
                  className="border px-2 py-1 rounded font-bold"
                />
              </div>

              <div className="text-sm mb-2">
                打数: {stats.atBats} / 安打: {stats.hits} / HR:{" "}
                {stats.homeRuns} / 四球: {stats.walks}
              </div>

              <div className="font-bold mb-3">
                打率: {stats.avg} / 出塁率: {stats.obp} / 長打率:{" "}
                {stats.slg} / OPS: {stats.ops}
              </div>

              <div className="border rounded-lg p-3 mb-3 bg-yellow-100 text-black">
                <div className="font-bold text-lg mb-2">個人通算</div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  <div>打数: {careerStats.atBats}</div>
                  <div>安打: {careerStats.hits}</div>
                  <div>HR: {careerStats.homeRuns}</div>
                  <div>四球: {careerStats.walks}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 font-bold">
                  <div>打率: {careerStats.avg}</div>
                  <div>出塁率: {careerStats.obp}</div>
                  <div>長打率: {careerStats.slg}</div>
                  <div>OPS: {careerStats.ops}</div>
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => resetPlayerGame(playerIndex)}
                  className="bg-orange-500 text-white px-3 py-2 rounded-lg text-sm"
                >
                  この試合をリセット
                </button>

                <button
                  onClick={() => resetPlayerCareer(playerIndex)}
                  className="bg-red-700 text-white px-3 py-2 rounded-lg text-sm"
                >
                  通算リセット
                </button>             
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {resultOptions.map((result) => (
                  <button
                    key={result}
                    onClick={() => addResult(playerIndex, result)}
                    className="bg-blue-500 text-white px-3 py-2 rounded-lg"
                  >
                    {result}
                  </button>
                ))}
              </div>

              <button
                onClick={() => togglePlayerHistory(playerIndex)}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg mb-3 text-sm"
              >
                {openPlayers.includes(playerIndex)
                  ? "▼ 打席履歴を閉じる"
                  : "▶ 打席履歴を表示"}
              </button>

              <div className="space-y-2">
                {openPlayers.includes(playerIndex) &&
                  player.results.map((pa, resultIndex) => (
                  <div
                    key={resultIndex}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span>{resultIndex + 1}打席目</span>

                    <select
                      value={pa.inning}
                      onChange={(e) =>
                        editInning(
                          playerIndex,
                          resultIndex,
                          Number(e.target.value)
                        )
                      }
                      className="border rounded px-2 py-1"
                    >
                      {Array.from({ length: 9 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}回
                        </option>
                      ))}
                    </select>

                    <select
                      value={pa.result}
                      onChange={(e) =>
                        editResult(
                          playerIndex,
                          resultIndex,
                          e.target.value as Result
                        )
                      }
                      className="border rounded px-2 py-1"
                    >
                      {resultOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => deleteResult(playerIndex, resultIndex)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}