import React from 'react';
import './LoadingScreen.scss';

import diceLoading from '../../assets/images/dice-loading.svg';

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <img src={diceLoading} alt="Loading" className="dice-center" />
    </div>
  );
}
