"use client";

import { AnimatePresence, motion } from "framer-motion";

interface AnimatedTabContentProps {
  tabKey: string;
  children: React.ReactNode;
  className?: string;
}

export function AnimatedTabContent({
  tabKey,
  children,
  className,
}: AnimatedTabContentProps): React.ReactElement {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tabKey}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
