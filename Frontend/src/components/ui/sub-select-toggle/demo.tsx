"use client";

import SubSelectToggle from ".";
import type { MenuItem } from "."

const TABS: [MenuItem, MenuItem] = [
  { label: "Login", value: "login" },
  { label: "Register", value: "register" },
];

interface SubSelectToggleDemoProps {
  tab: MenuItem
  setTab: (tab: MenuItem) => void
  disabled?: boolean
  id?: string
}

const SubSelectToggleDemo = ({ tab, setTab, disabled, id = "auth-main-tabs" }: SubSelectToggleDemoProps) => {
  return (
    <div className="flex justify-center py-4 w-full">
      <SubSelectToggle
        tabs={TABS}
        tab={tab}
        setTab={setTab}
        disabled={disabled}
        id={id}
      />
    </div>
  );
};

export default SubSelectToggleDemo;
