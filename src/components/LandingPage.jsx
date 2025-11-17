import React from "react";
import { motion } from "framer-motion";
import { BarChart3, Database, Search, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

const LandingPage = () => {
  return (
    <div className="landing-container">
      {/* Hero Section */}
      <motion.h1
        className="hero-title"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        MULTIMODAL DEEP LEARNING FUSION <br />
        FOR ROTATING EQUIPMENT ANOMALY DETECTION
      </motion.h1>

      <motion.p
        className="hero-description"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        Combining multiple sensor data streams to detect abnormal behavior in rotating equipment using deep learning.
      </motion.p>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <Link to="/viewer" className="view-dashboard-button">
          View Dashboard
        </Link>
      </motion.div>

      {/* Features Section */}
      <motion.div
        className="features-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
      >
        <div className="feature-item">
          <BarChart3 className="feature-icon blue" />
          <p>Visualize Data</p>
        </div>
        <div className="feature-item">
          <Database className="feature-icon green" />
          <p>Connect Sheets</p>
        </div>
        <div className="feature-item">
          <Search className="feature-icon yellow" />
          <p>Filter & Search</p>
        </div>
        <div className="feature-item">
          <Zap className="feature-icon purple" />
          <p>Fast & Smooth</p>
        </div>
      </motion.div>
    </div>
  );
};

export default LandingPage;
