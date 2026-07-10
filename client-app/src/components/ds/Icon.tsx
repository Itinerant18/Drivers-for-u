/**
 * Icon.tsx — Vahnly Driver App Icon System
 *
 * Static:   @tabler/icons-react (stroke-based, currentColor, strokeWidth 1.8)
 * Custom:   Inline SVG components for domain-specific icons Tabler lacks
 * Animated: @lordicon/react (Lottie JSON, colorful, hover/loop triggers)
 *
 * Icons8 MCP is configured in .mcp.json for searching replacement icons.
 * Search query per icon is annotated in comments below for future upgrades.
 * API: https://mcp.icons8.com/mcp/  Style target: Material Rounded / iOS
 */

import React, { useRef } from 'react';
import { Player } from '@lordicon/react';

// ─── TABLER STATIC ICONS (re-exported with Vahnly names) ───────────────────

export { IconPhone as PhoneIcon }           from '@tabler/icons-react';
export { IconMessageCircle as ChatIcon }    from '@tabler/icons-react';
export { IconNavigation as NavigateIcon }   from '@tabler/icons-react';
export { IconCash as CashIcon }             from '@tabler/icons-react';
export { IconCreditCard as CardIcon }       from '@tabler/icons-react';
export { IconShield as ShieldIcon }         from '@tabler/icons-react';
export { IconCar as CarIcon }               from '@tabler/icons-react';
export { IconAlertTriangle as AlertIcon }   from '@tabler/icons-react';
export { IconCheck as CheckIcon }           from '@tabler/icons-react';
export { IconBell as BellIcon }             from '@tabler/icons-react';
export { IconPlus as PlusIcon }             from '@tabler/icons-react';
export { IconParking as ParkingIcon }       from '@tabler/icons-react';
// Icons8 query: "siren emergency light beacon" — custom SVG below ↓
export { IconCamera as CameraIcon }         from '@tabler/icons-react';
export { IconX as CrossIcon }               from '@tabler/icons-react';
export { IconRefresh as RefreshIcon }       from '@tabler/icons-react';
export { IconMenu2 as MenuIcon }            from '@tabler/icons-react';
// Icons8 query: "gps signal cellular bars mobile" — was IconWifi (WiFi ≠ GPS/cellular)
export { IconCellSignal4 as SignalIcon }     from '@tabler/icons-react';
export { IconAlertOctagon as OctagonAlertIcon } from '@tabler/icons-react';
export { IconFlame as FlameIcon }           from '@tabler/icons-react';
export { IconPlayerPause as PauseIcon }     from '@tabler/icons-react';
export { IconTool as WrenchIcon }           from '@tabler/icons-react';
export { IconClock as ClockIcon }           from '@tabler/icons-react';
export { IconRoute as RouteIcon }           from '@tabler/icons-react';
export { IconHome as HomeIcon }             from '@tabler/icons-react';
export { IconWallet as PaymentIcon }        from '@tabler/icons-react';
export { IconMapPin as PinIcon }            from '@tabler/icons-react';
export { IconUser as UserIcon }             from '@tabler/icons-react';
export { IconSearch as SearchIcon }         from '@tabler/icons-react';
export { IconArrowLeft as BackIcon }        from '@tabler/icons-react';

// ─── NEW ICONS (emoji replacements + semantic additions) ───────────────────

export { IconStar as StarIcon }             from '@tabler/icons-react';
export { IconWallet as WalletIcon }         from '@tabler/icons-react';
export { IconReceipt as BookingIcon }       from '@tabler/icons-react';
export { IconGift as GiftIcon }             from '@tabler/icons-react';
export { IconTrophy as TrophyIcon }         from '@tabler/icons-react';
export { IconMapPin as LocationIcon }       from '@tabler/icons-react';
export { IconHelp as SupportIcon }          from '@tabler/icons-react';
export { IconFile as DocumentIcon }         from '@tabler/icons-react';
export { IconBell as NotificationIcon }     from '@tabler/icons-react';
export { IconSettings as SettingsIcon }     from '@tabler/icons-react';
export { IconShare as ShareIcon }           from '@tabler/icons-react';
export { IconCamera as CameraOutlineIcon }  from '@tabler/icons-react';
export { IconInfoCircle as InfoIcon }       from '@tabler/icons-react';
export { IconLogout as LogoutIcon }         from '@tabler/icons-react';
export { IconAlertTriangle as WarningIcon } from '@tabler/icons-react';
export { IconCircleCheck as SuccessIcon }   from '@tabler/icons-react';
export { IconCircleX as ErrorIcon }         from '@tabler/icons-react';
export { IconBuildingSkyscraper as WorkIcon } from '@tabler/icons-react';
export { IconHome2 as HomeAddressIcon }     from '@tabler/icons-react';
export { IconDoor as LogoutDoorIcon }       from '@tabler/icons-react';
export { IconChevronRight as ChevronIcon }  from '@tabler/icons-react';
export { IconChevronDown as ChevronDownIcon } from '@tabler/icons-react';
// Icons8 query: "car sedan taxi private vehicle" — was IconBus (bus ≠ private sedan)
export { IconCar as VehicleIcon }           from '@tabler/icons-react';
export { IconLock as LockIcon }             from '@tabler/icons-react';
export { IconFlag as FlagIcon }             from '@tabler/icons-react';
export { IconEdit as EditIcon }             from '@tabler/icons-react';
export { IconDownload as DownloadIcon }     from '@tabler/icons-react';
export { IconExternalLink as LinkIcon }     from '@tabler/icons-react';
export { IconPhoto as PhotoIcon }           from '@tabler/icons-react';
export { IconBriefcase as WorkBriefcaseIcon } from '@tabler/icons-react';

// ─── NEW: SEMANTIC SPLIT — fuel vs. heatmap ────────────────────────────────
// FlameIcon = surge/heatmap demand indicator on the dashboard map toggle.
// FuelIcon  = fuel reimbursement transactions in the driver wallet.
// Icons8 query: "gas station fuel petrol pump"
export { IconGasStation as FuelIcon }       from '@tabler/icons-react';

// ─── NEW: ACCOUNT SIDEBAR ALIASES ─────────────────────────────────────────
// These were previously raw @tabler/icons-react imports in driver-account/layout.tsx,
// bypassing this icon system. Centralised here so they're themeable and searchable.
// Icons8 queries:
//   DashboardIcon  → "mobile phone driver dashboard"
//   EarningsIcon   → "rupee currency india money earnings"
//   TripHistoryIcon→ "folder history trips archive"
//   PerformanceIcon→ "chart bar analytics performance"
//   TrainingIcon   → "school training academy learning"
export { IconDeviceMobile as DashboardIcon }    from '@tabler/icons-react';
export { IconCurrencyRupee as EarningsIcon }    from '@tabler/icons-react';
export { IconFolder as TripHistoryIcon }        from '@tabler/icons-react';
export { IconChartBar as PerformanceIcon }      from '@tabler/icons-react';
export { IconSchool as TrainingIcon }           from '@tabler/icons-react';

// ─── ICON PROPS TYPE ────────────────────────────────────────────────────────
export interface IconProps {
  size?: number;
  color?: string;
  stroke?: number;
  className?: string;
}

// ─── ICON SIZE TOKENS ───────────────────────────────────────────────────────
// Use these constants instead of magic number `size={20}` across the app.
// Tabler icons accept a numeric `size` prop directly.
//
//   xs   → inline within text / status dots
//   sm   → compact banners, secondary actions, SOS button
//   md   → nav sidebar items, menu entries
//   lg   → action-row buttons (Call / Chat / Navigate grid)
//   xl   → card / form leading icons
//   hero → full-page empty-state icons (offline map overlay, etc.)
//
export const ICON_SIZE = {
  xs:   12,
  sm:   14,
  md:   18,
  lg:   20,
  xl:   24,
  hero: 40,
} as const;
export type IconSize = (typeof ICON_SIZE)[keyof typeof ICON_SIZE];

// ─── CUSTOM SVG: SirenIcon ───────────────────────────────────────────────────
// REPLACED: was IconAlertOctagon (a generic stop-sign shape — wrong for SOS/emergency).
// This is an emergency beacon/police-light icon: dome + housing + stand + flash rays.
// Matches Tabler aesthetic: 24×24 viewBox, stroke-based, currentColor, strokeWidth 1.8.
// Icons8 query (for future upgrade): "police siren light emergency beacon rotating"
//
export const SirenIcon: React.FC<IconProps & React.SVGProps<SVGSVGElement>> = ({
  size = 24,
  color = 'currentColor',
  className = '',
  ...svgProps
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...svgProps}
  >
    {/* Flash rays — three spikes like a rotating emergency light */}
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="5.3" y1="4.3" x2="6.7" y2="5.7" />
    <line x1="18.7" y1="4.3" x2="17.3" y2="5.7" />
    {/* Dome — semicircle light glass */}
    <path d="M6 12a6 6 0 1 1 12 0" />
    {/* Housing body */}
    <rect x="5" y="12" width="14" height="3" rx="1" />
    {/* Stand struts */}
    <line x1="8" y1="15" x2="8" y2="18" />
    <line x1="16" y1="15" x2="16" y2="18" />
    {/* Base */}
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

// ─── ANIMATED ICON COMPONENT (Lordicon) ────────────────────────────────────
interface AnimatedIconProps {
  src: object;          // Lottie JSON object
  size?: number;        // default 48
  trigger?: 'in' | 'hover' | 'loop' | 'loop-on-hover' | 'click' | 'boomerang';
  colors?: string;      // e.g. "primary:#FF6B35,secondary:#1A73E8"
  className?: string;
  autoPlay?: boolean;
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  src,
  size = 48,
  trigger = 'in',
  colors,
  className = '',
  autoPlay = true,
}) => {
  const playerRef = useRef<Player>(null);

  React.useEffect(() => {
    if (autoPlay) {
      playerRef.current?.playFromBeginning();
    }
  }, [autoPlay]);

  return (
    <span
      className={className}
      style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseEnter={() => (trigger === 'hover' || trigger === 'loop-on-hover') && playerRef.current?.playFromBeginning()}
    >
      <Player
        ref={playerRef}
        icon={src}
        size={size}
        colorize={colors}
      />
    </span>
  );
};
