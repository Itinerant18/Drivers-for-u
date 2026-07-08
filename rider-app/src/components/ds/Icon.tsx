/**
 * Icon.tsx — Vahnly Driver App Icon System
 * Static: Icons8 3D Fluency (PNGs)
 * Animated: @lordicon/react (Lottie JSON, colorful, hover/loop triggers)
 */

import React, { useRef } from 'react';
import { Player } from '@lordicon/react';
import Image from 'next/image';

// ─── ICON PROPS TYPE ────────────────────────────────────────────────────────
export interface IconProps {
  size?: number;
  color?: string; // Kept for compatibility, but ignored by 3D PNGs
  stroke?: number; // Kept for compatibility, but ignored by 3D PNGs
  className?: string;
}

// ─── 3D FLUENCY BASE COMPONENT ──────────────────────────────────────────────
const FluencyIcon = ({ name, size = 24, className = '' }: { name: string } & IconProps) => (
  <Image 
    src={`https://img.icons8.com/3d-fluency/94/${name}.png`} 
    alt={`${name} icon`} 
    width={size} 
    height={size} 
    className={className} 
    unoptimized 
  />
);

// ─── STATIC ICONS (Icons8 3D Fluency) ───────────────────────────────────────
export const PhoneIcon = (props: IconProps) => <FluencyIcon name="phone" {...props} />;
export const ChatIcon = (props: IconProps) => <FluencyIcon name="chat" {...props} />;
export const NavigateIcon = (props: IconProps) => <FluencyIcon name="compass" {...props} />;
export const CashIcon = (props: IconProps) => <FluencyIcon name="money" {...props} />;
export const CardIcon = (props: IconProps) => <FluencyIcon name="bank-cards" {...props} />;
export const ShieldIcon = (props: IconProps) => <FluencyIcon name="security-checked" {...props} />;
export const CarIcon = (props: IconProps) => <FluencyIcon name="car" {...props} />;
export const AlertIcon = (props: IconProps) => <FluencyIcon name="warning-shield" {...props} />;
export const CheckIcon = (props: IconProps) => <FluencyIcon name="checkmark" {...props} />;
export const BellIcon = (props: IconProps) => <FluencyIcon name="bell" {...props} />;
export const PlusIcon = (props: IconProps) => <FluencyIcon name="plus" {...props} />;
export const ParkingIcon = (props: IconProps) => <FluencyIcon name="parking" {...props} />;
export const SirenIcon = (props: IconProps) => <FluencyIcon name="sos" {...props} />;
export const CameraIcon = (props: IconProps) => <FluencyIcon name="camera" {...props} />;
export const CrossIcon = (props: IconProps) => <FluencyIcon name="multiply" {...props} />;
export const RefreshIcon = (props: IconProps) => <FluencyIcon name="refresh" {...props} />;
export const MenuIcon = (props: IconProps) => <FluencyIcon name="menu" {...props} />;
export const SignalIcon = (props: IconProps) => <FluencyIcon name="wifi" {...props} />;
export const OctagonAlertIcon = (props: IconProps) => <FluencyIcon name="sos" {...props} />;
export const FlameIcon = (props: IconProps) => <FluencyIcon name="fire-element" {...props} />;
export const PauseIcon = (props: IconProps) => <FluencyIcon name="sleep" {...props} />;
export const WrenchIcon = (props: IconProps) => <FluencyIcon name="wrench" {...props} />;
export const ClockIcon = (props: IconProps) => <FluencyIcon name="clock" {...props} />;
export const RouteIcon = (props: IconProps) => <FluencyIcon name="road" {...props} />;
export const HomeIcon = (props: IconProps) => <FluencyIcon name="home" {...props} />;
export const PaymentIcon = (props: IconProps) => <FluencyIcon name="wallet" {...props} />;
export const PinIcon = (props: IconProps) => <FluencyIcon name="map-pin" {...props} />;
export const UserIcon = (props: IconProps) => <FluencyIcon name="user-male-circle" {...props} />;
export const SearchIcon = (props: IconProps) => <FluencyIcon name="search" {...props} />;
export const BackIcon = (props: IconProps) => <FluencyIcon name="arrow-left" {...props} />;
export const ForwardIcon = (props: IconProps) => <FluencyIcon name="arrow-right" {...props} />;

// ─── NEW ICONS (emoji replacements) ────────────────────────────────────────
export const StarIcon = (props: IconProps) => <FluencyIcon name="star" {...props} />;
export const WalletIcon = (props: IconProps) => <FluencyIcon name="wallet" {...props} />;
export const BookingIcon = (props: IconProps) => <FluencyIcon name="receipt" {...props} />;
export const GiftIcon = (props: IconProps) => <FluencyIcon name="gift" {...props} />;
export const TrophyIcon = (props: IconProps) => <FluencyIcon name="trophy" {...props} />;
export const LocationIcon = (props: IconProps) => <FluencyIcon name="marker" {...props} />;
export const SupportIcon = (props: IconProps) => <FluencyIcon name="headset" {...props} />;
export const DocumentIcon = (props: IconProps) => <FluencyIcon name="document" {...props} />;
export const NotificationIcon = (props: IconProps) => <FluencyIcon name="bell" {...props} />;
export const SettingsIcon = (props: IconProps) => <FluencyIcon name="gear" {...props} />;
export const ShareIcon = (props: IconProps) => <FluencyIcon name="paper-plane" {...props} />;
export const CameraOutlineIcon = (props: IconProps) => <FluencyIcon name="camera" {...props} />;
export const InfoIcon = (props: IconProps) => <FluencyIcon name="info" {...props} />;
export const LogoutIcon = (props: IconProps) => <FluencyIcon name="door" {...props} />;
export const WarningIcon = (props: IconProps) => <FluencyIcon name="warning-shield" {...props} />;
export const SuccessIcon = (props: IconProps) => <FluencyIcon name="ok" {...props} />;
export const ErrorIcon = (props: IconProps) => <FluencyIcon name="cancel" {...props} />;
export const WorkIcon = (props: IconProps) => <FluencyIcon name="briefcase" {...props} />;
export const HomeAddressIcon = (props: IconProps) => <FluencyIcon name="home" {...props} />;
export const LogoutDoorIcon = (props: IconProps) => <FluencyIcon name="door" {...props} />;
export const ChevronIcon = (props: IconProps) => <FluencyIcon name="right" {...props} />;
export const VehicleIcon = (props: IconProps) => <FluencyIcon name="bus" {...props} />;
export const LockIcon = (props: IconProps) => <FluencyIcon name="lock" {...props} />;
export const FlagIcon = (props: IconProps) => <FluencyIcon name="megaphone" {...props} />;
export const EditIcon = (props: IconProps) => <FluencyIcon name="edit" {...props} />;
export const DownloadIcon = (props: IconProps) => <FluencyIcon name="download" {...props} />;
export const LinkIcon = (props: IconProps) => <FluencyIcon name="arrow-right" {...props} />;
export const PhotoIcon = (props: IconProps) => <FluencyIcon name="picture" {...props} />;
export const WorkBriefcaseIcon = (props: IconProps) => <FluencyIcon name="briefcase" {...props} />;
export const BoltIcon = (props: IconProps) => <FluencyIcon name="lightning-bolt" {...props} />;
export const HeadsetIcon = (props: IconProps) => <FluencyIcon name="headset" {...props} />;

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
