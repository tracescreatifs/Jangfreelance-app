
import React from 'react';
import Sidebar from '../components/Sidebar';
import Timer from '../components/Timer';

const TimerPage = () => {
  return (
    <div className="min-h-screen">
      <Sidebar />
      
      <div className="lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Timer de Projet</h1>
            <p className="text-white/50">Suivez le temps passé sur vos projets</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Timer />
        </div>
      </div>
    </div>
  );
};

export default TimerPage;
