"use client";

import { useState } from "react";
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

const SubSelectToggleDemo = () => {
  const [tab, setTab] = useState(TABS[0]);
  const [subTab, setSubTab] = useState(SUB_TABS[0]);

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
