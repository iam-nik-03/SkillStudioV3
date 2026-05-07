import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className={cn("bg-muted rounded-lg w-full h-4", className)}
        />
      ))}
    </>
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="glass p-6 rounded-[2rem] border border-glass-border space-y-4">
    <Skeleton className="h-40 w-full rounded-2xl" />
    <Skeleton className="h-6 w-3/4" />
    <div className="flex gap-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  </div>
);

export const CourseSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 desktop:grid-cols-3 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
    </div>
);
