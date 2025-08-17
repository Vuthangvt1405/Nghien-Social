import React from "react";
import type { AccountSection } from "../../types/accountSettings";

interface AccountNavigationProps {
  sections: AccountSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

const AccountNavigation: React.FC<AccountNavigationProps> = ({
  sections,
  activeSection,
  onSectionChange,
}) => {
  return (
    <div className="mb-6 overflow-hidden bg-white rounded-lg shadow-lg">
      {/* Desktop Tabs */}
      <div className="hidden border-b border-gray-200 md:flex">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={`
              flex items-center gap-3 px-6 py-4 font-medium transition-all duration-200
              ${
                activeSection === section.id
                  ? "text-orange-600 border-b-2 border-orange-600 bg-orange-50"
                  : "text-gray-600 hover:text-orange-600 hover:bg-gray-50"
              }
            `}
          >
            <span className="text-lg">{section.icon}</span>
            <span>{section.label}</span>
            {section.badge && section.badge > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                {section.badge > 99 ? "99+" : section.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Mobile Dropdown */}
      <div className="p-4 md:hidden">
        <select
          value={activeSection}
          onChange={(e) => onSectionChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.label}
              {section.badge && section.badge > 0 && ` (${section.badge})`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default AccountNavigation;
