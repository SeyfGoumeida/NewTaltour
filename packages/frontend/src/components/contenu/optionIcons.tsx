import { Armchair, Baby, CalendarX, CarFront, Crown, Globe, House, Infinity as InfinityIcon, Package, ShieldCheck, Smile, UsersRound, Wifi, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const OPTION_ICONS: Record<string, LucideIcon> = {
  multiconducteur: UsersRound,
  km_illimite: InfinityIcon,
  chauffeur: CarFront,
  siege_bebe: Baby,
  rehausseur: Armchair,
  livraison_domicile: House,
  assurance_annulation: CalendarX,
  gold: ShieldCheck,
  vip: Crown,
  siege_enfant: Smile,
  wifi: Wifi,
  sortie_pays: Globe,
  mini_compresseur: Wrench,
};

export function OptionIcon({ code, className }: { code: string; className?: string }) {
  const Icon = OPTION_ICONS[code] ?? Package;
  return <Icon className={className} aria-hidden />;
}
