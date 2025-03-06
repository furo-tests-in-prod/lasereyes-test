'use client';

import { useEffect, useState } from 'react';
import { useLaserEyes } from '@omnisat/lasereyes';
import MintButton from '../components/MintButton';

export default function Home() {
  const [feeRate, setFeeRate] = useState(5);
  const [isEditingFee, setIsEditingFee] = useState(false);
  const [tempFeeRate, setTempFeeRate] = useState(5);
  
  // LaserEyes hook for wallet connection
  const {
    connected,
    isConnecting,
    address,
    hasOyl,
    connect,
    disconnect
  } = useLaserEyes();

  // Gas bubble animation setup
  useEffect(() => {
    const createBubbles = () => {
      const gasBg = document.getElementById('gas-background');
      if (!gasBg) return;
      
      const maxBubbles = 50;
      const currentBubbles = gasBg.querySelectorAll('.bubble').length;
      if (currentBubbles >= maxBubbles) return;

      const bubblesToCreate = Math.min(15, maxBubbles - currentBubbles);

      for (let i = 0; i < bubblesToCreate; i++) {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');

        const size = Math.random() * 120 + 80;
        const left = Math.random() * 100;
        const animationDelay = Math.random() * 5;
        const duration = Math.random() * 8 + 12;

        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${left}%`;
        bubble.style.animationDelay = `${animationDelay}s`;
        bubble.style.animationDuration = `${duration}s`;

        bubble.addEventListener('animationend', function() {
          this.remove();
        });

        gasBg.appendChild(bubble);
      }
    };

    createBubbles();
    const interval = setInterval(createBubbles, 3000);
    
    return () => clearInterval(interval);
  }, []);

  // Check if OYL wallet is available
  useEffect(() => {
    if (!hasOyl) {
      console.log("OYL wallet not detected");
    } else {
      console.log("OYL wallet detected");
    }
  }, [hasOyl]);

  const handleEditFee = () => {
    if (isEditingFee) {
      // Save the new fee value
      setFeeRate(tempFeeRate);
      setIsEditingFee(false);
    } else {
      setTempFeeRate(feeRate);
      setIsEditingFee(true);
    }
  };

  return (
    <main>
      {/* Gas animation background */}
      <div className="gas-background" id="gas-background"></div>

      <div className="container">
        <div className="content-wrapper">
          <div className="methane-header">
            <span style={{ letterSpacing: '-4px' }}>M</span>
            ETHA
            <span style={{ letterSpacing: '-4px' }}>NE</span>
          </div>
          
          <div className="content-box">
            <p className="info-text">
              The first memecoin on Alkanes,<br />
              a new metaprotocol built on Bitcoin.
            </p>
            
            <a href="#" className="learn-more">Learn more about Alkanes</a>
            
            <MintButton 
              connected={connected} 
              address={address}
              feeRate={feeRate}
              isConnecting={isConnecting}
              hasOyl={hasOyl}
              connect={connect}
              disconnect={disconnect}
            />
            
            <div className="fee-input-container" style={{ display: isEditingFee ? 'block' : 'none' }}>
              <input 
                type="number" 
                className="fee-input" 
                min="1" 
                value={tempFeeRate}
                onChange={(e) => setTempFeeRate(parseInt(e.target.value) || 1)}
                onKeyDown={(e) => e.key === 'Enter' && handleEditFee()}
              />
            </div>
            
            <div className="fee-rate">
              <span className="fee-text">Fee rate: {feeRate} sat/vB</span>
              <a href="#" className="edit-fee" onClick={(e) => {
                e.preventDefault();
                handleEditFee();
              }}>
                {isEditingFee ? 'Done' : 'Edit fee rate'}
              </a>
            </div>
          </div>
          
          {connected && address && (
            <div className="wallet-status wallet-connected">
              <div>Wallet Connected</div>
              <div>Address: <span className="wallet-address">{address}</span></div>
              <button 
                className="disconnect-button"
                onClick={disconnect}
              >
                Disconnect
              </button>
            </div>
          )}
          
          <a href="#" className="discord-link">Join the Methane Discord</a>
        </div>
      </div>
    </main>
  );
}
