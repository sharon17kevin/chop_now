import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface SpiceIconProps {
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
}

export const SpiceIcon: React.FC<SpiceIconProps> = ({
  width = 26.27,
  height = 38.65,
  stroke = '#231F20',
  fill = 'none',
  strokeWidth = 1.5,
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 26.27 38.65" fill="none">
      <Path
        d="M262.13,284H248.77a5.71,5.71,0,0,1-5.55-7l4.59-19.28H263l4.67,19.26A5.7,5.7,0,0,1,262.13,284Z"
        transform="translate(-242.32 -246.05)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
      <Path
        d="M264.9,256.25a10.73,10.73,0,0,1-.1,1.4H246.1a10.73,10.73,0,0,1-.1-1.4,9.45,9.45,0,0,1,18.9,0Z"
        transform="translate(-242.32 -246.05)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
      <Circle cx={11.23} cy={23.38} r={1.72} fill={stroke} />
      <Circle cx={8.68} cy={30.43} r={1.72} fill={stroke} />
      <Circle cx={16.08} cy={28.42} r={1.72} fill={stroke} />
    </Svg>
  );
};

export default SpiceIcon;
