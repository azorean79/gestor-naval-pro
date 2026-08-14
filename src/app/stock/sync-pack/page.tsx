"use client";

import React from "react";
import PackSyncPanel from "@/components/stock/PackSyncPanel";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function StockSyncPackPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/stock"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-bold">Voltar ao Stock</span>
          </Link>
        </div>

        <PackSyncPanel />
      </div>
    </div>
  );
}
