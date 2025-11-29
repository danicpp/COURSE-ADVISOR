import React from 'react';
import './StrategySelector.css';

const strategies = [
    {
        value: 'balanced',
        label: 'Balanced',
        emoji: '⚖️',
        description: 'A steady and even distribution of courses per semester.'
    },
    {
        value: 'aggressive',
        label: 'Fast Track',
        emoji: '🚀',
        description: 'A more intensive plan to graduate sooner.'
    },
    {
        value: 'relaxed',
        label: 'Relaxed Pace',
        emoji: '☕',
        description: 'A lighter course load for a more flexible schedule.'
    }
];

const StrategySelector = ({ selectedStrategy, onStrategyChange }) => {
    return (
        <div className="strategy-selector">
            <label className="strategy-label">AI Strategy:</label>
            <div className="strategy-options">
                {strategies.map(strategy => (
                    <div
                        key={strategy.value}
                        className={`strategy-option ${selectedStrategy === strategy.value ? 'selected' : ''}`}
                        onClick={() => onStrategyChange(strategy.value)}
                    >
                        <span className="strategy-emoji">{strategy.emoji}</span>
                        <div className="strategy-info">
                            <span className="strategy-title">{strategy.label}</span>
                            <span className="strategy-description">{strategy.description}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StrategySelector;