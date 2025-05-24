import React, { useRef, useEffect } from 'react';
import { PaperNode } from '@/types/types';

interface PaperDetailsProps {
  paper: PaperNode;
  onClose: () => void;
}

const PaperDetails: React.FC<PaperDetailsProps> = ({ paper, onClose }) => {
  const detailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (detailsRef.current && !detailsRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div 
      className="absolute top-0 left-0 right-0 z-50 flex justify-center"
      style={{ marginTop: '1rem' }}
      ref={detailsRef}
    >
      <div 
        className="w-[28rem] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with modern gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white p-4">
          <div className="flex justify-between items-start gap-4">
            <h3 className="text-lg font-bold">Paper Details</h3>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content section with improved layout */}
        <div className="p-5 space-y-4">
          {/* Title with elegant typography */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-500">📄 Title</h4>
            <p className="text-base font-semibold text-gray-900 leading-relaxed">
              {paper.title}
            </p>
          </div>

          {/* Stats with modern grid layout */}
          <div className="grid grid-cols-2 gap-4 bg-blue-50/50 rounded-lg p-4">
            <div className="space-y-1">
              <div className="text-xs text-gray-500">📅 Year</div>
              <div className="text-sm font-semibold text-gray-900">{paper.year}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-gray-500">📊 Citations</div>
              <div className="text-sm font-semibold text-gray-900">{paper.citationCount}</div>
            </div>
          </div>

          {/* Authors section with modern tags */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-500">👥 Authors</h4>
            <div className="flex flex-wrap gap-2">
              {paper.authors.map((author, idx) => (
                <span 
                  key={idx}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors"
                >
                  {author.name}
                </span>
              ))}
            </div>
          </div>

          {/* Venue with subtle styling */}
          {paper.venue && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-500">🏛️ Venue</h4>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100">
                {paper.venue}
              </p>
            </div>
          )}
        </div>

        {/* Footer with enhanced button */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-200">
          <a
            href={`https://www.semanticscholar.org/paper/${paper.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors duration-200 font-medium text-sm group"
          >
            View Paper
            <span className="group-hover:translate-x-0.5 transition-transform">
              ↗️
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default PaperDetails;