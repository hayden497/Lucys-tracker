import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const tools = [
    {
      title: 'Labour Dashboard',
      description: 'Monthly labour tracking and reporting',
      path: '/labour',
      icon: '👷'
    },
    {
      title: 'Deputy Import',
      description: 'Import timesheet data from Deputy API',
      path: '/labour/import',
      icon: '📥'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <div className="w-16 h-1 bg-orange-500 mx-auto"></div>
 import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const tools = [
    {
      title: 'Labour Dashboard',
      description: 'Monthly labour tracking and reporting',
      path: '/labour',
      icon: '👷'
    },
    {
      title: 'Deputy Import',
      description: 'Import timesheet data from Deputy API',
      path: '/labour/import',
      icon: '📥'
    }
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #FFF5F0 0%, #F2E9C7 100%)' }}>
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <div className="h-1 w-24 mx-auto" style={{ backgroundColor: '#FF673E' }}></div>
          </div>
          <h1 className="text-5xl font-bold mb-3" style={{ 
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#1C1B1B',
            letterSpacing: '-0.02em'
          }}>
            LUCY'S EVENT HIRE
          </h1>
          <p className="text-2xl" style={{ color: '#555555' }}>Operations Hub</p>
        </div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {tools.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="group"
            >
              <div 
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-l-8 transform hover:-translate-y-1"
                style={{ borderColor: '#FF673E' }}
              >
                <div className="flex items-start gap-6">
                  <div className="text-5xl">{tool.icon}</div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-3" style={{ color: '#1C1B1B' }}>
                      {tool.title}
                    </h2>
                    <p className="text-lg" style={{ color: '#666666' }}>
                      {tool.description}
                    </p>
                  </div>
                  <div className="text-3xl transition-transform group-hover:translate-x-2" style={{ color: '#FF673E' }}>
                    →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-sm" style={{ color: '#999999' }}>
            Lucy's Event Hire NZ • Auckland & Palmerston North
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

