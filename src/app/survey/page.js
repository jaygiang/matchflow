'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Survey() {
  const [surveyData, setSurveyData] = useState({
    profession: '',
    location: '',
    answer1: '',
    answer2: '',
    answer3: '',
  });
  const router = useRouter();

  const handleChange = (e) => {
    setSurveyData({ ...surveyData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const signupData = JSON.parse(localStorage.getItem('signupData') || '{}');
    
    // Combine signup and survey data
    const userData = {
      ...signupData,
      ...surveyData
    };
console.log('userData', userData);
    try {
      const response = await fetch('/api/createUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }
      
      const result = await response.json();
      localStorage.setItem('userId', result.userId);
      console.log('result', result);

      // Clear signup data from localStorage
      localStorage.removeItem('signupData');
      
      // Redirect to the match page after submission
      router.push('/match');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error creating user. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Survey</h1>
      <input
        name="profession"
        placeholder="What is your profession?"
        onChange={handleChange}
        required
      />
      <input
        name="location"
        placeholder="Location (City or Address)"
        onChange={handleChange}
        required
      />
      <textarea
        name="answer1"
        placeholder="How would close friends describe you?"
        onChange={handleChange}
        required
      />
      <textarea
        name="answer2"
        placeholder="What are some random things you geek out on (unrelated to your job)?"
        onChange={handleChange}
        required
      />
      <textarea
        name="answer3"
        placeholder="Describe your pet peeves or things that bug you."
        onChange={handleChange}
        required
      />
      <button type="submit">Submit</button>
    </form>
  );
}
