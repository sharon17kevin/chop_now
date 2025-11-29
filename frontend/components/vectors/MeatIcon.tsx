import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface MeatIconProps {
  width?: number;
  height?: number;
  stroke?: string;   // main stroke color
  fill?: string;     // optional fill (kept transparent by default)
  strokeWidth?: number;
}

export const MeatIcon: React.FC<MeatIconProps> = ({
  width = 40,
  height = 34,
  stroke = '#231F20',
  fill = 'none',
  strokeWidth = 1.5,
}) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 39.9 33.41"
      fill="none"
    >
      <Path
        d="M273.1,354.18a13.2,13.2,0,0,1,5-1.79c4.25-.51,7.57,1.41,9.71,2.68,3.26,1.94,9.91,5.9,9.83,12.4-.06,6.23-6.22,10-6.51,10.19-2.41,1.43-5.27,1.55-11,1.79-6,.25-9.06.38-11.88-1-1.17-.58-6.2-3.3-7.09-8.23-.73-4,1.65-7.66,4.42-10.42"
        transform="translate(-258.49 -346.95)"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      <Path
        d="M290,374.22a7.63,7.63,0,0,0,2.81-2,7.43,7.43,0,0,0,1.15-1.79"
        transform="translate(-258.49 -346.95)"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      <Path
        d="M294.34,368.35l.06-1.41"
        transform="translate(-258.49 -346.95)"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      <Path
        d="M265.57,356.51a1.37,1.37,0,0,0-.4,1.17c.36,2.32,1.84,9.32,7,11.32a6.68,6.68,0,0,0,4.71.24,6.77,6.77,0,0,0,4.15-5.87c.18-4.09-4.06-6.86-5.88-8.05a16.18,16.18,0,0,0-5.21-2.21,1.36,1.36,0,0,0-1.24.36Z"
        transform="translate(-258.49 -346.95)"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />

      <Path
        d="M268.22,353.94l-2.5-2.32a2.39,2.39,0,0,0-.07-3.51,2.08,2.08,0,0,0-3.31,2.24,2.32,2.32,0,0,0-2,0,2.18,2.18,0,0,0-.83,2.8,2.36,2.36,0,0,0,3.45.52c.91.92,1.81,1.85,2.72,2.78Z"
        transform="translate(-258.49 -346.95)"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
    </Svg>
  );
};
