//app/sign-in/_components/InputFields.tsx
import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, ...props }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
      </label>
      <input
        {...props}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
      />
    </div>
  );
};

export default InputField;
