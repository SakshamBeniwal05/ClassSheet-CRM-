"use client";

import { motion, MotionConfig } from "motion/react";
import type { Transition } from "motion/react"

export interface MenuItem {
  label: string;
  value: string;
}

interface Props {
  tabs: [MenuItem, MenuItem];
  tab: MenuItem;
  setTab: (tab: MenuItem) => void;
  transition?: Transition;
  disabled?: boolean;
}

const SubSelectToggle = ({
  tabs,
  tab,
  setTab,
  transition = { type: "spring", duration: 0.4, bounce: 0.15 },
  disabled = false,
}: Props) => {
  return (
    <div>
      <MotionConfig transition={transition}>
        <div className={`flex h-12 rounded-full bg-tSecondary p-1 text-sm border border-colorNeutral/25 shadow-2xl relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
          {tabs.map((t) => {
            const isActive = t.value === tab.value;
            return (
              <motion.button
                onClick={() => !disabled && setTab(t)}
                disabled={disabled}
                key={t.value}
                initial={{ color: isActive ? "#FFFFFF" : "var(--color-colorNeutral)" }}
                animate={{ color: isActive ? "#FFFFFF" : "var(--color-colorNeutral)" }}
                className="relative w-[120px] sm:w-[150px] h-full cursor-pointer font-bold rounded-full focus:outline-none z-10"
              >
                <span className="relative z-10 text-xs sm:text-sm">{t.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 rounded-full bg-colorPrimary shadow-lg"
                    style={{ originY: "0px" }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </MotionConfig>
    </div>
  );
};

export default SubSelectToggle;
