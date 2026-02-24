"use client";

import Link from "next/link";
import {
  ShoppingBag,
  Store,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Brain,
  Lightbulb,
  Pencil,
  Link2,
  Upload,
} from "lucide-react";

interface OverviewTabProps {
  totalProducts: number;
  productsWithNotes: number;
  shopsReviewed: number;
  monthIncome: number;
  monthExpense: number;
  upcomingEvents: Array<{
    id: string;
    name: string;
    startDate: string;
    daysUntil: number;
  }>;
  feedbackCount: number;
  confidenceLabel: string;
}

function formatVNDFull(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(amount)) + "d";
}

export function OverviewTab({
  totalProducts,
  productsWithNotes,
  shopsReviewed,
  monthIncome,
  monthExpense,
  upcomingEvents,
  feedbackCount,
  confidenceLabel,
}: OverviewTabProps): React.ReactElement {
  const profit = monthIncome - monthExpense;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              San pham
            </p>
          </div>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
            {totalProducts}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            ghi chu: {productsWithNotes}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Store className="w-4 h-4 text-purple-500" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Shop danh gia
            </p>
          </div>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
            {shopsReviewed}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Thu thang
            </p>
          </div>
          <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            {formatVNDFull(monthIncome)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-rose-500" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Chi thang
            </p>
          </div>
          <p className="text-2xl font-semibold text-rose-600 dark:text-rose-400">
            {formatVNDFull(monthExpense)}
          </p>
          <p
            className={`text-xs mt-1 ${
              profit >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            Lai: {profit >= 0 ? "+" : ""}
            {formatVNDFull(profit)}
          </p>
        </div>
      </div>

      {/* Upcoming events */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-50">
            Su kien sap toi
          </h3>
        </div>
        {upcomingEvents.length > 0 ? (
          <div className="space-y-3">
            {upcomingEvents.slice(0, 5).map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 text-sm"
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    event.daysUntil <= 3
                      ? "bg-rose-500"
                      : event.daysUntil <= 7
                        ? "bg-amber-500"
                        : event.daysUntil <= 14
                          ? "bg-blue-500"
                          : "bg-gray-400"
                  }`}
                />
                <span className="text-gray-900 dark:text-gray-50 font-medium">
                  {event.name}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  con {event.daysUntil} ngay
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Khong co su kien sap toi
          </p>
        )}
      </div>

      {/* AI data summary */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-purple-500" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-50">
            Du lieu AI
          </h3>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">
              Feedback:{" "}
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-50">
              {feedbackCount}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">
              Confidence:{" "}
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-50">
              {confidenceLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-4 sm:p-6 border border-blue-100 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-50">
            Goi y
          </h3>
        </div>
        <ul className="space-y-2.5">
          {productsWithNotes === 0 && (
            <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Pencil className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <span>
                Them ghi chu cho Top 10 SP de theo doi kinh nghiem ca
                nhan
              </span>
            </li>
          )}
          <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Link2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <span>
              Them link affiliate cho SP muon promote de theo doi
            </span>
          </li>
          {feedbackCount === 0 && (
            <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Upload className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <span>
                Upload ket qua chien dich dau tien de AI bat dau hoc
              </span>
            </li>
          )}
          {upcomingEvents.length > 0 && (
            <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
              <CalendarDays className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <span>
                Chuan bi content cho{" "}
                <strong>{upcomingEvents[0].name}</strong> (con{" "}
                {upcomingEvents[0].daysUntil} ngay)
              </span>
            </li>
          )}
        </ul>
        <div className="mt-4">
          <Link
            href="/products"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Xem danh sach san pham →
          </Link>
        </div>
      </div>
    </div>
  );
}
