"use client";

import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { Trailer } from "@/types/models";

interface TrailerCardProps {
  trailer: Trailer;
}

const specRows = (trailer: Trailer) => [
  {
    icon: "weight",
    label: "Weight Capacity",
    value: `${trailer.specs.gvwr.toLocaleString()} LBS GVWR`,
  },
  {
    icon: "settings_input_component",
    label: "Hitch Size",
    value: trailer.specs.hitchSize,
  },
  {
    icon: "aspect_ratio",
    label: "Dimensions",
    value: trailer.specs.heightInches
      ? `${trailer.specs.widthInches}" W x ${trailer.specs.lengthFeet}' L x ${trailer.specs.heightInches}" H`
      : `${trailer.specs.widthInches}" W x ${trailer.specs.lengthFeet}' L`,
  },
];

export function TrailerCard({ trailer }: TrailerCardProps) {
  return (
    <div className="group relative flex flex-col bg-surface-container-low border border-white/5 transition-all duration-500 hover:border-primary/30">
      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden bg-surface-container relative">
        <Image
          src={trailer.imageUrl}
          alt={`${trailer.name} — heavy-duty trailer available for rental in San Antonio`}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
        />
      </div>

      {/* Content */}
      <div className="p-8 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-2xl font-headline font-bold uppercase tracking-tight text-white">
            {trailer.name}
          </h3>
          <span className="text-primary font-headline font-bold">
            ${trailer.pricing.rate24h}/DAY
          </span>
        </div>

        {/* Specs */}
        <div className="space-y-4 mb-10 flex-grow">
          {specRows(trailer).map((spec, i) => (
            <div
              key={spec.icon}
              className={`flex items-center gap-4 py-2 ${
                i < 2 ? "border-b border-white/5" : ""
              }`}
            >
              <Icon name={spec.icon} className="text-primary text-sm" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                  {spec.label}
                </span>
                <span className="text-sm font-bold text-white">
                  {spec.value}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href={`/book?trailer=${trailer.slug}`}
          className="w-full bg-white/5 group-hover:bg-primary-action group-hover:text-white text-white py-4 font-headline font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/5"
        >
          RENT THIS TRAILER
          <Icon name="add_shopping_cart" className="text-sm" />
        </Link>
      </div>

      {/* Badge */}
      {trailer.badge && (
        <div className="absolute top-4 left-4 pointer-events-none">
          <div className="bg-primary-action/80 backdrop-blur-md text-white border border-primary/30 px-3 py-1 text-[10px] font-bold uppercase tracking-tighter">
            {trailer.badge}
          </div>
        </div>
      )}
    </div>
  );
}
