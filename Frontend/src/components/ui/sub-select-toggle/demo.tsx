"use client";

import SubSelectToggle from ".";
import type { MenuItem } from "."

const TABS: [MenuItem, MenuItem] = [
  { label: "Login", value: "login" },
  { label: "Register", value: "register" },
];

const SUB_TABS: [MenuItem, MenuItem] = [
  { label: "New Org", value: "newOrg" },
  { label: "Existing Org", value: "existingOrg" },
];


interface SubSelectToggleDemoProps {
  tab: MenuItem
  setTab: (tab: MenuItem) => void
  subTab: MenuItem
  setSubTab: (tab: MenuItem) => void
}

const SubSelectToggleDemo = ({ tab, setTab, subTab, setSubTab }: SubSelectToggleDemoProps) => {

  return (
    <div className="flex justify-center py-8">
      <SubSelectToggle
        tabs={TABS}
        subTabs={SUB_TABS}
        tab={tab}
        setTab={setTab}
        subTab={subTab}
        setSubTab={setSubTab}
      />
    </div>
  );
};
export default SubSelectToggleDemo;
