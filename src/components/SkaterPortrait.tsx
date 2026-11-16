import React from 'react';
import { NationalityCode, SkaterAppearance, SkaterProfile } from '../types/game';

interface FlagProps {
  code: NationalityCode;
  className?: string;
}

export const CountryFlag: React.FC<FlagProps> = ({ code, className = 'w-6 h-4 rounded-[3px]' }) => {
  switch (code) {
    case 'BR':
      return (
        <svg viewBox="0 0 28 20" className={`${className} shrink-0 border border-white/15`} aria-label="BR">
          <rect width="28" height="20" fill="#15803d" />
          <polygon points="14,2.5 25,10 14,17.5 3,10" fill="#facc15" />
          <circle cx="14" cy="10" r="4.1" fill="#1e3a8a" />
          <path d="M10.4 9.5 Q14 8.2 17.6 10.6" stroke="#f8fafc" strokeWidth="0.9" fill="none" />
        </svg>
      );
    case 'US':
      return (
        <svg viewBox="0 0 28 20" className={`${className} shrink-0 border border-white/15`} aria-label="US">
          <rect width="28" height="20" fill="#f8fafc" />
          {[0, 4, 8, 12, 16].map((y) => (
            <rect key={y} x="0" y={y} width="28" height="2.2" fill="#b91c1c" />
          ))}
          <rect width="13" height="10.5" fill="#1e3a8a" />
          <circle cx="3.5" cy="3.2" r="0.8" fill="#ffffff" />
          <circle cx="6.8" cy="3.2" r="0.8" fill="#ffffff" />
          <circle cx="10.0" cy="3.2" r="0.8" fill="#ffffff" />
          <circle cx="5.2" cy="6.2" r="0.8" fill="#ffffff" />
          <circle cx="8.6" cy="6.2" r="0.8" fill="#ffffff" />
        </svg>
      );
    case 'JP':
      return (
        <svg viewBox="0 0 28 20" className={`${className} shrink-0 border border-white/15`} aria-label="JP">
          <rect width="28" height="20" fill="#f8fafc" />
          <circle cx="14" cy="10" r="5" fill="#dc2626" />
        </svg>
      );
    case 'FR':
      return (
        <svg viewBox="0 0 28 20" className={`${className} shrink-0 border border-white/15`} aria-label="FR">
          <rect x="0" width="9.4" height="20" fill="#1d4ed8" />
          <rect x="9.4" width="9.3" height="20" fill="#f8fafc" />
          <rect x="18.7" width="9.3" height="20" fill="#dc2626" />
        </svg>
      );
    case 'AU':
      return (
        <svg viewBox="0 0 28 20" className={`${className} shrink-0 border border-white/15`} aria-label="AU">
          <rect width="28" height="20" fill="#1e3a8a" />
          <rect width="13" height="10" fill="#1e40af" />
          <rect x="5.4" y="0" width="2.2" height="10" fill="#f8fafc" />
          <rect x="0" y="3.9" width="13" height="2.2" fill="#f8fafc" />
          <rect x="5.9" y="0" width="1.2" height="10" fill="#dc2626" />
          <rect x="0" y="4.4" width="13" height="1.2" fill="#dc2626" />
          <circle cx="21" cy="5.5" r="1.2" fill="#ffffff" />
          <circle cx="23.5" cy="11" r="1.1" fill="#ffffff" />
          <circle cx="19.5" cy="14.5" r="1.3" fill="#ffffff" />
          <circle cx="7" cy="15" r="1.6" fill="#ffffff" />
        </svg>
      );
    case 'ES':
      return (
        <svg viewBox="0 0 28 20" className={`${className} shrink-0 border border-white/15`} aria-label="ES">
          <rect width="28" height="20" fill="#b91c1c" />
          <rect y="5" width="28" height="10" fill="#eab308" />
          <rect x="6" y="7" width="3.5" height="5" rx="1" fill="#991b1b" />
        </svg>
      );
    case 'GB':
      return (
        <svg viewBox="0 0 28 20" className={`${className} shrink-0 border border-white/15`} aria-label="GB">
          <rect width="28" height="20" fill="#1e3a8a" />
          <path d="M0,0 L28,20 M28,0 L0,20" stroke="#f8fafc" strokeWidth="3.5" />
          <path d="M0,0 L28,20 M28,0 L0,20" stroke="#dc2626" strokeWidth="1.6" />
          <rect x="11.5" width="5" height="20" fill="#f8fafc" />
          <rect y="7.5" width="28" height="5" fill="#f8fafc" />
          <rect x="12.5" width="3" height="20" fill="#dc2626" />
          <rect y="8.5" width="28" height="3" fill="#dc2626" />
        </svg>
      );
    case 'CA':
      return (
        <svg viewBox="0 0 28 20" className={`${className} shrink-0 border border-white/15`} aria-label="CA">
          <rect width="28" height="20" fill="#f8fafc" />
          <rect width="7" height="20" fill="#dc2626" />
          <rect x="21" width="7" height="20" fill="#dc2626" />
          <polygon points="14,4.5 16.5,9.5 19,9 16,12.5 16.8,15.5 14,13.8 11.2,15.5 12,12.5 9,9 11.5,9.5" fill="#dc2626" />
        </svg>
      );
    case 'DE':
      return (
        <svg viewBox="0 0 28 20" className={`${className} shrink-0 border border-white/15`} aria-label="DE">
          <rect y="0" width="28" height="6.7" fill="#111827" />
          <rect y="6.7" width="28" height="6.7" fill="#dc2626" />
          <rect y="13.3" width="28" height="6.7" fill="#facc15" />
        </svg>
      );
    case 'AR':
      return (
        <svg viewBox="0 0 28 20" className={`${className} shrink-0 border border-white/15`} aria-label="AR">
          <rect y="0" width="28" height="6.7" fill="#38bdf8" />
          <rect y="6.7" width="28" height="6.7" fill="#f8fafc" />
          <rect y="13.3" width="28" height="6.7" fill="#38bdf8" />
          <circle cx="14" cy="10" r="2.1" fill="#f59e0b" />
        </svg>
      );
  }
};

interface SkaterPortraitProps {
  skater?: SkaterProfile;
  customAppearance?: SkaterAppearance;
  jerseyNumber?: string;
  label?: string;
  size?: 'sm' | 'lg';
}

export const SkaterPortrait: React.FC<SkaterPortraitProps> = ({
  skater,
  customAppearance,
  jerseyNumber = '00',
  label = 'Skater',
  size = 'sm',
}) => {
  const appearance = skater ? skater.appearance : customAppearance!;
  const { skinColor, hairColor, outfit, visualModel } = appearance;
  const tagNum = skater ? skater.jerseyNumber : jerseyNumber;
  const ariaLabel = skater ? `${skater.firstName} ${skater.lastName}` : label;
  const dim = size === 'lg' ? 'w-20 h-20' : 'w-12 h-12';
  const shoulderHalf =
    visualModel.bodyBuild === 'stocky' ? 30 : visualModel.bodyBuild === 'slim' ? 25 : 27.5;
  const headRx =
    visualModel.faceModel === 'broad'
      ? 16.8
      : visualModel.faceModel === 'angular'
        ? 14.3
        : 15.5;
  const headRy =
    visualModel.faceModel === 'angular'
      ? 18.2
      : visualModel.faceModel === 'youth'
        ? 16.0
        : 17.0;

  return (
    <div
      className={`${dim} relative rounded-xl overflow-hidden bg-gradient-to-b from-[#1a2e42] to-[#0c141d] border border-white/15 shrink-0 flex items-end justify-center`}
    >
      <svg viewBox="0 0 80 80" className="w-full h-full" aria-label={ariaLabel}>
        <circle cx="40" cy="36" r="28" fill={visualModel.secondaryColor || '#38bdf8'} opacity="0.11" />

        {/* Back Hair behind shoulders for long styles */}
        {visualModel.hairStyle === 'long_flow' && (
          <path d="M21,28 C19,44 21,58 27,63 L53,63 C59,58 61,44 59,28 Z" fill={hairColor} />
        )}
        {visualModel.hairStyle === 'dreads' && (
          <g fill={hairColor}>
            <rect x="20" y="25" width="4.5" height="27" rx="2" />
            <rect x="25" y="27" width="4" height="26" rx="2" />
            <rect x="51" y="27" width="4" height="26" rx="2" />
            <rect x="55.5" y="25" width="4.5" height="27" rx="2" />
          </g>
        )}
        {visualModel.hairStyle === 'ponytail' && (
          <path d="M51,21 C62,21 66,34 60,49 C55,44 54,32 51,25 Z" fill={hairColor} />
        )}
        {visualModel.hairStyle === 'bun' && (
          <circle cx="40" cy="11" r="6.2" fill={hairColor} />
        )}

        {/* Shoulders / Top Style */}
        {visualModel.topStyle === 'tank' ? (
          <>
            <path
              d={`M${40 - shoulderHalf},80 C${40 - shoulderHalf},61 25,53 40,53 C55,53 ${40 + shoulderHalf},61 ${40 + shoulderHalf},80 Z`}
              fill={skinColor}
            />
            <path d="M23,80 L26,53 L54,53 L57,80 Z" fill={outfit.shirtColor} />
            <path d="M31,53 Q40,65 49,53" fill={skinColor} />
            <path d="M30,54 Q40,66 50,54" fill="none" stroke={visualModel.secondaryColor} strokeWidth="2.2" />
          </>
        ) : (
          <path
            d={`M${40 - shoulderHalf},80 C${40 - shoulderHalf},59 23,52 40,52 C57,52 ${40 + shoulderHalf},59 ${40 + shoulderHalf},80 Z`}
            fill={outfit.shirtColor}
          />
        )}

        {/* Top Style Details */}
        {visualModel.topStyle === 'hoodie' && (
          <>
            <path d="M25,54 C28,45 52,45 55,54 C48,60 32,60 25,54 Z" fill={outfit.shirtColor} stroke="#0f172a" strokeOpacity="0.28" strokeWidth="1" />
            <line x1="35" y1="58" x2="34" y2="69" stroke={visualModel.secondaryColor} strokeWidth="1.8" strokeLinecap="round" />
            <line x1="45" y1="58" x2="46" y2="69" stroke={visualModel.secondaryColor} strokeWidth="1.8" strokeLinecap="round" />
          </>
        )}
        {visualModel.topStyle === 'windbreaker' && (
          <>
            <rect x="31" y="48" width="18" height="9" rx="3" fill={visualModel.secondaryColor} />
            <line x1="40" y1="55" x2="40" y2="80" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.4" />
            <path d="M16,67 L64,67" stroke={visualModel.secondaryColor} strokeWidth="3.2" opacity="0.85" />
          </>
        )}
        {visualModel.topStyle === 'overshirt' && (
          <>
            <path d="M33,53 L40,78 L47,53 Z" fill={visualModel.secondaryColor} />
            <path d="M29,53 L35,64 L40,58" fill="none" stroke="#0f172a" strokeOpacity="0.35" strokeWidth="1.5" />
            <path d="M51,53 L45,64 L40,58" fill="none" stroke="#0f172a" strokeOpacity="0.35" strokeWidth="1.5" />
          </>
        )}
        {(visualModel.topStyle === 'tee' || visualModel.topStyle === 'longsleeve') && (
          <path
            d="M29,53 Q40,62 51,53"
            fill="none"
            stroke={visualModel.secondaryColor}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        )}

        {/* Accessory: Backpack straps or Chain */}
        {visualModel.accessory === 'backpack' && (
          <g stroke="#181c22" strokeWidth="3.2" strokeLinecap="round">
            <line x1="27" y1="54" x2="24" y2="79" />
            <line x1="53" y1="54" x2="56" y2="79" />
          </g>
        )}
        {visualModel.accessory === 'chain' && (
          <path d="M32,54 Q40,64 48,54" fill="none" stroke="#facc15" strokeWidth="1.8" />
        )}

        {/* Neck */}
        <rect x="34" y="42" width="12" height="13" rx="5" fill={skinColor} />

        {/* Ears */}
        <ellipse cx={40 - headRx - 1} cy="32" rx="2.6" ry="4.2" fill={skinColor} />
        <ellipse cx={40 + headRx + 1} cy="32" rx="2.6" ry="4.2" fill={skinColor} />

        {/* Stylized Flow Character Head */}
        <ellipse cx="40" cy="31" rx={headRx} ry={headRy} fill={skinColor} />
        <ellipse cx="43" cy="27" rx="9" ry="10" fill="#ffffff" opacity="0.07" />

        {/* Hair Styles (shown unless fully covered by beanie/bucket_hat) */}
        {visualModel.headwearStyle !== 'beanie' && visualModel.headwearStyle !== 'bucket_hat' && (
          <>
            {visualModel.hairStyle === 'buzz' && (
              <path d="M25,27 C25,14 55,14 55,27 C49,21 31,21 25,27 Z" fill={hairColor} opacity="0.9" />
            )}
            {visualModel.hairStyle === 'short_tuft' && (
              <>
                <path d="M24,28 C24,14 56,14 56,28 C51,21 29,21 24,28 Z" fill={hairColor} />
                <ellipse cx="40" cy="17.5" rx="10.5" ry="4.8" fill={hairColor} />
              </>
            )}
            {visualModel.hairStyle === 'messy_curls' && (
              <g fill={hairColor}>
                <circle cx="29" cy="19" r="5.5" />
                <circle cx="36" cy="16" r="6" />
                <circle cx="44" cy="16" r="6" />
                <circle cx="51" cy="19" r="5.5" />
                <circle cx="40" cy="19" r="6" />
              </g>
            )}
            {visualModel.hairStyle === 'side_part' && (
              <path d="M24,28 C23,13 55,12 56,26 C49,19 34,20 24,28 Z" fill={hairColor} />
            )}
            {(visualModel.hairStyle === 'ponytail' ||
              visualModel.hairStyle === 'bun' ||
              visualModel.hairStyle === 'long_flow' ||
              visualModel.hairStyle === 'dreads') && (
              <path d="M24,27 C24,13 56,13 56,27 C50,20 30,20 24,27 Z" fill={hairColor} />
            )}
          </>
        )}

        {/* Accessory: Sweatband */}
        {visualModel.accessory === 'sweatband' && visualModel.headwearStyle === 'none' && (
          <rect x="24.5" y="19" width="31" height="4.2" rx="2" fill={visualModel.secondaryColor} />
        )}

        {/* Accessory: Sunglasses */}
        {visualModel.accessory === 'sunglasses' && (
          <g>
            <rect x="27.5" y="26.5" width="10.5" height="6.2" rx="2" fill="#0f172a" stroke="#e2e8f0" strokeWidth="0.7" />
            <rect x="42" y="26.5" width="10.5" height="6.2" rx="2" fill="#0f172a" stroke="#e2e8f0" strokeWidth="0.7" />
            <line x1="38" y1="28.5" x2="42" y2="28.5" stroke="#0f172a" strokeWidth="1.5" />
          </g>
        )}

        {/* Headwear Styles matching 3D geometry */}
        {visualModel.headwearStyle === 'cap' && (
          <>
            <path d="M23.5,24 C23.5,11 56.5,11 56.5,24 Z" fill={outfit.hatColor} />
            <path d="M24,22.5 L62,25.5 C61,28 45,27 25,24 Z" fill={visualModel.secondaryColor} />
            <circle cx="40" cy="12" r="2" fill={visualModel.secondaryColor} />
          </>
        )}

        {visualModel.headwearStyle === 'backward_cap' && (
          <>
            <path d="M23.5,24 C23.5,11 56.5,11 56.5,24 Z" fill={outfit.hatColor} />
            <path d="M20,24 L31,24 L31,20.5 Q25,21 20,24 Z" fill={visualModel.secondaryColor} />
            <rect x="33" y="19" width="14" height="3.2" rx="1.6" fill="#e2e8f0" opacity="0.65" />
          </>
        )}

        {visualModel.headwearStyle === 'beanie' && (
          <>
            <path d="M24,25 C24,8 56,8 56,25 Z" fill={outfit.hatColor} />
            <rect x="23" y="20" width="34" height="6.5" rx="3" fill={visualModel.secondaryColor} />
          </>
        )}

        {visualModel.headwearStyle === 'bucket_hat' && (
          <>
            <path d="M26,21 L29,11 L51,11 L54,21 Z" fill={outfit.hatColor} />
            <path d="M18,24 Q40,18 62,24 L59,26.5 Q40,21.5 21,26.5 Z" fill={outfit.hatColor} />
            <rect x="26" y="18.5" width="28" height="2.4" fill={visualModel.secondaryColor} />
          </>
        )}

        {/* Accessory: Over-ear Headphones */}
        {visualModel.accessory === 'headphones' && (
          <g>
            <path d="M21,31 C20,10 60,10 59,31" fill="none" stroke="#1e293b" strokeWidth="3.2" />
            <rect x="19" y="26" width="5.5" height="11" rx="2.5" fill={visualModel.secondaryColor} stroke="#0f172a" strokeWidth="1" />
            <rect x="55.5" y="26" width="5.5" height="11" rx="2.5" fill={visualModel.secondaryColor} stroke="#0f172a" strokeWidth="1" />
          </g>
        )}
      </svg>

      {/* Jersey Tag Overlay */}
      <span className="absolute bottom-0.5 right-1 text-[9px] font-extrabold tracking-wider text-white/85 tabular-nums drop-shadow">
        #{tagNum}
      </span>
    </div>
  );
};
