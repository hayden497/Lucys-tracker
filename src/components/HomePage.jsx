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
