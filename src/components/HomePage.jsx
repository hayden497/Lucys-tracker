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
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            LUCY'S EVENT HIRE
          </h1>
          <p className="text-xl text-gray-600">Operations Hub</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 border-l-4 border-orange-500"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{tool.icon}</div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {tool.title}
                  </h2>
                  <p className="text-gray-600">{tool.description}</p>
                </div>
                <div className="text-orange-500">→</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center text-sm text-gray-500 mt-12">
          <p>Lucy's Event Hire NZ • Auckland & Palmerston North</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
