"use client";

interface SeedEntry {
  id: string;
  depth: number;
  isLocked: boolean;
  confidenceAvg: number;
  stress: number;
  compute: number;
}

export default function SeedAuditorClient({ seeds }: { seeds: SeedEntry[] }) {
  return (
    <div className="min-h-screen bg-[#050505] text-[#d1d5db] p-8 font-mono">
      <h1 className="text-xl font-bold text-purple-400 mb-6">逻辑监管塔 (Seed Auditor)</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] border border-white/10 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-purple-900/20 text-purple-300">
              <th className="px-4 py-3 text-left">Seed ID</th>
              <th className="px-4 py-3 text-left">Depth</th>
              <th className="px-4 py-3 text-left">Locked</th>
              <th className="px-4 py-3 text-left">Confidence Avg</th>
              <th className="px-4 py-3 text-left">Stress</th>
              <th className="px-4 py-3 text-left">Compute</th>
            </tr>
          </thead>
          <tbody>
            {seeds.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  暂无活跃种子
                </td>
              </tr>
            ) : (
              seeds.map((s) => (
                <tr key={s.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-4 py-2 font-mono text-cyan-400">#{s.id}</td>
                  <td className="px-4 py-2">{s.depth}</td>
                  <td className="px-4 py-2">{s.isLocked ? "🔒" : "—"}</td>
                  <td className="px-4 py-2">{(s.confidenceAvg * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2">{s.stress}</td>
                  <td className="px-4 py-2">{s.compute.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
