import { Icon } from "@/components/ui/Icon";

const features = [
  {
    icon: "speed",
    title: "Rapid Pickup",
    description:
      "Skip the paperwork. Our digital-first booking gets you on the road in under 5 minutes.",
    borderColor: "border-secondary",
    iconColor: "text-secondary",
  },
  {
    icon: "verified_user",
    title: "Pro-Inspected",
    description:
      "Every unit undergoes a 25-point safety inspection before every single rental.",
    borderColor: "border-primary",
    iconColor: "text-primary",
  },
  {
    icon: "support_agent",
    title: "24/7 Support",
    description:
      "Roadside assistance and hauling experts on standby for every mile of your journey.",
    borderColor: "border-tertiary",
    iconColor: "text-tertiary",
  },
];

export function FeatureGrid() {
  return (
    <section className="px-8 md:px-16 py-24 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature) => (
          <div
            key={feature.title}
            className={`bg-surface-container p-10 flex flex-col gap-6 border-b-4 ${feature.borderColor} transition-all hover:bg-surface-container-high`}
          >
            <Icon
              name={feature.icon}
              className={`text-4xl ${feature.iconColor}`}
            />
            <h3 className="font-headline text-2xl font-bold tracking-tight uppercase">
              {feature.title}
            </h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
