import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface OilIconProps {
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
}

export const OilIcon: React.FC<OilIconProps> = ({
  width = 36,
  height = 45,
  stroke = '#231F20',
  fill = 'none',
}) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 36.15 44.9"
      fill="none"
    >
      {/* Bottle + Handle */}
      <Path
        d="M332.29,410.93v15.86a4.74,4.74,0,0,1-4.74,4.74h-9.68a4.74,4.74,0,0,1-4.73-4.74V410.93a4.74,4.74,0,0,1,2.3-4.07l3.25-1.94a1.28,1.28,0,0,0,.62-1.09v-6.91a.69.69,0,0,0-.69-.69h-.33a1.58,1.58,0,0,1-1.58-1.58v-.35a1.58,1.58,0,0,1,1.58-1.58h8.83a1.59,1.59,0,0,1,1.59,1.58v.35a1.59,1.59,0,0,1-1.59,1.58h-.32a.69.69,0,0,0-.69.69v6.91a1.25,1.25,0,0,0,.62,1.09l3.25,1.94A4.75,4.75,0,0,1,332.29,410.93Z"
        transform="translate(-296.89 -387.38)"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      {/* Cap */}
      <Path
        d="M23.7.75h4.25A1.24,1.24,0,0,1,29.19,2V5.34a0,0,0,0,1,0,0H22.46a0,0,0,0,1,0,0V2A1.24,1.24,0,0,1,23.7.75Z"
        stroke={stroke}
        strokeWidth={1.5}
        strokeMiterlimit={10}
        fill={fill}
      />

      {/* Oil Droplet Area */}
      <Path
        d="M298.62,427.62c-1.83-1.93-.88-6,1-8.34s5.94-4.47,8.51-2.73,2.39,6.05.68,8.68C306.53,428.79,300.8,429.91,298.62,427.62Z"
        transform="translate(-296.89 -387.38)"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      {/* Small lines */}
      <Path
        d="M307.3,420.3l3.91.34"
        transform="translate(-296.89 -387.38)"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      <Path
        d="M317.77,423.15c0-2.26.08-4.51.13-6.77"
        transform="translate(-296.89 -387.38)"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      <Path
        d="M313.14,411.79l19.15-.26"
        transform="translate(-296.89 -387.38)"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
    </Svg>
  );
};
