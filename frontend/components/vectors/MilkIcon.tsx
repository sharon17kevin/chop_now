import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface MilkIconProps {
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
}

export const MilkIcon: React.FC<MilkIconProps> = ({
  width = 35,
  height = 50,
  stroke = '#231F20',
  fill = 'none',
  strokeWidth = 1.5,
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 35.29 50.35" fill="none">
      {/* Front rectangle */}
      <Rect
        x={0.75}
        y={16.24}
        width={21.87}
        height={33.36}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      {/* Side panel */}
      <Path
        d="M353.92,344v33.36L342,378.6V345.23Z"
        transform="translate(-319.38 -328.99)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      {/* Top rectangle */}
      <Rect
        x={7.3}
        y={0.75}
        width={21.37}
        height={6.12}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      {/* Top front slanted panel */}
      <Path
        d="M348.05,335.86l-5.22,8.1-.83,1.27H320.13q3.28-4.68,6.55-9.37Z"
        transform="translate(-319.38 -328.99)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      {/* Top right slanted panel */}
      <Path
        d="M353.92,344,342,345.23l.83-1.27,5.22-8.1C350,338.57,352,341.26,353.92,344Z"
        transform="translate(-319.38 -328.99)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
    </Svg>
  );
};
