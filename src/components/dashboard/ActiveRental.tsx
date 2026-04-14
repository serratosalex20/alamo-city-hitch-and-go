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
    <section
      className="bg-surface-container-high rounded-lg p-6 shadow-2xl relative overflow-hidden"
      aria-label="Active rental status"
    >
      {/* Decorative truck icon */}
      <div className="absolute top-0 right-0 p-4 opacity-10" aria-hidden="true">
        <Icon name="local_shipping" filled className="text-8xl" />
      </div>

      <div className="relative z-10 space-y-6">
        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-widest text-primary-container uppercase">
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
            <span id="rental-progress-label" className="text-xs font-bold tracking-wider text-white uppercase">
              Time Remaining
            </span>
            <span className="text-xl font-headline font-bold text-primary-container">
              {hoursRemaining}H{" "}
              <span className="text-xs opacity-60">/ {totalHours}H</span>
            </span>
          </div>
          <div className="h-3 w-full bg-surface-container-lowest rounded-full overflow-hidden p-[2px]">
            <div
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-labelledby="rental-progress-label"
              aria-valuetext={`${hoursRemaining} hours remaining out of ${totalHours} hours`}
              className="h-full bg-gradient-to-r from-primary-container to-on-primary-container rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Extend button */}
        <button
          aria-label="Extend rental time by 4 hours"
          className="w-full min-h-[44px] bg-primary-container hover:brightness-110 text-white py-4 font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all duration-150"
        >
          <Icon name="timer_10_alt_1" className="text-sm" />
          Extend Rental Time (+4 Hours)
        </button>
      </div>
    </section>
  );
}
