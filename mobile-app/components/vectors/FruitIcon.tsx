import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface FruitIconProps {
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
}

export const FruitIcon: React.FC<FruitIconProps> = ({
  width = 24,
  height = 50,
  stroke = '#231F20',
  fill = 'none',
  strokeWidth = 1.5,
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 23.55 49.2" fill="none">
      <Path
        d="M282.2,352a9.64,9.64,0,0,1-2.23-4.79,10.05,10.05,0,0,1,2-7.47,10,10,0,0,1,2.3,7.34A9.58,9.58,0,0,1,282.2,352Z"
        transform="translate(-270.31 -327.52)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      <Path
        d="M282.51,351.54c3-3.49,6.43-6.22,9.65-9.34a7.89,7.89,0,0,0-3.75-.25,8,8,0,0,0-4.2,2.2"
        transform="translate(-270.31 -327.52)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      <Path
        d="M288,342c1.42-3,3.39-5.3,5.09-7.95a13.48,13.48,0,0,0-9.89,7.45"
        transform="translate(-270.31 -327.52)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      <Path
        d="M287.14,336.7a69.34,69.34,0,0,1,1-8,10.92,10.92,0,0,0-5.68,5.27,10.74,10.74,0,0,0-.9,6.38"
        transform="translate(-270.31 -327.52)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      <Path
        d="M282,335a13.41,13.41,0,0,0-2.61-4.21,13.19,13.19,0,0,0-3.12-2.52,72.55,72.55,0,0,1,.54,8.38"
        transform="translate(-270.31 -327.52)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      <Path
        d="M281.29,340.76a14.47,14.47,0,0,0-3.43-3.43,14.75,14.75,0,0,0-6.76-2.58c1.57,2.17,3.51,4.15,4.71,6.52"
        transform="translate(-270.31 -327.52)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      <Path
        d="M279.94,343.87a8.92,8.92,0,0,0-3.87-2.52,8.78,8.78,0,0,0-5-.09c3.72,3.56,7.7,6.95,11.14,10.69"
        transform="translate(-270.31 -327.52)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      <Path
        d="M277.35,357a2,2,0,0,0,1.34,1,2,2,0,0,0,2-1.54"
        transform="translate(-270.31 -327.52)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      <Path
        d="M283.29,356.69a1.8,1.8,0,0,0,3.38-.06"
        transform="translate(-270.31 -327.52)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      <Path
        d="M274.93,362.88a1.44,1.44,0,0,0,2.74-.06"
        transform="translate(-270.31 -327.52)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      <Path
        d="M280.86,362.88a1.34,1.34,0,0,0,2.62-.38"
        transform="translate(-270.31 -327.52)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      <Path
        d="M286,362.76a1.61,1.61,0,0,0,3.19-.07"
        transform="translate(-270.31 -327.52)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      <Path
        d="M277.54,368.82a1.57,1.57,0,0,0,1.47,1,1.59,1.59,0,0,0,1.47-1.59"
        transform="translate(-270.31 -327.52)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      <Path
        d="M283.54,368.82a1.87,1.87,0,0,0,1.47.89,1.8,1.8,0,0,0,1.72-1.4"
        transform="translate(-270.31 -327.52)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      <Path
        d="M284,350a10,10,0,0,1,7.88,9.77v6.57a9.67,9.67,0,0,1-9.67,9.67h-.64a9.67,9.67,0,0,1-9.67-9.67v-6.57a10,10,0,0,1,8.34-9.85"
        transform="translate(-270.31 -327.52)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
    </Svg>
  );
};
