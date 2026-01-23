"use client";

import React from "react";
import { ShadowCard } from "../../ui/ShadowCard";
import { cn } from "../../lib/utils";

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  activeCompany?: string;
  badge?: React.ReactNode;
  riskLevel?: {
    level: string;
    color: string;
  };
  actions?: React.ReactNode;
  className?: string;
  animate?: boolean;
}

export const PageHeader = ({
  title,
  subtitle,
  description,
  icon: Icon,
  activeCompany,
  badge,
  riskLevel,
  actions,
  className,
  animate = true,
}: PageHeaderProps) => {
  const hasStatusBar = !!(activeCompany || badge || riskLevel);

  return (
    <ShadowCard animate={animate} className={cn("p-8 bg-[#0f1729] border-white/10", className)}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {Icon && (
              <div className="w-12 h-12 rounded-lg bg-white/15 flex items-center justify-center border border-white/30 shrink-0 shadow-sm">
                <Icon className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="space-y-1">
              <h1 className="md:text-3xl text-2xl font-semibold text-white tracking-tight">
                {title}
              </h1>
              {subtitle && <p className="text-white/60 font-medium">{subtitle}</p>}
              {description && (
                <p className="text-white/50 text-sm max-w-2xl pt-2 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
          
          {hasStatusBar && (
            <div className="flex flex-wrap items-center gap-4">
              {activeCompany && (
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm">
                  <span className="text-xs font-medium text-white/80 uppercase tracking-widest">Company</span>
                  <div className="h-4 w-px bg-white/10" />
                  <span className="text-sm font-bold text-white">{activeCompany}</span>
                </div>
              )}
              
              {badge}

              {riskLevel && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 font-bold text-xs uppercase tracking-widest shadow-sm text-white">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    riskLevel.level === "High" ? "bg-destructive" : 
                    riskLevel.level === "Medium" ? "bg-warning" : "bg-success"
                  )}></span>
                  Overall Risk Level: <span className={cn(
                    riskLevel.level === "High" ? "text-red-300" : 
                    riskLevel.level === "Medium" ? "text-yellow-300" : "text-green-300"
                  )}>{riskLevel.level}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-4">
            {actions}
          </div>
        )}
      </div>
    </ShadowCard>
  );
};

export default PageHeader;
