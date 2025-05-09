import React, { useState } from 'react';
import { Form, Button, Card, Spinner, Tabs, Tab, Table, Alert, Row, Col } from 'react-bootstrap';
import { createTechStack } from '../../services/techStackService';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import './AddTechStackForm.css';

const AddTechStackForm = ({ onTechStackAdded }) => {
  // Add navigation hook
  const navigate = useNavigate();

  // State for regular form input
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    roadmapItems: [
      {
        topic: '',
        subTopics: [{ name: '' }],
        projects: [{ name: '' }],
        completionStatus: 'Yet to Start'
      }
    ]
  });

  // Add state for custom headers
  const [headers, setHeaders] = useState({
    topic: "Topic",
    subTopics: "Sub-Topics",
    projects: "Projects",
    status: "Status"
  });

  // State for CSV upload
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [csvTechStackName, setCsvTechStackName] = useState('');
  const [csvDescription, setCsvDescription] = useState('');
  const [parsedCsvData, setParsedCsvData] = useState(null);
  const [activeTab, setActiveTab] = useState('manual');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Handle header change
  const handleHeaderChange = (field, value) => {
    setHeaders({
      ...headers,
      [field]: value
    });
  };

  // Handle input change for form fields
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle input change for roadmap items
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.roadmapItems];
    updatedItems[index][field] = value;
    setFormData({
      ...formData,
      roadmapItems: updatedItems
    });
  };

  // Handle input change for subtopics
  const handleSubtopicChange = (itemIndex, subtopicIndex, value) => {
    const updatedItems = [...formData.roadmapItems];
    updatedItems[itemIndex].subTopics[subtopicIndex].name = value;
    setFormData({
      ...formData,
      roadmapItems: updatedItems
    });
  };

  // Handle input change for projects
  const handleProjectChange = (itemIndex, projectIndex, value) => {
    const updatedItems = [...formData.roadmapItems];
    updatedItems[itemIndex].projects[projectIndex].name = value;
    setFormData({
      ...formData,
      roadmapItems: updatedItems
    });
  };

  // Add a new roadmap item
  const addRoadmapItem = () => {
    setFormData({
      ...formData,
      roadmapItems: [
        ...formData.roadmapItems,
        {
          topic: '',
          subTopics: [{ name: '' }],
          projects: [{ name: '' }],
          completionStatus: 'Yet to Start'
        }
      ]
    });
  };

  // Remove a roadmap item
  const removeRoadmapItem = (index) => {
    const updatedItems = [...formData.roadmapItems];
    updatedItems.splice(index, 1);
    setFormData({
      ...formData,
      roadmapItems: updatedItems
    });
  };

  // Add subtopic field to a roadmap item
  const addSubtopic = (itemIndex) => {
    const updatedItems = [...formData.roadmapItems];
    updatedItems[itemIndex].subTopics.push({ name: '' });
    setFormData({
      ...formData,
      roadmapItems: updatedItems
    });
  };

  // Add project field to a roadmap item
  const addProject = (itemIndex) => {
    const updatedItems = [...formData.roadmapItems];
    updatedItems[itemIndex].projects.push({ name: '' });
    setFormData({
      ...formData,
      roadmapItems: updatedItems
    });
  };

  // Remove subtopic field from a roadmap item
  const removeSubtopic = (itemIndex, subtopicIndex) => {
    const updatedItems = [...formData.roadmapItems];
    updatedItems[itemIndex].subTopics.splice(subtopicIndex, 1);
    setFormData({
      ...formData,
      roadmapItems: updatedItems
    });
  };

  // Remove project field from a roadmap item
  const removeProject = (itemIndex, projectIndex) => {
    const updatedItems = [...formData.roadmapItems];
    updatedItems[itemIndex].projects.splice(projectIndex, 1);
    setFormData({
      ...formData,
      roadmapItems: updatedItems
    });
  };

  // Handle form submission (manual entry)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name) {
      setError('Tech stack name is required');
      return;
    }
    
    try {
      setLoading(true);
      
      // Add headers to the form data
      const dataWithHeaders = {
        ...formData,
        headers
      };
      
      const response = await createTechStack(dataWithHeaders);
      setLoading(false);
      setSuccess('Tech stack created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        roadmapItems: [
          {
            topic: '',
            subTopics: [{ name: '' }],
            projects: [{ name: '' }],
            completionStatus: 'Yet to Start'
          }
        ]
      });
      
      // Call the callback to notify parent component
      if (onTechStackAdded) {
        onTechStackAdded(response.data);
      }
      
      // Show success message briefly before redirecting
      setTimeout(() => {
        // Navigate to homepage after successful creation
        navigate('/');
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create tech stack');
      setLoading(false);
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleCsvFileProcess(e.dataTransfer.files[0]);
    }
  };

  // Handle CSV file upload
  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleCsvFileProcess(file);
    }
  };

  // Process the CSV file
  const handleCsvFileProcess = (file) => {
    setCsvFile(file);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target.result;
      // Parse CSV
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setCsvData(results.data);
          processCSVData(results.data);
        },
        error: (error) => {
          setError(`Error parsing CSV: ${error.message}`);
        }
      });
    };
    reader.readAsText(file);
  };

  // Process CSV data into the format needed for the API
  const processCSVData = (data) => {
    try {
      // Map common column names to our expected names
      const columnMappings = {
        topic: ['Topic', 'Topics', 'Technology'],
        subtopic: ['Sub-Topic', 'Sub-topics', 'Subtopic', 'Subtopics'],
        project: ['Projects/Apps built', 'Project/App to Build', 'Projects', 'Project', 'Apps'],
        status: ['Status of Completion', 'Status', 'Completion Status']
      };
      
      // Get headers from the data
      if (data.length === 0 || !data[0]) {
        throw new Error('CSV contains no data or is in an invalid format');
      }
      
      const rawHeaders = Object.keys(data[0]);
      
      // Map raw headers to our expected names
      const headerMapping = {};
      // Store the detected custom headers
      const detectedHeaders = {
        topic: "Topic",
        subTopics: "Sub-Topics",
        projects: "Projects",
        status: "Status"
      };
      
      for (const [key, alternatives] of Object.entries(columnMappings)) {
        const matchedHeader = rawHeaders.find(h => 
          alternatives.some(alt => 
            h.toLowerCase().includes(alt.toLowerCase())
          )
        );
        
        if (matchedHeader) {
          headerMapping[key] = matchedHeader;
          
          // Store the original header names for display
          if (key === 'topic') detectedHeaders.topic = matchedHeader;
          else if (key === 'subtopic') detectedHeaders.subTopics = matchedHeader;
          else if (key === 'project') detectedHeaders.projects = matchedHeader;
          else if (key === 'status') detectedHeaders.status = matchedHeader;
        }
      }
      
      // Update the headers state with detected headers
      setHeaders(detectedHeaders);
      
      // Check if we have the required topic column
      if (!headerMapping.topic) {
        throw new Error('CSV must have a column for Topics');
      }
      
      // Initialize storage for aggregated data
      const itemsMap = new Map();
      
      // Process each row
      data.forEach(row => {
        // Get values using our header mapping
        const topic = row[headerMapping.topic] || '';
        const subtopicsText = row[headerMapping.subtopic] || '';
        const project = row[headerMapping.project] || '';
        let status = row[headerMapping.status] || 'Yet to Start';
        
        // Skip rows without a topic
        if (!topic) return;
        
        // Process subtopics - split by newlines if present
        const subtopics = subtopicsText
          .split(/\n|\r\n/)
          .map(s => s.trim())
          .filter(s => s !== '')
          // Handle quotes that might be included from CSV parsing
          .map(s => s.replace(/^["']|["']$/g, ''));
        
        // Normalize status
        status = normalizeStatus(status);
        
        // Add or update topic in the map
        if (!itemsMap.has(topic)) {
          itemsMap.set(topic, {
            topic,
            subTopics: subtopics.map(name => ({ name })),
            projects: project ? [{ name: project }] : [],
            completionStatus: status
          });
        } else {
          // For duplicate topics, merge the data
          const existingItem = itemsMap.get(topic);
          
          // Merge subtopics
          subtopics.forEach(subtopic => {
            if (!existingItem.subTopics.some(s => s.name === subtopic)) {
              existingItem.subTopics.push({ name: subtopic });
            }
          });
          
          // Add project if it doesn't exist and is not empty
          if (project && !existingItem.projects.some(p => p.name === project)) {
            existingItem.projects.push({ name: project });
          }
          
          // Update status if needed (prioritize 'Completed' > 'In Progress' > 'Yet to Start')
          if (status === 'Completed' || 
              (status === 'In Progress' && existingItem.completionStatus !== 'Completed')) {
            existingItem.completionStatus = status;
          }
        }
      });
      
      // Convert map to array
      const roadmapItems = Array.from(itemsMap.values());
      
      // Store the processed data
      setParsedCsvData({
        roadmapItems
      });
      
      // Try to extract tech stack name from filename
      if (!csvTechStackName && csvFile) {
        const fileName = csvFile.name.replace(/\.[^/.]+$/, ""); // Remove extension
        const suggestedName = fileName
          .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
          .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize each word
        
        setCsvTechStackName(suggestedName);
      }
      
    } catch (err) {
      setError(`Error processing CSV data: ${err.message}`);
    }
  };

  // Helper function to normalize status values
  const normalizeStatus = (status) => {
    if (!status) return 'Yet to Start';
    
    const statusStr = status.toString().toLowerCase();
    if (statusStr.includes('complete') || statusStr.includes('done') || statusStr.includes('finish')) {
      return 'Completed';
    } else if (statusStr.includes('progress') || statusStr.includes('ongoing') || statusStr.includes('partial')) {
      return 'In Progress';
    } else {
      return 'Yet to Start';
    }
  };

  // Handle CSV form submission
  const handleCsvSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!csvTechStackName) {
      setError('Tech stack name is required');
      return;
    }
    
    if (!parsedCsvData || parsedCsvData.roadmapItems.length === 0) {
      setError('No CSV data found or CSV data is invalid');
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare data for API including headers
      const techStackData = {
        name: csvTechStackName,
        description: csvDescription,
        headers: headers, // Include the custom headers
        roadmapItems: parsedCsvData.roadmapItems
      };
      
      const response = await createTechStack(techStackData);
      
      // Reset form
      setCsvFile(null);
      setCsvData([]);
      setCsvTechStackName('');
      setCsvDescription('');
      setParsedCsvData(null);
      
      setLoading(false);
      setSuccess('Tech stack created successfully from CSV!');
      
      // Call the callback to notify parent component
      if (onTechStackAdded) {
        onTechStackAdded(response.data);
      }
      
      // Show success message briefly before redirecting
      setTimeout(() => {
        // Navigate to homepage after successful creation
        navigate('/');
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create tech stack from CSV');
      setLoading(false);
    }
  };

  // Function to download sample CSV
  const downloadSampleCsv = () => {
    // Create sample CSV content with line breaks in cells
    const sampleCSV = `Topic,Sub-Topic,Projects/Apps built,Status of Completion
JavaScript Syntax & Essentials,"Spread Operator (Arrays, Objects, Function Calls)
Rest Parameters
Destructuring
Default Parameters
Template Literals
Ternary & Switch",Build a Profile Formatter: Use spread rest destructuring and template literals to render user info,Completed
Functions & Object Creators,"Arrow Functions
Returning Objects
Constructor vs Factory Functions
'new' Keyword
Object Properties
Built-in Constructors (Date)","Create a Task Manager App using constructor/factory functions and Date object timestamps",Completed
Data Structures & Algorithms,"Arrays & Methods
Objects & Property Access
Maps & Sets
Linked Lists
Trees & Graphs",Build a custom data structure implementation,Yet to Start`;
    
    // Create and download the sample CSV file
    const element = document.createElement('a');
    const file = new Blob([sampleCSV], {type: 'text/csv'});
    element.href = URL.createObjectURL(file);
    element.download = 'sample_techstack.csv';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Preview the parsed data in a table format
  const renderParsedDataPreview = () => {
    if (!parsedCsvData || !parsedCsvData.roadmapItems || parsedCsvData.roadmapItems.length === 0) {
      return null;
    }
    
    return (
      <div className="parsed-data-preview">
        <h5 className="mb-3">Processed Roadmap Items</h5>
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>{headers.topic}</th>
                <th>{headers.subTopics}</th>
                <th>{headers.projects}</th>
                <th>{headers.status}</th>
              </tr>
            </thead>
            <tbody>
              {parsedCsvData.roadmapItems.map((item, index) => (
                <tr key={index}>
                  <td>{item.topic}</td>
                  <td>
                    <ul>
                      {item.subTopics.map((subtopic, i) => (
                        <li key={i}>{subtopic.name}</li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    <ul>
                      {item.projects.map((project, i) => (
                        <li key={i}>{project.name}</li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    <span className={`badge ${
                      item.completionStatus === 'Completed' ? 'bg-success' : 
                      item.completionStatus === 'In Progress' ? 'bg-warning' : 
                      'bg-secondary'
                    }`}>
                      {item.completionStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <Card.Header>
        <h3>Create New Tech Stack Roadmap</h3>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>}
        
        {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
          {success}
        </Alert>}
        
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-3"
        >
          <Tab eventKey="manual" title="Manual Entry">
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tech Stack Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={1}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              {/* Add Custom Headers Section */}
              <div className="mb-3">
                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Topic Header</Form.Label>
                      <Form.Control
                        type="text"
                        value={headers.topic}
                        onChange={(e) => handleHeaderChange('topic', e.target.value)}
                        placeholder="e.g., Technology"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Subtopics Header</Form.Label>
                      <Form.Control
                        type="text"
                        value={headers.subTopics}
                        onChange={(e) => handleHeaderChange('subTopics', e.target.value)}
                        placeholder="e.g., Concepts"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Projects Header</Form.Label>
                      <Form.Control
                        type="text"
                        value={headers.projects}
                        onChange={(e) => handleHeaderChange('projects', e.target.value)}
                        placeholder="e.g., Assignments"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Status Header</Form.Label>
                      <Form.Control
                        type="text"
                        value={headers.status}
                        onChange={(e) => handleHeaderChange('status', e.target.value)}
                        placeholder="e.g., Progress"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
              
              <div className="roadmap-items-section">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4>Roadmap Items</h4>
                  <Button
                    variant="primary"
                    onClick={addRoadmapItem}
                    size="sm"
                  >
                    Add Another Item
                  </Button>
                </div>
                
                {formData.roadmapItems.map((item, itemIndex) => (
                  <div key={itemIndex} className="mb-4 p-3" style={{backgroundColor: '#f8f9fa', borderRadius: '4px'}}>
                    <div className="d-flex justify-content-between align-items-center">
                      <h5>Item #{itemIndex + 1}</h5>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => removeRoadmapItem(itemIndex)}
                        disabled={formData.roadmapItems.length <= 1}
                      >
                        Remove
                      </Button>
                    </div>
                    
                    <Row className="mt-3">
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>{headers.topic} <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            value={item.topic}
                            onChange={(e) => handleItemChange(itemIndex, 'topic', e.target.value)}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>{headers.subTopics}</Form.Label>
                          <div>
                            {item.subTopics.map((subtopic, subtopicIndex) => (
                              <div key={subtopicIndex} className="d-flex mb-2">
                                <Form.Control
                                  type="text"
                                  value={subtopic.name}
                                  onChange={(e) => handleSubtopicChange(itemIndex, subtopicIndex, e.target.value)}
                                />
                                <Button
                                  variant="danger"
                                  size="sm"
                                  className="ms-2"
                                  onClick={() => removeSubtopic(itemIndex, subtopicIndex)}
                                  disabled={item.subTopics.length <= 1}
                                >
                                  X
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => addSubtopic(itemIndex)}
                            >
                              Add Another {headers.subTopics.replace(/s$/, '')}
                            </Button>
                          </div>
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>{headers.projects}</Form.Label>
                          <div>
                            {item.projects.map((project, projectIndex) => (
                              <div key={projectIndex} className="d-flex mb-2">
                                <Form.Control
                                  type="text"
                                  value={project.name}
                                  onChange={(e) => handleProjectChange(itemIndex, projectIndex, e.target.value)}
                                />
                                <Button
                                  variant="danger"
                                  size="sm"
                                  className="ms-2"
                                  onClick={() => removeProject(itemIndex, projectIndex)}
                                  disabled={item.projects.length <= 1}
                                >
                                  X
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => addProject(itemIndex)}
                            >
                              Add Another {headers.projects.replace(/s$/, '')}
                            </Button>
                          </div>
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>{headers.status}</Form.Label>
                          <Form.Select
                            value={item.completionStatus}
                            onChange={(e) => handleItemChange(itemIndex, 'completionStatus', e.target.value)}
                          >
                            <option value="Yet to Start">Yet to Start</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                ))}
              </div>
              
              <div className="d-flex justify-content-end mt-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      <span className="ms-2">Creating...</span>
                    </>
                  ) : (
                    "Upload to DB"
                  )}
                </Button>
              </div>
            </Form>
          </Tab>
          
          <Tab eventKey="csv" title="CSV Upload">
            <div className="csv-upload-container">              
              <Form onSubmit={handleCsvSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tech Stack Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        value={csvTechStackName}
                        onChange={(e) => setCsvTechStackName(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        value={csvDescription}
                        onChange={(e) => setCsvDescription(e.target.value)}
                        rows={1}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                {/* Display and allow editing of detected headers */}
                {csvData.length > 0 && (
                  <div className="mb-3">
                    <h5>CSV Headers</h5>
                    <Row>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Topic Header</Form.Label>
                          <Form.Control
                            type="text"
                            value={headers.topic}
                            onChange={(e) => handleHeaderChange('topic', e.target.value)}
                            placeholder="e.g., Technology"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Subtopics Header</Form.Label>
                          <Form.Control
                            type="text"
                            value={headers.subTopics}
                            onChange={(e) => handleHeaderChange('subTopics', e.target.value)}
                            placeholder="e.g., Concepts"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Projects Header</Form.Label>
                          <Form.Control
                            type="text"
                            value={headers.projects}
                            onChange={(e) => handleHeaderChange('projects', e.target.value)}
                            placeholder="e.g., Assignments"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Status Header</Form.Label>
                          <Form.Control
                            type="text"
                            value={headers.status}
                            onChange={(e) => handleHeaderChange('status', e.target.value)}
                            placeholder="e.g., Progress"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}
                
                <Form.Group className="mb-3">
                  <Form.Label>Upload CSV File</Form.Label>
                  <div 
                    className={`p-3 border ${dragActive ? 'border-primary' : 'border-secondary'}`}
                    style={{borderStyle: 'dashed', borderRadius: '4px'}}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="text-center">
                      <div className="mb-3">
                        <i className="fas fa-file-csv fa-2x"></i>
                      </div>
                      <p className="mb-3">
                        Drag & drop your CSV file here or 
                        <Button 
                          variant="link" 
                          onClick={() => document.getElementById('csvFileInput').click()}
                        >
                          browse
                        </Button>
                      </p>
                      <input
                        id="csvFileInput"
                        type="file"
                        accept=".csv"
                        onChange={handleCsvFileChange}
                        className="d-none"
                      />
                      {csvFile && (
                        <div>
                          <i className="fas fa-file me-2"></i>
                          {csvFile.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-muted mt-2 small">
                    <i className="fas fa-info-circle me-1"></i>
                    Make sure your CSV has proper column headers and each row represents a topic or subtopic
                  </div>
                </Form.Group>
                
                {csvData.length > 0 && (
                  <div className="mb-3">
                    <h5>CSV Preview (Original Data)</h5>
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            {Object.keys(csvData[0]).map((header, index) => (
                              <th key={index}>{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.slice(0, 5).map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {Object.entries(row).map(([key, value], cellIndex) => (
                                <td key={cellIndex}>
                                  {String(value || '').split('\n').map((line, i) => (
                                    <span key={i}>
                                      {line}
                                      {i < String(value || '').split('\n').length - 1 && <br />}
                                    </span>
                                  ))}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                      {csvData.length > 5 && (
                        <p className="text-muted">Showing 5 of {csvData.length} rows</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Render the processed data preview */}
                {parsedCsvData && renderParsedDataPreview()}
                
                <div className="d-flex justify-content-end mt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading || !parsedCsvData || !csvTechStackName}
                  >
                    {loading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        <span className="ms-2">Creating...</span>
                      </>
                    ) : (
                      "Upload to DB"
                    )}
                  </Button>
                </div>
              </Form>
            </div>
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
};

export default AddTechStackForm;
