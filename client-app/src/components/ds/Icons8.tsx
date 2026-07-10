/**
 * Icons8.tsx — Vahnly 3D Icon System
 *
 * Renders Icons8 3D Fluency icons from locally-downloaded PNG assets.
 * Files live in client-app/public/icons8/{slug}.png (94×94 source).
 *
 * Source: https://icons8.com/icons/set/3d-fluency
 * Attribution: Icons by Icons8 — https://icons8.com
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *   import { SirenIcon3D, CarIcon3D, NavigateIcon3D } from '@/components/ds/Icons8';
 *   <SirenIcon3D size={32} />
 *   <CarIcon3D size={24} className="opacity-90" />
 *
 * ─── Size guide ──────────────────────────────────────────────────────────────
 *   Ideal range: 20px – 48px (source is 94×94 @1x, so retina-safe up to 47px)
 *   Below 18px: use Tabler stroke icons from Icon.tsx (better at tiny sizes)
 *
 * ─── Adding new icons ────────────────────────────────────────────────────────
 *   1. Find slug: https://icons8.com/icon/{slug}/3d-fluency
 *   2. Download: Invoke-WebRequest "https://img.icons8.com/3d-fluency/94/{slug}.png" -OutFile public/icons8/{alias}.png
 *   3. export const MyIcon3D = makeIcon('{alias}');
 */

import React from 'react';

// ─── Base Factory ─────────────────────────────────────────────────────────────

export interface Icons8Props {
  /** Width & height in pixels. Source is 94×94, retina-safe up to 47px. */
  size?: number;
  /** Accessible label. Leave blank for decorative icons. */
  alt?: string;
  /** CSS classes for layout / spacing / opacity. */
  className?: string;
  /** Inline style overrides. */
  style?: React.CSSProperties;
}

function makeIcon(filename: string) {
  const Component: React.FC<Icons8Props> = ({
    size = 28,
    alt = '',
    className = '',
    style,
  }) => (
    <img
      src={`/icons8/${filename}.png`}
      width={size}
      height={size}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      className={className}
      style={{
        objectFit: 'contain',
        display: 'inline-block',
        flexShrink: 0,
        imageRendering: 'crisp-edges',
        ...style,
      }}
      loading="eager"
      decoding="async"
    />
  );
  Component.displayName = `Icons8_${filename}`;
  return Component;
}

// ─── Safety & Emergency ───────────────────────────────────────────────────────

/** Emergency beacon / police siren light (fire-alarm dome + rays). */
export const SirenIcon3D        = makeIcon('siren');

/** High-priority exclamation warning triangle. */
export const WarningIcon3D      = makeIcon('warning');

/** Security shield badge. */
export const ShieldIcon3D       = makeIcon('shield');

/** SOS text badge. */
export const SosIcon3D          = makeIcon('sos');

/** Flash/lightning bolt — surge or high-demand. */
export const FlashIcon3D        = makeIcon('flash');

// ─── Vehicle & Navigation ─────────────────────────────────────────────────────

/** Private sedan / taxi car. */
export const CarIcon3D          = makeIcon('car');

/** Compass / directional navigation arrow. */
export const NavigateIcon3D     = makeIcon('navigate');

/** Road / toll route path. */
export const RouteIcon3D        = makeIcon('route');

/** Map-pin location marker. */
export const LocationIcon3D     = makeIcon('location');

/** P parking badge. */
export const ParkingIcon3D      = makeIcon('parking');

/** Gas station fuel pump. */
export const FuelIcon3D         = makeIcon('fuel');

// ─── Communication ────────────────────────────────────────────────────────────

/** Phone handset — call action. */
export const PhoneIcon3D        = makeIcon('phone');

/** Speech bubble — chat / message rider. */
export const ChatIcon3D         = makeIcon('chat');

/** Bell — notification bell. */
export const NotificationIcon3D = makeIcon('notification');

/** Hamburger / lines — menu toggle. */
export const MenuIcon3D         = makeIcon('menu');

// ─── Profile & Account ────────────────────────────────────────────────────────

/** Person circle — driver profile / user. */
export const UserIcon3D         = makeIcon('user');

/** Pencil — edit/modify. */
export const EditIcon3D         = makeIcon('edit');

/** Camera lens — photo upload. */
export const CameraIcon3D       = makeIcon('camera');

/** Image gallery — photo collection. */
export const GalleryIcon3D      = makeIcon('gallery');

/** Padlock — security / locked state. */
export const LockIcon3D         = makeIcon('lock');

/** Document stack — KYC docs / files. */
export const DocumentIcon3D     = makeIcon('document');

/** Folder — trip history / archive. */
export const FolderIcon3D       = makeIcon('folder');

/** Bookmark — flag / marker. */
export const FlagIcon3D         = makeIcon('flag');

/** Briefcase — work / trip context. */
export const BriefcaseIcon3D    = makeIcon('briefcase');

// ─── Finance ──────────────────────────────────────────────────────────────────

/** Open wallet. */
export const WalletIcon3D       = makeIcon('wallet');

/** Credit / debit card back. */
export const CardIcon3D         = makeIcon('card');

/** Receipt — billing / invoices. */
export const ReceiptIcon3D      = makeIcon('receipt');

/** Money / currency — Indian rupee earnings. */
export const EarningsIcon3D     = makeIcon('rupee');

/** Gas station pump — fuel wallet reimbursement. */
export const FuelWalletIcon3D   = makeIcon('fuel');

// ─── Achievements & Rewards ───────────────────────────────────────────────────

/** Gold trophy cup — incentives / quests. */
export const TrophyIcon3D       = makeIcon('trophy');

/** Gold star — rating. */
export const StarIcon3D         = makeIcon('star');

/** Gift / present box — referral reward. */
export const GiftIcon3D         = makeIcon('gift');

// ─── Utility ─────────────────────────────────────────────────────────────────

/** Gear — system settings. */
export const SettingsIcon3D     = makeIcon('settings');

/** Magnifying glass — search. */
export const SearchIcon3D       = makeIcon('search');

/** Info circle — informational. */
export const InfoIcon3D         = makeIcon('info');

/** Back/left arrow. */
export const BackIcon3D         = makeIcon('back');

/** Check / OK mark. */
export const CheckmarkIcon3D    = makeIcon('checkmark');

/** Cancel / close X. */
export const CloseIcon3D        = makeIcon('close');

/** Plus / add circle. */
export const PlusIcon3D         = makeIcon('plus');

/** Refresh / sync circle. */
export const RefreshIcon3D      = makeIcon('refresh');

/** Share / forward arrow. */
export const ShareIcon3D        = makeIcon('share');

/** Download arrow. */
export const DownloadIcon3D     = makeIcon('download');

/** Home — home screen shortcut. */
export const HomeIcon3D         = makeIcon('home');

/** Clock — ETA / waiting time. */
export const ClockIcon3D        = makeIcon('clock');

/** Fire / flame — surge heatmap demand. */
export const FlameIcon3D        = makeIcon('fire');

// ─── Trip & Logistics ─────────────────────────────────────────────────────────

/** Maintenance wrench — vehicle repair. */
export const WrenchIcon3D       = makeIcon('wrench');

/** Graduation / school — training academy. */
export const SchoolIcon3D       = makeIcon('school');

/** Bar chart — analytics / performance. */
export const ChartIcon3D        = makeIcon('chart');

/** Mobile phone — driver dashboard. */
export const MobileIcon3D       = makeIcon('mobile');

/** Increase / graph up — performance graph. */
export const GraphIcon3D        = makeIcon('graph');

/** Bell (alarm) — appointment / break reminder. */
export const BellIcon3D         = makeIcon('bell');

/** Door — logout / exit. */
export const DoorIcon3D         = makeIcon('door');

/** Map pin — location. */
export const MapPinIcon3D       = makeIcon('map-pin');

/** SOS / emergency signal. */
export const SignalIcon3D       = makeIcon('signal');
