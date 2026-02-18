import React, { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { 
  PieChart as PieChartIcon, 
} from "lucide-react";
import PillTab from "../../PillTab";
import EmptyState from "../../../../ui/EmptyState";
import { ShadowCard } from "../../../../ui/ShadowCard";
import type { Company } from "../../../../types/company";

const COLORS = [
  "#0ea5e9",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#e11d48",
  "#06b6d4",
  "#84cc16",
];

type Person = {
  _id: string;
  name: string;
  roles?: string[];
  sharePercentage?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sharesData?: any[];
};

type ShareholdingCompany = {
  companyId: string | { _id: string; name: string };
  companyName?: string;
  sharePercentage?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sharesData?: any[];
};

interface SharePieChartProps {
  persons?: Person[];
  companies?: ShareholdingCompany[];
  title?: string;
  dateRangeLabel?: string;
  companyTotalShares?: number;
  companyTotalSharesArray?: Array<{ totalShares: number; class: string; type: string }>;
  authorizedShares?: number;
  issuedShares?: number;
}

type ChartData = {
  normalizedData: Array<{ name: string; value: number; totalShares?: number; type?: string }>;
  totalRaw: number;
  companyTotal: number;
  personTotal: number;
  personTotalShares: number;
  companyTotalShares: number;
  totalSharesSum: number;
  currentClassTotal: number;
};

const SharePieChart: React.FC<SharePieChartProps> = ({
  persons = [],
  companies = [],
  title = "Shareholders",
  dateRangeLabel = "",
  companyTotalShares = 0,
  companyTotalSharesArray = [],
  authorizedShares = 0,
  issuedShares = 0,
}) => {
  const [selectedView, setSelectedView] = useState<string>("authorized");

  const getClassTotal = (shareClass: string): number => {
    if (!Array.isArray(companyTotalSharesArray)) return 0;
    const item = companyTotalSharesArray.find(s => s.class === shareClass);
    return item ? Number(item.totalShares) || 0 : 0;
  };

  const availableClasses = useMemo(() => {
    if (!Array.isArray(companyTotalSharesArray) || companyTotalSharesArray.length === 0) return [];
    return companyTotalSharesArray
      .map(item => item.class)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => {
        const order: Record<string, number> = { "Ordinary": 0, "A": 1, "B": 2, "C": 3 };
        return (order[a] ?? 99) - (order[b] ?? 99);
      });
  }, [companyTotalSharesArray]);

  const chartsData = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filterSharesByClass = (sharesData: any[], classFilter: string): number => {
      if (!Array.isArray(sharesData)) return 0;
      return sharesData
        .filter(item => (item.class === classFilter || item.shareClass === classFilter))
        .reduce((sum, item) => sum + (Number(item.totalShares || item.issued) || 0), 0);
    };

    const calculateChartData = (shareClass: string): ChartData => {
      const currentTotal = getClassTotal(shareClass);
      
      const personData = (persons || []).map(p => {
        let totalShares = filterSharesByClass(p.sharesData || [], shareClass);
        let percentage = currentTotal > 0 ? (totalShares / currentTotal) * 100 : (shareClass === "Ordinary" ? (p.sharePercentage ?? 0) : 0);
        return { name: p.name, value: percentage, totalShares, type: "Person" };
      }).filter(d => !isNaN(d.value) && d.value > 0);

      const companyData = (companies || []).map(share => {
        let name = "Unknown Company";
        if (typeof share.companyId === 'object') name = share.companyId.name;
        else if (share.companyName) name = share.companyName;

        let totalShares = filterSharesByClass(share.sharesData || [], shareClass);
        let percentage = currentTotal > 0 ? (totalShares / currentTotal) * 100 : (shareClass === "Ordinary" ? (share.sharePercentage ?? 0) : 0);
        return { name, value: percentage, totalShares, type: "Company" };
      }).filter(d => !isNaN(d.value) && d.value > 0);

      const raw = [...personData, ...companyData];
      const personSum = personData.reduce((acc, d) => acc + d.value, 0);
      const companySum = companyData.reduce((acc, d) => acc + d.value, 0);
      const sum = raw.reduce((acc, d) => acc + d.value, 0);
      const personTotalShares = personData.reduce((acc, d) => acc + (d.totalShares || 0), 0);
      const companySharesTotal = companyData.reduce((acc, d) => acc + (d.totalShares || 0), 0);
      const totalSharesSum = personTotalShares + companySharesTotal;

      if (sum <= 0) return { normalizedData: [], totalRaw: 0, companyTotal: 0, personTotal: 0, personTotalShares: 0, companyTotalShares: 0, totalSharesSum: 0, currentClassTotal: currentTotal };

      let parts = [...raw];
      if (sum > 100) {
        const scale = 100 / sum;
        parts = raw.map(d => ({ ...d, value: d.value * scale }));
      } else if (sum < 100) {
        const remaining = 100 - sum;
        if (remaining > 0.0001) {
          parts.push({ name: "Remaining Shares", value: remaining, totalShares: Math.round((remaining / 100) * currentTotal), type: "Remaining" });
        }
      }

      return { normalizedData: parts, totalRaw: sum, companyTotal: companySum, personTotal: personSum, personTotalShares, companyTotalShares: companySharesTotal, totalSharesSum, currentClassTotal: currentTotal };
    };

    return availableClasses.map(shareClass => ({ shareClass, data: calculateChartData(shareClass) }))
      .filter(item => item.data.currentClassTotal > 0 || (item.shareClass === "Ordinary" && item.data.totalRaw > 0));
  }, [persons, companies, companyTotalSharesArray, availableClasses]);

  const totalViewData = useMemo((): ChartData => {
    const currentTotal = issuedShares || companyTotalShares;
    const raw = [...(persons || []), ...(companies || [])].map(p => {
      const name = "companyName" in p ? p.companyName : ("name" in p ? p.name : "Unknown");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalShares = (p.sharesData || []).reduce((sum, item: any) => sum + (Number(item.totalShares || item.issued || 0)), 0);
      const percentage = currentTotal > 0 ? (totalShares / currentTotal) * 100 : ("sharePercentage" in p ? (p.sharePercentage ?? 0) : 0);
      return { name: name || "Unknown", value: percentage, totalShares, type: "companyId" in p ? "Company" : "Person" };
    }).filter(d => d.value > 0);

    const sum = raw.reduce((acc, d) => acc + d.value, 0);
    let parts = [...raw];
    if (sum < 100) {
      parts.push({ name: "Remaining Shares", value: 100 - sum, totalShares: Math.round(((100 - sum) / 100) * currentTotal), type: "Remaining" });
    }

    return { normalizedData: parts, totalRaw: sum, companyTotal: 0, personTotal: 0, personTotalShares: 0, companyTotalShares: 0, totalSharesSum: currentTotal, currentClassTotal: currentTotal };
  }, [persons, companies, issuedShares, companyTotalShares]);

  const classesViewData = useMemo((): ChartData => {
    const total = (companyTotalSharesArray || []).reduce((acc, item) => acc + (Number(item.totalShares) || 0), 0);
    const normalizedData = (companyTotalSharesArray || []).map(item => ({
      name: item.class === "Ordinary" ? "Ordinary Shares" : `Class ${item.class}`,
      value: total > 0 ? (Number(item.totalShares) / total) * 100 : 0,
      totalShares: Number(item.totalShares),
      type: "Class"
    })).filter(d => d.value > 0);
    return { normalizedData, totalRaw: 100, companyTotal: 0, personTotal: 0, personTotalShares: 0, companyTotalShares: 0, totalSharesSum: total, currentClassTotal: total };
  }, [companyTotalSharesArray]);

  const tabs = useMemo(() => {
    const t = [];
    if (authorizedShares > 0) t.push({ id: "authorized", label: "Authorized Share" });
    t.push({ id: "classes", label: "Classes" });
    t.push({ id: "total", label: "Issued Share" });
    chartsData.forEach(({ shareClass }) => t.push({ id: shareClass, label: shareClass === "Ordinary" ? "Ordinary Share" : `Class ${shareClass} Share` }));
    return t;
  }, [authorizedShares, chartsData]);

  const renderPieChart = (shareClass: string, chartData: ChartData, label: string) => (
    <div key={shareClass} className="w-full bg-white border border-gray-100 rounded-3xl p-6 md:p-8 animate-in fade-in zoom-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <h5 className="text-xl font-bold text-gray-900">{label}</h5>
        {dateRangeLabel && <div className="text-sm font-medium text-gray-500">{dateRangeLabel}</div>}
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData.normalizedData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="80%"
              paddingAngle={0}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              label={({ name, value, cx, cy, midAngle, outerRadius }: any) => {
                if (typeof midAngle === 'undefined' || typeof cx === 'undefined' || typeof cy === 'undefined' || typeof outerRadius === 'undefined') return null;
                const RADIAN = Math.PI / 180;
                const radius = (outerRadius as number) * 1.2;
                const x = (cx as number) + radius * Math.cos(-midAngle * RADIAN);
                const y = (cy as number) + radius * Math.sin(-midAngle * RADIAN);
                const isRemaining = name === "Remaining Shares";
                
                return (
                  <text 
                    x={x} 
                    y={y} 
                    fill={isRemaining ? "#000000" : "#374151"} 
                    textAnchor={x > (cx as number) ? 'start' : 'end'} 
                    dominantBaseline="central"
                    style={{ fontSize: '10px', fontWeight: isRemaining ? 900 : 700 }}
                  >
                    {`${name}: ${value.toFixed(1)}%`}
                  </text>
                );
              }}
            >
              {chartData.normalizedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.name === "Remaining Shares" ? "#f3f4f6" : COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(val: number | undefined) => [`${(val || 0).toFixed(2)}%`, "Percentage"]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-50 space-y-2">
        <p className="text-gray-900 font-medium">
          Total: <span className="font-bold">{chartData.totalRaw.toFixed(2)}%</span>
          {chartData.totalSharesSum > 0 && <span className="text-gray-500 ml-2">({chartData.totalSharesSum.toLocaleString()} / {chartData.currentClassTotal.toLocaleString()} shares)</span>}
        </p>
      </div>
    </div>
  );

  const getCurrentChart = () => {
    if (selectedView === "total") return renderPieChart("total", totalViewData, "Issued Shares Breakdown");
    if (selectedView === "classes") return renderPieChart("classes", classesViewData, "Share Class Distribution");
    if (selectedView === "authorized") {
      const issued = issuedShares || companyTotalShares;
      const unissued = Math.max(0, authorizedShares - issued);
      const data: ChartData = { normalizedData: [
        { name: "Issued Shares", value: (issued / authorizedShares) * 100, totalShares: issued, type: "Status" },
        { name: "Remaining Shares", value: (unissued / authorizedShares) * 100, totalShares: unissued, type: "Status" }
      ].filter(d => d.value > 0), totalRaw: 100, companyTotal: 0, personTotal: 0, personTotalShares: 0, companyTotalShares: 0, totalSharesSum: issued, currentClassTotal: authorizedShares };
      return renderPieChart("authorized", data, "Authorized vs Issued Shares");
    }
    const chart = chartsData.find(c => c.shareClass === selectedView);
    return chart ? renderPieChart(chart.shareClass, chart.data, `${chart.shareClass} Shares`) : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
      </div>
      <PillTab tabs={tabs} activeTab={selectedView} onTabChange={setSelectedView} />
      {getCurrentChart() || (
        <EmptyState 
          icon={PieChartIcon} 
          title="No Distribution Data" 
          description="We couldn't find any share distribution data for this category." 
        />
      )}
    </div>
  );
};

interface DistributionTabProps {
  company: Company;
}

const DistributionTab: React.FC<DistributionTabProps> = ({ company }) => {
  const persons = useMemo(() => (company.involvements || [])
    .filter(inv => inv.partyType === 'PERSON')
    .map(inv => ({
      _id: inv.id,
      name: inv.person?.name || "Unnamed",
      sharePercentage: 0,
      sharesData: [
        { class: 'A', totalShares: inv.classA || 0 },
        { class: 'B', totalShares: inv.classB || 0 },
        { class: 'C', totalShares: inv.classC || 0 },
        { class: 'Ordinary', totalShares: inv.ordinary || 0 },
      ].filter(s => s.totalShares > 0)
    })), [company]);

  const companies = useMemo(() => (company.involvements || [])
    .filter(inv => inv.partyType === 'COMPANY')
    .map(inv => ({
      companyId: inv.id,
      companyName: inv.holderCompany?.name || "Unnamed Company",
      sharePercentage: 0,
      sharesData: [
        { class: 'A', totalShares: inv.classA || 0 },
        { class: 'B', totalShares: inv.classB || 0 },
        { class: 'C', totalShares: inv.classC || 0 },
        { class: 'Ordinary', totalShares: inv.ordinary || 0 },
      ].filter(s => s.totalShares > 0)
    })), [company]);

  return (
    <ShadowCard className="p-8 border-none bg-white rounded-[40px] animate-in fade-in duration-500">
      <SharePieChart
        persons={persons}
        companies={companies}
        title={company.name}
        companyTotalShares={company.issuedShares}
        companyTotalSharesArray={(company.shareClasses || []).map(sc => ({
          class: sc.class.replace('CLASS_', ''),
          totalShares: sc.issued,
          type: "Issued"
        }))}
        authorizedShares={company.authorizedShares}
        issuedShares={company.issuedShares}
      />
    </ShadowCard>
  );
};

export default DistributionTab;
