"use client";

import { useEffect, useState, useCallback } from "react";
import { useMoney } from "../components/CurrencyContext";

// ── Types ────────────────────────────────────────────────────────

type DailyData = { date: string; revenue: number; orders: number };

type StatsData = {
  today: { revenue: number; orders: number; avgTicket: number };
  yesterday: { revenue: number; orders: number };
  topDishes: Array<{ name: string; count: number; revenue: number }>;
  peakHours: Array<{ hour: number; count: number }>;
};

type Period = "today" | "7" | "30" | "month";

const PERIOD_LABELS: Record<Period, string> = {
  today: "Aujourd'hui",
  "7": "7 jours",
  "30": "30 jours",
  month: "Ce mois",
};

// ── Helpers ──────────────────────────────────────────────────────

function pct(current: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((current - prev) / prev) * 100);
}

// ── Page ─────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const money = useMoney();
  const [period, setPeriod] = useState<Period>("7");
  const [daily, setDaily] = useState<DailyData[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (p: Period) => {
    setLoading(true);
    setError(false);
    try {
      const days = p === "today" ? 1 : p === "month" ? 31 : Number(p);
      const [dailyRes, statsRes] = await Promise.all([
        fetch(`/api/analytics?days=${days}`),
        fetch(`/api/stats/restaurant?period=${p}`),
      ]);
      if (!dailyRes.ok || !statsRes.ok) { setError(true); return; }
      const [dailyData, statsData] = await Promise.all([dailyRes.json(), statsRes.json()]);
      setDaily(dailyData);
      setStats(statsData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(period); }, [load, period]);

  // ── Dérivés ──────────────────────────────────────────────────────

  const totalRevenue = daily.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = daily.reduce((s, d) => s + d.orders, 0);
  const daysActive = daily.filter((d) => d.orders > 0).length;
  const avgDaily = daysActive > 0 ? Math.round(totalRevenue / daysActive) : 0;
  const bestDay = daily.reduce<DailyData | null>(
    (b, d) => (d.revenue > (b?.revenue ?? 0) ? d : b), null
  );

  const revPct = stats ? pct(stats.today.revenue, stats.yesterday.revenue) : null;
  const ordPct = stats ? pct(stats.today.orders, stats.yesterday.orders) : null;

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="font-semibold text-slate-900 mb-1">Impossible de charger les analytics</p>
        <p className="text-slate-500 text-sm mb-4">Session expirée ou erreur de connexion.</p>
        <button onClick={() => load(period)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header + Filtres ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">Analytics</h1>
          <p className="text-slate-500 text-sm mt-0.5">Performances et activité du restaurant</p>
        </div>
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl flex-wrap">
          {(["today", "7", "30", "month"] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                period === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Résumé du jour ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="text-lg">📅</span> Aujourd&apos;hui
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TodayCard
            label="Chiffre d'affaires"
            value={stats ? money(stats.today.revenue) : "—"}
            pct={revPct}
            loading={loading}
          />
          <TodayCard
            label="Commandes"
            value={stats ? stats.today.orders.toString() : "—"}
            pct={ordPct}
            loading={loading}
          />
          <TodayCard
            label="Ticket moyen"
            value={stats ? money(stats.today.avgTicket) : "—"}
            pct={null}
            loading={loading}
            sub="par commande"
          />
        </div>
      </div>

      {/* ── KPIs période ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon="💰" label={`CA (${PERIOD_LABELS[period]})`}
          value={money(totalRevenue)} loading={loading} />
        <StatCard icon="🛎️" label="Commandes"
          value={totalOrders.toString()} loading={loading} />
        <StatCard icon="📈" label="Moy. par jour actif"
          value={money(avgDaily)} loading={loading} />
        <StatCard icon="🏆" label="Meilleur jour"
          value={
            bestDay && bestDay.revenue > 0
              ? new Date(bestDay.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
              : "—"
          }
          sub={bestDay && bestDay.revenue > 0 ? money(bestDay.revenue) : undefined}
          loading={loading}
        />
      </div>

      {/* ── Graphique revenus ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
          <span className="text-lg">📊</span> Revenus — {PERIOD_LABELS[period]}
        </h2>
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <RevenueChart data={daily} period={period} />
        )}
      </div>

      {/* ── Top 5 plats + Heures de pointe ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top plats */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="text-lg">🍽️</span> Top 5 plats
            </h2>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !stats || stats.topDishes.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-400 text-sm">
              Aucune donnée sur cette période
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {stats.topDishes.map((dish, i) => {
                const maxCount = stats.topDishes[0].count;
                const barPct = Math.round((dish.count / maxCount) * 100);
                return (
                  <div key={dish.name} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-black text-slate-300 w-4">#{i + 1}</span>
                        <span className="font-semibold text-slate-900 text-sm truncate">{dish.name}</span>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <span className="text-orange-600 font-bold text-sm">{dish.count}×</span>
                        <span className="text-slate-400 text-xs ml-2">{money(dish.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-400 rounded-full transition-all"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Heures de pointe */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="text-lg">⏰</span> Heures de pointe
            </h2>
          </div>
          {loading ? (
            <div className="p-5 h-52 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !stats || stats.peakHours.every((h) => h.count === 0) ? (
            <div className="px-5 py-10 text-center text-slate-400 text-sm">
              Aucune donnée sur cette période
            </div>
          ) : (
            <PeakHoursChart data={stats.peakHours} />
          )}
        </div>
      </div>

      {/* ── Détail 7 jours ───────────────────────────────────────── */}
      {!loading && period === "7" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50">
            <h2 className="font-bold text-slate-900">Détail des 7 jours</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {[...daily].reverse().map((d) => (
              <div key={d.date} className="flex items-center justify-between px-6 py-3">
                <span className="text-sm text-slate-700">
                  {new Date(d.date + "T12:00:00").toLocaleDateString("fr-FR", {
                    weekday: "short", day: "numeric", month: "short",
                  })}
                </span>
                <div className="flex items-center gap-6">
                  <span className="text-xs text-slate-400">{d.orders} cmd</span>
                  <span className={`text-sm font-bold ${d.revenue > 0 ? "text-slate-900" : "text-slate-300"}`}>
                    {d.revenue > 0 ? money(d.revenue) : "—"}
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

// ── Composants ───────────────────────────────────────────────────

function TodayCard({ label, value, pct: pctVal, sub, loading }: {
  label: string; value: string; pct: number | null; sub?: string; loading: boolean;
}) {
  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{label}</div>
      {loading ? (
        <div className="h-7 bg-slate-200 rounded-lg animate-pulse" />
      ) : (
        <div className="flex items-end gap-2">
          <div className="text-xl font-extrabold text-slate-900 leading-tight">{value}</div>
          {pctVal !== null && (
            <span className={`text-xs font-bold mb-0.5 flex items-center gap-0.5 ${pctVal >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {pctVal >= 0 ? "▲" : "▼"} {Math.abs(pctVal)}%
            </span>
          )}
        </div>
      )}
      {sub && !loading && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
      {pctVal !== null && !loading && (
        <div className="text-[11px] text-slate-400 mt-1">vs hier</div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, loading }: {
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
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  );
}

function RevenueChart({ data, period }: { data: DailyData[]; period: Period }) {
  const W = 640, H = 210;
  const padL = 10, padR = 10, padT = 30, padB = 48;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const slotW = chartW / Math.max(data.length, 1);
  const isNarrow = data.length <= 7;
  const barW = Math.max(3, slotW - (isNarrow ? 14 : 3));
  const gridValues = [0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden="true" style={{ height: "210px" }}>
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
      {data.map((d, i) => {
        const x = padL + i * slotW + (slotW - barW) / 2;
        const barH = maxRevenue > 0 ? (d.revenue / maxRevenue) * chartH : 0;
        const y = padT + chartH - barH;
        const isToday = d.date === new Date().toISOString().split("T")[0];
        const showLabel = isNarrow || i % 5 === 0 || i === data.length - 1;
        const dateLabel = new Date(d.date + "T12:00:00").toLocaleDateString("fr-FR", {
          day: "numeric", month: isNarrow ? "short" : "numeric",
        });
        return (
          <g key={d.date}>
            <rect x={x} y={padT} width={barW} height={chartH} fill="#f8fafc" rx={2} />
            {d.revenue > 0 && (
              <rect x={x} y={y} width={barW} height={barH}
                fill={isToday ? "#ea580c" : "#f97316"} rx={2} opacity={0.9} />
            )}
            {showLabel && (
              <text x={padL + i * slotW + slotW / 2} y={H - padB + 16}
                textAnchor="middle" fontSize={isNarrow ? 10 : 8}
                fill={isToday ? "#f97316" : "#94a3b8"} fontWeight={isToday ? "bold" : "normal"}>
                {dateLabel}
              </text>
            )}
            {isNarrow && d.revenue > 0 && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={9}
                fill="#ea580c" fontWeight="bold">
                {d.revenue >= 1000 ? `${Math.round(d.revenue / 1000)}k` : `${d.revenue}`}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function PeakHoursChart({ data }: { data: Array<{ hour: number; count: number }> }) {
  const maxCount = Math.max(...data.map((h) => h.count), 1);
  const W = 400, H = 160;
  const padL = 8, padR = 8, padT = 16, padB = 32;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const slotW = chartW / data.length;
  const barW = Math.max(2, slotW - 4);

  return (
    <div className="px-5 pb-5 pt-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "160px" }}>
        {data.map((h, i) => {
          const barH = maxCount > 0 ? (h.count / maxCount) * chartH : 0;
          const x = padL + i * slotW + (slotW - barW) / 2;
          const y = padT + chartH - barH;
          const isPeak = h.count === maxCount && h.count > 0;
          return (
            <g key={h.hour}>
              <rect x={x} y={padT} width={barW} height={chartH} fill="#f8fafc" rx={2} />
              {h.count > 0 && (
                <rect x={x} y={y} width={barW} height={barH}
                  fill={isPeak ? "#ea580c" : "#fb923c"} rx={2} opacity={0.85} />
              )}
              {(i === 0 || i === 4 || i === 8 || i === 12 || i === 14) && (
                <text x={padL + i * slotW + slotW / 2} y={H - padB + 14}
                  textAnchor="middle" fontSize={8} fill="#94a3b8">
                  {h.hour}h
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-slate-400">8h</span>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-2.5 h-2.5 bg-orange-500 rounded-sm inline-block" />
          commandes / heure
        </div>
        <span className="text-xs text-slate-400">22h</span>
      </div>
    </div>
  );
}
