import React, { useState, useEffect } from 'react';
import { Card, Button, List, Spin, InputNumber, message } from 'antd';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../styles/ProjectList.css'; // Import the CSS file

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(0);
  const [fundingLoading, setFundingLoading] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFundProject = async (projectId) => {
    if (funding <= 0) {
      message.error('Please enter a valid funding amount!');
      return;
    }

    setFundingLoading(true);

    try {
      const response = await axios.post(`http://localhost:3000/projects/${projectId}/fund`, { amount: funding });
      message.success(response.data.message);
      fetchProjects(); // Refresh the project list
    } catch (error) {
      message.error(error.response?.data.message || 'An error occurred!');
    } finally {
      setFundingLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="project-list">
      <h3>Project List</h3>

      {loading ? (
        <div className="spin-container">
          <Spin size="large" />
        </div>
      ) : (
        <List
          grid={{ gutter: 16, column: 3 }}
          dataSource={projects}
          renderItem={(project) => (
            <List.Item key={project.id}>
              <Card title={project.name}>
                <p><strong>Description:</strong> {project.description}</p>
                <p><strong>Project Deadline:</strong> {project.endDate}</p>
                <p><strong>Goal Amount:</strong> {project.goalAmount} XLM</p>
                <p><strong>Current Amount:</strong> {project.fundsRaised} XLM</p>

                {/* Funding Section */}
                <InputNumber
                  min={1}
                  max={1000000}
                  step={100}
                  value={funding}
                  onChange={(value) => setFunding(value)}
                  placeholder="Funding Amount"
                  className="funding-input"
                />
                <Button
                  type="primary"
                  block
                  onClick={() => handleFundProject(project.id)}
                  loading={fundingLoading}
                >
                  {fundingLoading ? 'Funding in progress...' : 'Fund'}
                </Button>
              </Card>
            </List.Item>
          )}
        />
      )}
      <Link to="/create" className="create-button">
        <Button type="primary">Create New Project</Button>
      </Link>
    </div>
  );
};

export default ProjectList;
