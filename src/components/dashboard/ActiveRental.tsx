"use client";

import { Icon } from "@/components/ui/Icon";

interface ActiveRentalProps {
  trailerName: string;
  unitId: string;
  hoursRemaining: number;
  totalHours: number;
}

export function ActiveRental({
  trailerName,
  unitId,
  hoursRemaining,
  totalHours,
}: ActiveRentalProps) {
  const progress = ((totalHours - hoursRemaining) / totalHours) * 100;

  return (
    <div className="bg-surface-container-high rounded-lg p-6 shadow-2xl relative overflow-hidden">
      {/* Decorative truck icon */}
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Icon name="local_shipping" filled className="text-8xl" />
      </div>

      <div className="relative z-10 space-y-6">
        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-widest text-red-500 uppercase">
            ACTIVE RENTAL
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white leading-tight">
            Current Rental: {trailerName}
          </h2>
          <p className="text-xs text-on-surface-variant font-medium">
            Unit ID: {unitId}
          </p>
        </div>

        {/* Time remaining */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-xs font-bold tracking-wider text-white uppercase">
              Time Remaining
            </span>
            <span className="text-xl font-headline font-bold text-red-500">
              {hoursRemaining}H{" "}
              <span className="text-xs opacity-60">/ {totalHours}H</span>
            </span>
          </div>
          <div className="h-3 w-full bg-surface-container-lowest rounded-full overflow-hidden p-[2px]">
            <div
              className="h-full bg-gradient-to-r from-red-800 to-red-500 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Extend button */}
        <button className="w-full bg-gradient-to-r from-[#B22222] to-[#f5534b] text-white py-4 rounded-md font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all duration-150">
          <Icon name="timer_10_alt_1" className="text-sm" />
          Extend Rental Time (+4 Hours)
        </button>
      </div>
    </div>
  );
}
