import React from 'react';
import './LoadingScreen.scss';

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="dice-container">
        <img src="/favicon.svg" alt="Loading" className="dice dice-1" />
        <img src="/favicon.svg" alt="Loading" className="dice dice-2" />
        <img src="/favicon.svg" alt="Loading" className="dice dice-3" />
      </div>
      <div className="loading-text">LOADING...</div>
    </div>
  );
}
