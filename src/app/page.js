'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Signup() {
  const [formData, setFormData] = useState({ name: '', email: '', age: '', profession: '' });
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Store form data in localStorage for the survey page
    localStorage.setItem('signupData', JSON.stringify(formData));
    router.push('/survey');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" onChange={handleChange} required />
      <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
      <input name="age" type="number" placeholder="Age" onChange={handleChange} required />
      <input name="profession" placeholder="Profession" onChange={handleChange} required />
      <button type="submit">Sign Up</button>
    </form>
  );
}
