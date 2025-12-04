import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface LegumesIconProps {
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
}

export const LegumesIcon: React.FC<LegumesIconProps> = ({
  width = 34.02,
  height = 30.58,
  stroke = '#231F20',
  fill = 'none',
  strokeWidth = 1.5,
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 34.02 30.58" fill="none">
      <Path
        d="M346.87,403.27a7.17,7.17,0,0,1-5.87-2c-2.64-2.9-1-7.11-1-7.28,1.1-2.73,3-2.28,4.34-5,1.65-3.31-.45-5.16,1.28-8.11a7.3,7.3,0,0,1,5.68-3.51,6.7,6.7,0,0,1,7.21,7"
        transform="translate(-338.74 -376.59)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
      <Path
        d="M349,398.35a7.18,7.18,0,0,0,.83,4.85c2,3.13,6.39,3.2,7.27,3.22,6.75.11,13.23-6.24,14.56-12.92.32-1.6,1.09-5.49-1.34-8.11a6.94,6.94,0,0,0-6.13-2,7.45,7.45,0,0,0-4.34,2.81c-2,2.4-1,3.78-2.74,5.43-1.9,1.8-3.57.6-5.81,2.61A7.5,7.5,0,0,0,349,398.35Z"
        transform="translate(-338.74 -376.59)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
      <Path
        d="M362,391a7,7,0,0,1-1.72,3.57,7.18,7.18,0,0,1-4.47,2.24"
        transform="translate(-338.74 -376.59)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
      <Path
        d="M348.72,385.65a6.52,6.52,0,0,1-3.12,7.91"
        transform="translate(-338.74 -376.59)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
    </Svg>
  );
};

export default LegumesIcon;
