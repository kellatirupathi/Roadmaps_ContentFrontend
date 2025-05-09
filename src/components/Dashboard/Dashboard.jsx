import { useState, useEffect } from 'react';
import { Button, Alert, Badge, Modal, Table, Form, Dropdown, Spinner } from 'react-bootstrap';
import TechStackTable from '../TechStackTable/TechStackTable';
import { getAllTechStacks, getTechStackById, updateTechStack } from '../../services/techStackService';
import './Dashboard.css';

const Dashboard = ({ view = "all-roadmaps" }) => {
  const [techStacks, setTechStacks] = useState([]);
  const [allTechStacksData, setAllTechStacksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    totalTechStacks: 0
  });
  
  // State for stat details modal
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState([]);
  const [updatingItemIds, setUpdatingItemIds] = useState([]);

  // Fetch all tech stack names for the dropdown and all tech stack data for display
  useEffect(() => {
    const fetchTechStacks = async () => {
      try {
        setLoading(true);
        
        const response = await getAllTechStacks();
        setTechStacks(response.data);
        
        if (response.data.length > 0) {
          const fetchPromises = response.data.map(stack => getTechStackById(stack._id));
          const results = await Promise.allSettled(fetchPromises);
          
          const successfulData = results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value.data);
          
          setAllTechStacksData(successfulData);
          
          calculateOverallStats(successfulData);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch tech stacks');
        setLoading(false);
      }
    };
  
    fetchTechStacks();
  }, []);

  // Calculate overall stats from all tech stacks
  const calculateOverallStats = (techStacksData) => {
    const newStats = {
      total: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      totalTechStacks: techStacksData.length
    };
    
    techStacksData.forEach(stack => {
      stack.roadmapItems.forEach(item => {
        newStats.total++;
        switch (item.completionStatus) {
          case 'Completed':
            newStats.completed++;
            break;
          case 'In Progress':
            newStats.inProgress++;
            break;
          case 'Yet to Start':
          default:
            newStats.notStarted++;
            break;
        }
      });
    });
    
    setStats(newStats);
  };

  // Handle tech stack update
  const handleTechStackUpdated = (updatedTechStack) => {
    // Update the specific tech stack in the data array
    setAllTechStacksData(prevData => {
      const updated = prevData.map(techStack => 
        techStack._id === updatedTechStack._id ? updatedTechStack : techStack
      );
      
      // Recalculate stats
      calculateOverallStats(updated);
      
      return updated;
    });
  };
  
  // Handle tech stack deletion
  const handleTechStackDeleted = (deletedId) => {
    // Remove the deleted tech stack from all tech stacks data
    setAllTechStacksData(prevData => {
      const updated = prevData.filter(techStack => techStack._id !== deletedId);
      
      // Recalculate stats
      calculateOverallStats(updated);
      
      return updated;
    });
    
    // Update tech stacks list
    setTechStacks(prevStacks => 
      prevStacks.filter(stack => stack._id !== deletedId)
    );
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle search category change
  const handleSearchCategoryChange = (category) => {
    setSearchCategory(category);
  };
  
  // Filter tech stacks based on search term and category
  const filteredTechStacks = allTechStacksData.filter(stack => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    switch (searchCategory) {
      case 'techstack':
        // Search only in tech stack name
        return stack.name.toLowerCase().includes(searchLower);
      case 'topic':
        return stack.roadmapItems.some(item => 
          item.topic.toLowerCase().includes(searchLower)
        );
      case 'subtopic':
        return stack.roadmapItems.some(item => 
          item.subTopics.some(sub => sub.name.toLowerCase().includes(searchLower))
        );
      case 'project':
        return stack.roadmapItems.some(item => 
          item.projects.some(proj => proj.name.toLowerCase().includes(searchLower))
        );
      case 'all':
      default:
        // Search in tech stack name
        if (stack.name.toLowerCase().includes(searchLower)) return true;
        
        // Search in roadmap items
        return stack.roadmapItems.some(item => 
          item.topic.toLowerCase().includes(searchLower) ||
          item.subTopics.some(sub => sub.name.toLowerCase().includes(searchLower)) ||
          item.projects.some(proj => proj.name.toLowerCase().includes(searchLower))
        );
    }
  });

  // Updated showAllTechStacksDetails function with editing capabilities - Removed progress column
  const showAllTechStacksDetails = () => {
    setModalTitle("All Techstacks");
    
    // Generate data for each tech stack with a summary of topics and editing capability
    const data = [];
    
    allTechStacksData.forEach(stack => {
      const totalTopics = stack.roadmapItems.length;
      const completedTopics = stack.roadmapItems.filter(item => item.completionStatus === 'Completed').length;
      const inProgressTopics = stack.roadmapItems.filter(item => item.completionStatus === 'In Progress').length;
      const notStartedTopics = stack.roadmapItems.filter(item => item.completionStatus === 'Yet to Start').length;
      
      data.push({
        techStack: stack.name,
        id: stack._id,
        totalTopics,
        completedTopics,
        inProgressTopics,
        notStartedTopics,
        isEditing: false, // Track edit mode for each stack
        description: stack.description || '' // Include description for editing
      });
    });
    
    setModalData(data);
    setShowStatsModal(true);
  };

  // Add new function to toggle edit mode for a specific tech stack
  const toggleEditMode = (index) => {
    setModalData(prevData => {
      const newData = [...prevData];
      newData[index] = {
        ...newData[index],
        isEditing: !newData[index].isEditing
      };
      return newData;
    });
  };

  // Add function to update tech stack name or description
  const handleTechStackUpdate = async (index, field, value) => {
    try {
      const item = modalData[index];
      
      // Create update object with the field to update
      const updateData = {};
      updateData[field] = value;
      
      // Update local state first for immediate feedback
      setModalData(prevData => {
        const newData = [...prevData];
        newData[index] = {
          ...newData[index],
          [field]: value
        };
        return newData;
      });
      
      // Add this item to the updating list
      setUpdatingItemIds(prev => [...prev, item.id]);
      
      // Call API to update tech stack
      const result = await updateTechStack(item.id, updateData);
      
      // Update the global state with updated tech stack
      handleTechStackUpdated(result.data);
      
      // Remove this item from the updating list
      setUpdatingItemIds(prev => prev.filter(id => id !== item.id));
      
      // Close edit mode
      toggleEditMode(index);
      
      
    } catch (err) {
      setError('Failed to update tech stack');
      
      // Remove this item from the updating list
      const item = modalData[index];
      setUpdatingItemIds(prev => prev.filter(id => id !== item.id));
    }
  };

  // Show details for total topics
  const showTotalTopicsDetails = () => {
    setModalTitle("Total Topics");
    
    // Generate data for each tech stack with topics
    const data = [];
    
    allTechStacksData.forEach(stack => {
      stack.roadmapItems.forEach(item => {
        data.push({
          techStack: stack.name,
          techStackId: stack._id,
          topic: item.topic,
          topicId: item._id,
          status: item.completionStatus
        });
      });
    });
    
    setModalData(data);
    setShowStatsModal(true);
  };

  // Show details for completed topics
  const showCompletedTopicsDetails = () => {
    setModalTitle("Completed Topics");
    
    // Generate data for each tech stack with completed topics
    const data = [];
    
    allTechStacksData.forEach(stack => {
      stack.roadmapItems
        .filter(item => item.completionStatus === 'Completed')
        .forEach(item => {
          data.push({
            techStack: stack.name,
            techStackId: stack._id,
            topic: item.topic,
            topicId: item._id,
            status: item.completionStatus
          });
        });
    });
    
    setModalData(data);
    setShowStatsModal(true);
  };

  // Show details for in progress topics
  const showInProgressTopicsDetails = () => {
    setModalTitle("In Progress Topics");
    
    // Generate data for each tech stack with in progress topics
    const data = [];
    
    allTechStacksData.forEach(stack => {
      stack.roadmapItems
        .filter(item => item.completionStatus === 'In Progress')
        .forEach(item => {
          data.push({
            techStack: stack.name,
            techStackId: stack._id,
            topic: item.topic,
            topicId: item._id,
            status: item.completionStatus
          });
        });
    });
    
    setModalData(data);
    setShowStatsModal(true);
  };

  // Show details for yet to start topics
  const showYetToStartTopicsDetails = () => {
    setModalTitle("Yet to Start Topics");
    
    // Generate data for each tech stack with yet to start topics
    const data = [];
    
    allTechStacksData.forEach(stack => {
      stack.roadmapItems
        .filter(item => item.completionStatus === 'Yet to Start')
        .forEach(item => {
          data.push({
            techStack: stack.name,
            techStackId: stack._id,
            topic: item.topic,
            topicId: item._id,
            status: item.completionStatus
          });
        });
    });
    
    setModalData(data);
    setShowStatsModal(true);
  };

  // Updated renderModalContent function to support editing and without Progress column
  const renderModalContent = () => {
    if (modalTitle === "All Techstacks") {
      return (
        <Table striped bordered hover responsive>
          <thead className="table-dark">
            <tr>
              <th>Tech Stack</th>
              <th>Description</th>
              <th>Total Topics</th>
              <th>Completed</th>
              <th>In Progress</th>
              <th>Yet to Start</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {modalData.map((item, index) => (
              <tr key={index}>
                <td>
                  {item.isEditing ? (
                    <Form.Control
                      type="text"
                      value={item.techStack}
                      onChange={(e) => setModalData(prevData => {
                        const newData = [...prevData];
                        newData[index] = {
                          ...newData[index],
                          techStack: e.target.value
                        };
                        return newData;
                      })}
                      className="form-control-sm"
                    />
                  ) : (
                    item.techStack
                  )}
                </td>
                <td>
                  {item.isEditing ? (
                    <Form.Control
                      type="text"
                      value={item.description}
                      onChange={(e) => setModalData(prevData => {
                        const newData = [...prevData];
                        newData[index] = {
                          ...newData[index],
                          description: e.target.value
                        };
                        return newData;
                      })}
                      className="form-control-sm"
                      placeholder="Add description"
                    />
                  ) : (
                    item.description || <span className="text-muted">No description</span>
                  )}
                </td>
                <td>{item.totalTopics}</td>
                <td>
                  <span className="status-badge completed">
                    {item.completedTopics}
                  </span>
                </td>
                <td>
                  <span className="status-badge in-progress">
                    {item.inProgressTopics}
                  </span>
                </td>
                <td>
                  <span className="status-badge yet-to-start">
                    {item.notStartedTopics}
                  </span>
                </td>
                <td>
                  {updatingItemIds.includes(item.id) ? (
                    <div className="text-center">
                      <Spinner animation="border" size="sm" />
                    </div>
                  ) : item.isEditing ? (
                    <div className="d-flex gap-2">
                      <Button 
                        variant="success" 
                        size="sm"
                        onClick={() => handleTechStackUpdate(index, 'name', item.techStack)}
                        title="Save changes"
                      >
                        <i className="fas fa-check"></i>
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => toggleEditMode(index)}
                        title="Cancel"
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    </div>
                  ) : (
                    <div className="d-flex gap-2">
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => toggleEditMode(index)}
                        title="Edit"
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      );
    } else {
      // For other modal types - showing topics with status as read-only text
      return (
        <Table striped bordered hover responsive>
          <thead className="table-dark">
            <tr>
              <th>Tech Stack</th>
              <th>Topic</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {modalData.map((item, index) => (
              <tr key={index}>
                <td>{item.techStack}</td>
                <td>{item.topic}</td>
                <td>
                  <span className={`status-badge ${item.status.toLowerCase().replace(' ', '-')}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      );
    }
  };

  // Render loading spinner for all-roadmaps view
  const renderLoadingSpinner = () => {
    return (
      <div className="loading-state">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="loading-text">Loading Techstacks...</p>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      {error && (
        <div className="alert-container">
          <Alert variant="danger" onClose={() => setError(null)} dismissible className="alert-message">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
          </Alert>
        </div>
      )}
      
      {success && (
        <div className="alert-container">
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible className="alert-message">
            <i className="fas fa-check-circle me-2"></i>
            {success}
          </Alert>
        </div>
      )}
      
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <div className="dashboard-title-row">
            <h1 className="dashboard-title">Tech Stack Management</h1>
            
            <div className="dashboard-controls">
              <div className="search-wrapper">
                <i className="fas fa-search search-icon"></i>
                <input
                  type="text"
                  placeholder="Search tech stacks, topics, projects..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="global-search-input"
                />
                <Dropdown className="search-filter-dropdown">
                  <Dropdown.Toggle variant="light" size="sm" id="search-filter-dropdown">
                    <i className="fas fa-filter me-1"></i>
                    {searchCategory === 'all' ? 'All' : 
                     searchCategory === 'techstack' ? 'Tech Stack' :
                     searchCategory === 'topic' ? 'Topic' :
                     searchCategory === 'subtopic' ? 'Subtopic' : 'Project'}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item 
                      active={searchCategory === 'all'} 
                      onClick={() => handleSearchCategoryChange('all')}
                    >
                      All
                    </Dropdown.Item>
                    <Dropdown.Item 
                      active={searchCategory === 'techstack'} 
                      onClick={() => handleSearchCategoryChange('techstack')}
                    >
                      Tech Stack
                    </Dropdown.Item>
                    <Dropdown.Item 
                      active={searchCategory === 'topic'} 
                      onClick={() => handleSearchCategoryChange('topic')}
                    >
                      Topic
                    </Dropdown.Item>
                    <Dropdown.Item 
                      active={searchCategory === 'subtopic'} 
                      onClick={() => handleSearchCategoryChange('subtopic')}
                    >
                      Subtopic
                    </Dropdown.Item>
                    <Dropdown.Item 
                      active={searchCategory === 'project'} 
                      onClick={() => handleSearchCategoryChange('project')}
                    >
                      Project
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                {searchTerm && (
                  <button 
                    className="search-clear-btn" 
                    onClick={() => setSearchTerm('')}
                    aria-label="Clear search"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
              
              {/* Delete All Techstacks button removed as requested */}
            </div>
          </div>
          
          {/* Stats row with clickable stats */}
          <div className="dashboard-stats-row">
            <div className="dashboard-stat" onClick={showAllTechStacksDetails}>
              <div className="stat-badge techstack">
                <i className="fas fa-layer-group"></i>
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.totalTechStacks}</span>
                <span className="stat-label">All Techstacks</span>
              </div>
            </div>
            
            <div className="dashboard-stat" onClick={showTotalTopicsDetails}>
              <div className="stat-badge total">
                <i className="fas fa-list"></i>
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">Total Topics</span>
              </div>
            </div>
            
            <div className="dashboard-stat" onClick={showCompletedTopicsDetails}>
              <div className="stat-badge completed">
                <i className="fas fa-check"></i>
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.completed}</span>
                <span className="stat-label">Completed</span>
              </div>
            </div>
            
            <div className="dashboard-stat" onClick={showInProgressTopicsDetails}>
              <div className="stat-badge in-progress">
                <i className="fas fa-spinner"></i>
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.inProgress}</span>
                <span className="stat-label">In Progress</span>
              </div>
            </div>
            
            <div className="dashboard-stat" onClick={showYetToStartTopicsDetails}>
              <div className="stat-badge not-started">
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.notStarted}</span>
                <span className="stat-label">Yet to Start</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Details Modal */}
      <Modal
        show={showStatsModal}
        onHide={() => setShowStatsModal(false)}
        size="lg"
        centered
        dialogClassName="stats-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {renderModalContent()}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      
      {!loading && (
        <div className="all-roadmaps">
          <div className="section-header">
            <h3 className="section-title">All Tech Stacks</h3>
            <div className="total-roadmaps">
              {searchTerm ? (
                <>
                  Showing {filteredTechStacks.length} of {allTechStacksData.length} tech stacks
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                    className="clear-search-btn ms-2"
                  >
                    Clear Search
                  </Button>
                </>
              ) : (
                `Total: ${allTechStacksData.length} tech stacks`
              )}
            </div>
          </div>

          {filteredTechStacks.length > 0 ? (
            filteredTechStacks.map((techStack) => (
              <div key={techStack._id} className="mb-4">
                <TechStackTable 
                  techStackData={techStack} 
                  onUpdate={handleTechStackUpdated} 
                  onDelete={handleTechStackDeleted}
                />
              </div>
            ))
          ) : (
            <div className="no-results">
              <i className="fas fa-search no-results-icon"></i>
              <h4>No Tech Stacks Found</h4>
              <p>
                {searchTerm 
                  ? "Try adjusting your search criteria or clear the search."
                  : "You haven't created any tech stacks yet. Create a new tech stack to get started."}
              </p>
            </div>
          )}
        </div>
      )}

      {loading && renderLoadingSpinner()}
    </div>
  );
};

export default Dashboard;
