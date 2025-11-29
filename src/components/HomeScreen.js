import React from 'react';
import './HomeScreen.css';
import logo from '../logo.png';

const HomeScreen = ({ onGetStarted }) => {
    return (
        <div className="home-container">
            <div className="home-content">
                <div className="header">
                    <img src={logo} alt="University Logo" className="home-logo" />
                    <h1 className="home-title">Course Advisor</h1>
                </div>
                <p className="home-description">
                    Your personalized guide to university success. Plan your academic journey with our intelligent course recommendation system.
                </p>

                <div className="features-section">
                    <div className="feature">
                        <h2>Explore Our University</h2>
                        <p>Founded in 1950, our university has a rich history of academic excellence and innovation. We offer a wide range of programs and have a diverse and vibrant student community.</p>
                    </div>
                    <div className="feature">
                        <h2>About Our Department</h2>
                        <p>The Computer Science department is committed to providing a state-of-the-art education. Our curriculum is designed to equip students with the skills and knowledge needed to excel in the tech industry.</p>
                    </div>
                </div>

                <div className="planning-logics-section">
                    <h2>Discover Your Planning Style</h2>
                    <div className="logics-container">
                        <div className="logic-card">
                            <h3>Balanced Plan</h3>
                            <p>A balanced approach that evenly distributes course load across semesters, ensuring a steady pace towards graduation.</p>
                        </div>
                        <div className="logic-card">
                            <h3>Aggressive Plan</h3>
                            <p>For the ambitious student who wants to graduate early. This plan prioritizes completing prerequisite courses as quickly as possible.</p>
                        </div>
                        <div className="logic-card">
                            <h3>Relaxed Plan</h3>
                            <p>A more flexible approach that allows for a lighter course load, giving you more time for electives and extracurricular activities.</p>
                        </div>
                    </div>
                </div>

                <button onClick={onGetStarted} className="home-button">
                    Get Started
                </button>
            </div>
        </div>
    );
};

export default HomeScreen;