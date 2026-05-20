"use client";

import { useEffect, useState } from "react";

type DailyData = { date: string; revenue: number; orders: number };

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<7 | 30>(30);
  const [data, setData] = useState<DailyData[]>([]);
  const [restaurantId, setRestaurantId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const res = await fetch("/api/auth/restaurant");
      if (!res.ok) { setLoading(false); return; }
      const r = await res.json();
      setRestaurantId(r.id);
      await load(r.id, 30);
      setLoading(false);
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(rid: string, days: number) {
    const r = await fetch(`/api/analytics?restaurant_id=${rid}&days=${days}`);
    if (r.ok) setData(await r.json());
  }

  async function changePeriod(days: 7 | 30) {
    if (days === period || !restaurantId) return;
    setPeriod(days);
    setLoading(true);
    await load(restaurantId, days);
    setLoading(false);
  }

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);
  const daysWithOrders = data.filter((d) => d.orders > 0).length;
  const avgDaily = daysWithOrders > 0 ? Math.round(totalRevenue / daysWithOrders) : 0;
  const bestDay = data.reduce<DailyData | null>(
    (best, d) => (d.revenue > (best?.revenue ?? 0) ? d : best),
    null,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">Analytics</h1>
          <p className="text-green-700 text-sm mt-0.5">Chiffre d&apos;affaires et activité du restaurant</p>
        </div>
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
          {([7, 30] as const).map((d) => (
            <button
              key={d}
              onClick={() => changePeriod(d)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                period === d ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {d} jours
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon="💰"
          label={`CA total (${period}j)`}
          value={`${totalRevenue.toLocaleString("fr-FR")} F`}
          loading={loading}
        />
        <StatCard
          icon="🛎️"
          label="Commandes"
          value={totalOrders.toString()}
          loading={loading}
        />
        <StatCard
          icon="📈"
          label="Moy. par jour actif"
          value={`${avgDaily.toLocaleString("fr-FR")} F`}
          loading={loading}
        />
        <StatCard
          icon="🏆"
          label="Meilleur jour"
          value={
            bestDay && bestDay.revenue > 0
              ? new Date(bestDay.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
              : "—"
          }
          sub={bestDay && bestDay.revenue > 0 ? `${bestDay.revenue.toLocaleString("fr-FR")} F` : undefined}
          loading={loading}
        />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-bold text-slate-900 mb-5">
          Revenus — {period === 7 ? "7 derniers jours" : "30 derniers jours"}
        </h2>
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <RevenueChart data={data} period={period} />
        )}
      </div>

      {/* Daily breakdown table — 7j only */}
      {!loading && period === 7 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50">
            <h2 className="font-bold text-slate-900">Détail des 7 jours</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {[...data].reverse().map((d) => (
              <div key={d.date} className="flex items-center justify-between px-6 py-3">
                <span className="text-sm text-slate-700">
                  {new Date(d.date + "T12:00:00").toLocaleDateString("fr-FR", {
                    weekday: "short", day: "numeric", month: "short",
                  })}
                </span>
                <div className="flex items-center gap-6">
                  <span className="text-xs text-green-700">{d.orders} cmd</span>
                  <span className={`text-sm font-bold ${d.revenue > 0 ? "text-slate-900" : "text-slate-300"}`}>
                    {d.revenue > 0 ? `${d.revenue.toLocaleString("fr-FR")} F` : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon, label, value, sub, loading,
}: {
  icon: string; label: string; value: string; sub?: string; loading: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="text-2xl mb-2">{icon}</div>
      {loading ? (
        <div className="h-7 bg-slate-100 rounded-lg animate-pulse mb-1" />
      ) : (
        <div className="text-xl font-extrabold text-slate-900 leading-tight">{value}</div>
      )}
      {sub && !loading && <div className="text-xs font-semibold text-orange-600 mt-0.5">{sub}</div>}
      <div className="text-xs text-green-700 mt-1">{label}</div>
    </div>
  );
}

function RevenueChart({ data, period }: { data: DailyData[]; period: number }) {
  const W = 640, H = 210;
  const padL = 10, padR = 10, padT = 30, padB = 48;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const slotW = chartW / data.length;
  const barW = Math.max(3, slotW - (period <= 7 ? 14 : 3));

  const gridValues = [0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden="true" style={{ height: "210px" }}>
      {/* Grid lines */}
      {gridValues.map((ratio) => {
        const y = padT + chartH * (1 - ratio);
        const val = Math.round(maxRevenue * ratio);
        return (
          <g key={ratio}>
            <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#f1f5f9" strokeWidth={1} />
            <text x={padL} y={y - 3} fontSize={8} fill="#cbd5e1" textAnchor="start">
              {val >= 1000 ? `${Math.round(val / 1000)}k F` : `${val} F`}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const x = padL + i * slotW + (slotW - barW) / 2;
        const barH = maxRevenue > 0 ? (d.revenue / maxRevenue) * chartH : 0;
        const y = padT + chartH - barH;
        const isToday = d.date === new Date().toISOString().split("T")[0];
        const showLabel = period <= 7 || i % 5 === 0 || i === data.length - 1;
        const dateLabel = new Date(d.date + "T12:00:00").toLocaleDateString("fr-FR", {
          day: "numeric",
          month: period <= 7 ? "short" : "numeric",
        });

        return (
          <g key={d.date}>
            {/* empty slot */}
            <rect x={x} y={padT} width={barW} height={chartH} fill="#f8fafc" rx={2} />
            {/* filled bar */}
            {d.revenue > 0 && (
              <rect
                x={x} y={y} width={barW} height={barH}
                fill={isToday ? "#ea580c" : "#f97316"}
                rx={2} opacity={0.9}
              />
            )}
            {/* date label */}
            {showLabel && (
              <text
                x={padL + i * slotW + slotW / 2}
                y={H - padB + 16}
                textAnchor="middle"
                fontSize={period <= 7 ? 10 : 8}
                fill={isToday ? "#f97316" : "#94a3b8"}
                fontWeight={isToday ? "bold" : "normal"}
              >
                {dateLabel}
              </text>
            )}
            {/* value label above bar (7-day only) */}
            {period <= 7 && d.revenue > 0 && (
              <text
                x={x + barW / 2} y={y - 5}
                textAnchor="middle" fontSize={9}
                fill="#ea580c" fontWeight="bold"
              >
                {d.revenue >= 1000 ? `${Math.round(d.revenue / 1000)}k` : `${d.revenue}`}
              </text>
            )}
          </g>
        );
      })}

      {/* "Aujourd'hui" indicator */}
      {(() => {
        const todayIdx = data.findIndex((d) => d.date === new Date().toISOString().split("T")[0]);
        if (todayIdx < 0) return null;
        const cx = padL + todayIdx * slotW + slotW / 2;
        return (
          <text x={cx} y={H - padB + 30} textAnchor="middle" fontSize={8} fill="#f97316" fontWeight="bold">
            auj.
          </text>
        );
      })()}
    </svg>
  );
}
