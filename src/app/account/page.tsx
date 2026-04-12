import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { ActiveRental } from "@/components/dashboard/ActiveRental";
import { DocumentList } from "@/components/dashboard/DocumentList";
import { BottomNav } from "@/components/dashboard/BottomNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fleet Command | Alamo City Hitch & Go Co.",
  description: "Manage your active trailer rental, extend time, and access your documents.",
};

export default function AccountPage() {
  return (
    <>
      {/* TopAppBar */}
      <header className="bg-background fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 border-b border-white/5 backdrop-blur-md shadow-[0px_20px_40px_rgba(0,0,0,0.25)]">
        <div className="flex items-center gap-3">
          <Icon name="menu" className="text-red-600" />
          <span className="text-2xl font-black tracking-tighter text-white uppercase italic font-headline">
            HAULER_COMMAND
          </span>
        </div>
        <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10">
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeIibQ_F8hOa8U-HrDqH_n2KWIh4TBHQr_6HZhHYVNOjW4iWj2avuQJhgxr6GCEyqFvwcYg3z9-2GfFYl0f9ux4ktpsgayMiawgztY57e67gfReWk1EmVE8BtDIphybFlXgoRSaTpFtObgSW6jwxABWKYgNLl3HImWHSYb8HvoiDZbIyYf4pG48AyCY_1pq_1O8gbi0_eAZLOMRK4O-uz3NHMBTrPZV0v8FHaT6gP2ID-Ihf33XbZnwwj4_1YEFzGgE7VHs304VtU"
            alt="Profile"
            width={40}
            height={40}
            className="object-cover"
          />
        </div>
      </header>

      <main className="pt-24 px-5 space-y-8 max-w-md mx-auto pb-28">
        {/* Welcome */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold tracking-[0.2em] text-on-surface-variant uppercase">
            ALAMO CITY HITCH &amp; GO CO.
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white uppercase italic font-headline">
            FLEET COMMAND
          </h1>
        </div>

        {/* Active Rental */}
        <ActiveRental
          trailerName="10' Utility Trailer"
          unitId="#TX-48092-B"
          hoursRemaining={18}
          totalHours={24}
        />

        {/* Documents */}
        <DocumentList />

        {/* Security Status */}
        <section className="bg-surface-container-low rounded-lg border border-white/5 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                  Security Status
                </p>
                <p className="text-sm font-bold text-white">Verified Account</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                Last Login
              </p>
              <p className="text-sm font-bold text-white">Today, 08:42 AM</p>
            </div>
          </div>
        </section>

        {/* Map Preview */}
        <div className="rounded-lg overflow-hidden h-32 relative grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBiX1wus2YyPxIkCrUffggEjpc24ch97ZiGD5bevb4Lxea4nY_l05xEcspo5AIPRxldzh78EfdisVXn28Pm-OFf71lCjVdk4PNcAWJpRlf5oN6m99oBFA4d7X9sK8BZE0YJUh026Yi34mlrXnePsoNE4QW04KG663kqNIX8Tl0Oroc376F_JXKdc47eV7C3XoGUzMD2qDzPdWuzMtmdFjzvWTBa5Jrk2WN3g0J27MKOxxLqzvMqen1dtaEkCaIljOZfQX0_KOXUSfw"
            alt="Map of San Antonio rental location"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <Icon name="location_on" className="text-xs text-red-500" />
            <span className="text-[10px] font-bold text-white tracking-widest uppercase">
              Rental Location: San Antonio, TX
            </span>
          </div>
        </div>
      </main>

      <BottomNav />
    </>
  );
}
