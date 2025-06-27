import React from 'react';
import { AlertCircle } from 'lucide-react';

interface AIInsightsDisplayProps {
  analysisData: any;
  className?: string;
}

const AIInsightsDisplay: React.FC<AIInsightsDisplayProps> = ({ analysisData, className = '' }) => {
  if (!analysisData) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">No AI analysis data is available for this interview.</p>
        <p className="text-sm text-gray-400 mt-2">This could be because the interview was too short or there was an issue with the analysis process.</p>
      </div>
    );
  }

  // Function to format keys from snake_case to Title Case
  const formatKey = (key: string): string => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Recursively render JSON data
  const renderData = (data: any, depth: number = 0): JSX.Element => {
    if (data === null || data === undefined) {
      return <span className="text-gray-400">None</span>;
    }

    if (typeof data === 'string') {
      return <span className="text-gray-800">{data}</span>;
    }

    if (typeof data === 'number' || typeof data === 'boolean') {
      return <span className="text-blue-600 font-medium">{data.toString()}</span>;
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return <span className="text-gray-400">Empty array</span>;
      }

      return (
        <ul className="pl-4 space-y-2 list-disc">
          {data.map((item, index) => (
            <li key={index} className="text-gray-800">
              {typeof item === 'object' ? renderData(item, depth + 1) : item}
            </li>
          ))}
        </ul>
      );
    }

    // Object
    return (
      <div className={`${depth > 0 ? 'pl-4 mt-2' : ''}`}>
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="mb-3">
            <div className="font-medium text-gray-700">{formatKey(key)}</div>
            <div className="ml-4">{renderData(value, depth + 1)}</div>
          </div>
        ))}
      </div>
    );
  };

  // Main categories to display
  const categories = [
    { key: 'behavioral_analysis', title: 'Behavioral Analysis' },
    { key: 'emotional_state', title: 'Emotional State' },
    { key: 'communication_patterns', title: 'Communication Patterns' },
    { key: 'body_language', title: 'Body Language' },
    { key: 'engagement_level', title: 'Engagement Level' },
    { key: 'confidence_indicators', title: 'Confidence Indicators' }
  ];

  // Find categories that exist in the data
  const existingCategories = categories.filter(
    category => analysisData[category.key] !== undefined
  );

  // If no predefined categories match, just show all data
  const categoriesToShow = existingCategories.length > 0 
    ? existingCategories 
    : [{ key: 'all', title: 'Analysis Data' }];

  return (
    <div className={`space-y-6 ${className}`}>
      {categoriesToShow.map(category => (
        <div key={category.key} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">{category.title}</h3>
          <div className="text-sm">
            {category.key === 'all' 
              ? renderData(analysisData) 
              : renderData(analysisData[category.key])}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AIInsightsDisplay;