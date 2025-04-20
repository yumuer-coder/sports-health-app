'use client';

import { WorkoutList } from './WorkoutList';
import React from 'react';

interface YogaListProps {
  type: string;
}

export const YogaList: React.FC<YogaListProps> = ({ type }) => {
  return <WorkoutList type={type} />;
}; 