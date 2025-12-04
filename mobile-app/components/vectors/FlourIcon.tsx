import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface FlourIconProps {
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
}

export const FlourIcon: React.FC<FlourIconProps> = ({
  width = 43,
  height = 45,
  stroke = '#231F20',
  fill = 'none',
  strokeWidth = 1.5,
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 42.8 44.33" fill="none">
      <Path
        d="M235.65,317.75a66.9,66.9,0,0,0-1.27,8.17c-.38,4.08-.07,4.92-.77,7.32-1.07,3.7-2.74,4.94-2.13,6.13.44.85,2,1.57,7.15.76a63.1,63.1,0,0,0,26.13-.17c5.47,1.47,7.24,1,7.74.17.63-1-.91-2.33-1.7-5.61s.05-4.56,0-8.09a24.68,24.68,0,0,0-2-9.11,4.55,4.55,0,0,0,2.9-2.38c.7-1.81-.55-5.27-2.11-5-3.14.56-8.36,3.73-17.89,3.43-8.41-.26-12.11-3.37-17.24-3-1.19.09-1.84,1.35-1.92,3.09C232.47,316,235.46,317.65,235.65,317.75Z"
        transform="translate(-230.6 -297.84)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
      <Path
        d="M237.27,310.51a8.18,8.18,0,0,1,2.33-5.19,8,8,0,0,1,3.67-2,8.94,8.94,0,0,1,16.21,1,6.28,6.28,0,0,1,4.73.13,6.41,6.41,0,0,1,3.46,6.06"
        transform="translate(-230.6 -297.84)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
      <Path
        d="M235.65,317.75a46.72,46.72,0,0,0,33.19-.43"
        transform="translate(-230.6 -297.84)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
    </Svg>
  );
};
