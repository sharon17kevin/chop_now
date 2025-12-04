import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface GrainsIconProps {
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
}

export const GrainsIcon: React.FC<GrainsIconProps> = ({
  width = 22,
  height = 47,
  stroke = '#231F20',
  fill = 'none',
  strokeWidth = 1.5,
}) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 21.74 46.78"
      fill="none"
    >
      <Path
        d="M222,324.36a12,12,0,0,1,10-9.7,8.52,8.52,0,0,1-10,9.7Z"
        transform="translate(-211.13 -283.61)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
      <Path
        d="M222,314.54a12,12,0,0,1,10-9.7,8.52,8.52,0,0,1-10,9.7Z"
        transform="translate(-211.13 -283.61)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
      <Path
        d="M222,304.07a12,12,0,0,1,10-9.7,8.52,8.52,0,0,1-10,9.7Z"
        transform="translate(-211.13 -283.61)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
      <Path
        d="M222,324.36a12,12,0,0,0-10-9.7,8.52,8.52,0,0,0,10,9.7Z"
        transform="translate(-211.13 -283.61)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
      <Path
        d="M222,314.54a12,12,0,0,0-10-9.7,8.52,8.52,0,0,0,10,9.7Z"
        transform="translate(-211.13 -283.61)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
      <Path
        d="M222,304.07a12,12,0,0,0-10-9.7,8.52,8.52,0,0,0,10,9.7Z"
        transform="translate(-211.13 -283.61)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
      <Path
        d="M222,329.64V296.53"
        transform="translate(-211.13 -283.61)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
      <Path
        d="M222,296.53a7.48,7.48,0,0,0,3.32-6,7.57,7.57,0,0,0-3.58-6.13,8.29,8.29,0,0,0-2.83,6.89A7.94,7.94,0,0,0,222,296.53Z"
        transform="translate(-211.13 -283.61)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
    </Svg>
  );
};
