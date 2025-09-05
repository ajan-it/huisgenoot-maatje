import React from 'react';

interface PersonNameDisplayProps {
  person: {
    id: string;
    first_name: string;
    role?: string;
  } | null;
  fallback?: string;
  className?: string;
}

export function PersonNameDisplay({ person, fallback, className = "" }: PersonNameDisplayProps) {
  if (!person) {
    return <span className={className}>{fallback || 'Unassigned'}</span>;
  }

  // Always prefer the stored first_name over any fallback
  const displayName = person.first_name || fallback || 'Unknown';
  
  return (
    <span className={className} title={`Person: ${displayName} (${person.role || 'no role'})`}>
      {displayName}
    </span>
  );
}