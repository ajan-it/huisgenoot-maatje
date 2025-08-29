// Task category color mapping utilities
// Provides centralized color management for task categorization

export type TaskCategory = 
  | "kitchen" 
  | "cleaning" 
  | "childcare" 
  | "errands" 
  | "admin" 
  | "safety" 
  | "maintenance" 
  | "garden" 
  | "appliance" 
  | "selfcare" 
  | "outdoor" 
  | "seasonal";

export const getCategoryColor = (category: string): string => {
  const categoryMap: Record<string, string> = {
    kitchen: "category-kitchen",
    cleaning: "category-cleaning", 
    childcare: "category-childcare",
    errands: "category-errands",
    admin: "category-admin",
    safety: "category-safety",
    maintenance: "category-maintenance",
    garden: "category-garden",
    appliance: "category-appliance",
    selfcare: "category-selfcare",
    outdoor: "category-outdoor",
    seasonal: "category-seasonal",
  };
  
  return categoryMap[category] || "category-admin";
};

export const getCategoryBgColor = (category: string): string => {
  const categoryMap: Record<string, string> = {
    kitchen: "category-bg-kitchen",
    cleaning: "category-bg-cleaning", 
    childcare: "category-bg-childcare",
    errands: "category-bg-errands",
    admin: "category-bg-admin",
    safety: "category-bg-safety",
    maintenance: "category-bg-maintenance",
    garden: "category-bg-garden",
    appliance: "category-bg-appliance",
    selfcare: "category-bg-selfcare",
    outdoor: "category-bg-outdoor",
    seasonal: "category-bg-seasonal",
  };
  
  return categoryMap[category] || "category-bg-admin";
};

export const getCategoryColorClasses = (category: string) => {
  return {
    color: `text-${getCategoryColor(category)}`,
    bg: `bg-${getCategoryBgColor(category)}`,
    border: `border-${getCategoryColor(category)}`,
    borderLeft: `border-l-${getCategoryColor(category)}`,
  };
};

// Category-specific icons for visual identification
export const getCategoryIcon = (category: string): string => {
  const iconMap: Record<string, string> = {
    kitchen: "🍳",
    cleaning: "🧹", 
    childcare: "👶",
    errands: "🏃",
    admin: "📋",
    safety: "⚠️",
    maintenance: "🔧",
    garden: "🌱",
    appliance: "⚙️",
    selfcare: "💆",
    outdoor: "🌳",
    seasonal: "🍂",
  };
  
  return iconMap[category] || "📋";
};

// Frequency-based intensity classes for visual hierarchy
export const getFrequencyIntensity = (frequency: string): string => {
  const intensityMap: Record<string, string> = {
    daily: "font-semibold opacity-100",
    "two_per_week": "font-medium opacity-90", 
    "three_per_week": "font-medium opacity-90",
    weekly: "font-normal opacity-80",
    biweekly: "font-normal opacity-70",
    monthly: "font-light opacity-60",
    quarterly: "font-light opacity-50",
    semiannual: "font-light opacity-40",
    annual: "font-light opacity-40",
    seasonal: "font-light opacity-50",
    custom: "font-normal opacity-70"
  };
  
  return intensityMap[frequency] || "font-normal opacity-70";
};