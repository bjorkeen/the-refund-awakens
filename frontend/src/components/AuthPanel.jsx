import { useState } from 'react';
import { register, login, logout, checkAccess, testApi } from '../services/authService';
import { useAccess } from '../context/AccessContext';
import AuthForm from './AuthForm';
import MessageBox from './MessageBox';

const AuthPanel = () => {
  const { hasAccess, refreshAccess } = useAccess();
  const [form, setForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleAction = async (actionType) => {
    try {
      let res;
      switch (actionType) {
        case 'register':
          res = await register(form);
          break;
        case 'login':
          res = await login(form);
          await refreshAccess();
          break;
        case 'logout':
          res = await logout();
          await refreshAccess();
          break;
        case 'check':
          res = await checkAccess();
          break;
        case 'test':
          res = await testApi();
          break;
        default:
          throw new Error('Unknown action');
      }

      setMessage(res?.data?.message || 'Success');
    } catch (err) {
      const errMsg = err?.response?.data?.error || 'Action failed';
      setMessage(errMsg);
    }
  };

  return (
    <div className="w-full max-w-md">
      <AuthForm form={form} onChange={handleChange} />

      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        <ActionButton onClick={() => handleAction('test')} label="Test API" className="btn-blue" />
        <ActionButton onClick={() => handleAction('register')} label="Register" className="btn-blue" />
        <ActionButton onClick={() => handleAction('login')} label="Login" className="btn-green" />
        <ActionButton onClick={() => handleAction('logout')} label="Logout" className="btn-yellow" />
        <ActionButton onClick={() => handleAction('check')} label="Check Access" className="btn-purple" />
      </div>

      <MessageBox message={message} />
      {hasAccess && <h4 className="mt-4 text-green-700 text-center">Privileged Content!</h4>}
    </div>
  );
};

const ActionButton = ({ onClick, label, className }) => (
  <button onClick={onClick} className={`button ${className}`}>
    {label}
  </button>
);

export default AuthPanel;
