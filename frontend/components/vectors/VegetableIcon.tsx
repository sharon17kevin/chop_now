import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface VegetableIconProps {
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
}

export const VegetableIcon: React.FC<VegetableIconProps> = ({
  width = 36,
  height = 33,
  stroke = '#231F20',
  fill = 'none',
  strokeWidth = 1.5,
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 36.12 33.47" fill="none">
      <Path
        d="M332.61,384.36A17.7,17.7,0,0,0,317.7,377c-3.87,6.93-3,15.19,1.81,20.23s12,4.76,13.11,4.68"
        transform="translate(-314.52 -369.23)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
      <Path
        d="M321.21,385.13a45.45,45.45,0,0,0,11.14,16.29"
        transform="translate(-314.52 -369.23)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
      <Path
        d="M325.55,385.81l-.9,6.25"
        transform="translate(-314.52 -369.23)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
      <Path
        d="M320.33,377.18a13,13,0,0,1,9.82-7.2l1.62,2.9"
        transform="translate(-314.52 -369.23)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
      <Path
        d="M326.57,379l6.3-7.16,5.75,7"
        transform="translate(-314.52 -369.23)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
      <Path
        d="M344.56,376.76a11.59,11.59,0,0,0-9.05-6.78l-2,2.6"
        transform="translate(-314.52 -369.23)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
      <Path
        d="M332.62,401.9c-.54-.91-4.17-7.19-1.62-14.3a17.34,17.34,0,0,1,15.66-11.07,15.83,15.83,0,0,1-14,25.37Z"
        transform="translate(-314.52 -369.23)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
      <Path
        d="M332.62,401.9a26.39,26.39,0,0,0,9.78-18"
        transform="translate(-314.52 -369.23)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
      <Path
        d="M335.63,390.56a7.75,7.75,0,0,1,.9,1.63,8.61,8.61,0,0,1,.11,5.71"
        transform="translate(-314.52 -369.23)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
      <Path
        d="M344.79,390.75a6.28,6.28,0,0,1-5.32,2.87"
        transform="translate(-314.52 -369.23)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
    </Svg>
  );
};
