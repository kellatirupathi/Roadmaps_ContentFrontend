import { useState, useEffect } from 'react';
import { Link, useLocation, NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('/');
  const location = useLocation();
  const navigate = useNavigate();

  // Handle navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Set active section based on location
  useEffect(() => {
    setActiveSection(location.pathname);
  }, [location]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const menu = document.querySelector('.navbar-menu');
      const toggle = document.querySelector('.mobile-menu-toggle');
      
      if (mobileMenuOpen && menu && toggle && 
          !menu.contains(event.target) && 
          !toggle.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Close menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Handle navigation
  const handleNavigation = (path, e) => {
    // If we're already on the path, prevent default and do nothing
    if (location.pathname === path) {
      e.preventDefault();
      return;
    }
    
    // Navigate to path
    navigate(path);
  };

  return (
    <nav className={`app-navbar ${scrolled ? 'scrolled' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
      <div className="navbar-container">
        {/* Logo with link to home */}
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo">
            <img src="/logo.svg" alt="Tech Stack Roadmap" className="logo-image" />
          </div>
          <div className="brand-container">
            <span className="brand-text">NIAT</span>
            <span className="brand-subtext">Tech Stacks</span>
          </div>
        </Link>
        
        {/* Mobile menu toggle */}
        <button 
          className="mobile-menu-toggle" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        {/* Navigation items - Only Tech Stacks and New Stack */}
        <div className={`navbar-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="navbar-actions">
            <div className="nav-buttons">
              {/* All Techstacks Button */}
              <NavLink 
                to="/" 
                className={({isActive}) => 
                  isActive ? "nav-btn techstacks-btn active-nav-btn" : "nav-btn techstacks-btn"
                }
                onClick={(e) => handleNavigation('/', e)}
              >
                <i className="fas fa-layer-group"></i>
                <span>Tech Stacks</span>
              </NavLink>
              
              {/* New Techstack Button */}
              <NavLink 
                to="/newtechstack" 
                className={({isActive}) => 
                  isActive ? "nav-btn add-tech-stack-btn active-nav-btn" : "nav-btn add-tech-stack-btn"
                }
                onClick={(e) => handleNavigation('/newtechstack', e)}
              >
                <div className="add-icon-wrapper">
                  <i className="fas fa-plus"></i>
                </div>
                <span>New Stack</span>
              </NavLink>
            </div>
            
            {/* User Profile (Optional) */}
            <div className="user-profile">
              <div className="user-avatar">
                <i className="fas fa-user"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar for page transitions */}
      <div className="nav-progress-container">
        <div className={`nav-progress-bar ${activeSection !== '/' ? 'animate' : ''}`}></div>
      </div>
    </nav>
  );
};

export default Navbar;
