import React, { useState } from 'react';
import { Form, Input, Button, DatePicker, InputNumber, message } from 'antd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/CreateProject.css'; // Import the CSS file

const CreateProject = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    const { title, description, goalAmount, endDate } = values;
    
    const projectData = {
      title,
      description,
      goalAmount,
      endDate: endDate.format('YYYY-MM-DD'), // End date formatting
    };

    setLoading(true);

    try {
      // Post the project data to your backend
      const response = await axios.post('http://localhost:3000/projects', projectData);

      if (response.status === 201) {
        message.success('Project created successfully!');
        navigate('/'); // Navigate back to the project list page
      } else {
        message.error('There was an error creating the project.');
      }
    } catch (error) {
      message.error('An error occurred, please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-project">
      <h2>Create New Project</h2>
      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
        initialValues={{
          goalAmount: 0,
        }}
      >
        <Form.Item
          label="Project Title"
          name="title"
          rules={[{ required: true, message: 'Title is required' }]}
        >
          <Input placeholder="Enter the project title" />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true, message: 'Description is required' }]}
        >
          <Input.TextArea rows={4} placeholder="Enter the project description" />
        </Form.Item>

        <Form.Item
          label="Goal Amount"
          name="goalAmount"
          rules={[{ required: true, message: 'Goal amount is required' }]}
        >
          <InputNumber
            min={0}
            placeholder="Enter the goal amount"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label="End Date"
          name="endDate"
          rules={[{ required: true, message: 'End date is required' }]}
        >
          <DatePicker
            format="YYYY-MM-DD"
            style={{ width: '100%' }}
            placeholder="Select the end date"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
            Create Project
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default CreateProject;
