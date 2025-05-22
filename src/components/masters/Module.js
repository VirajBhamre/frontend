// src/components/Module.js
import React, { useState } from "react";
import { saveOrUpdateEmployer } from "../../services/employerService";
import { toast } from "react-toastify";

const Module = () => {
  const [formData, setFormData] = useState({
    Name: "",
    MobileNo: "",
    EmailId: "",
    AadharNo: "",
    CompanyName: "",
    Password: "",
    Ticket: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const { Name, MobileNo, EmailId, AadharNo, Password, Ticket } = formData;
    if (!Name || !MobileNo || !EmailId || !AadharNo || !Password || !Ticket) {
      toast.error("Please fill in all required fields.");
      return setIsLoading(false);
    }
    if (!/^\d{10}$/.test(MobileNo)) {
      toast.error("Enter a valid 10‑digit mobile number.");
      return setIsLoading(false);
    }
    if (!/^\d{12}$/.test(AadharNo)) {
      toast.error("Enter a valid 12‑digit Aadhaar number.");
      return setIsLoading(false);
    }
    if (Password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return setIsLoading(false);
    }

    try {
      await saveOrUpdateEmployer(formData);
      setFormData({
        Name: "",
        MobileNo: "",
        EmailId: "",
        AadharNo: "",
        CompanyName: "",
        Password: "",
        Ticket: "",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fields = [
    { name: "Name", label: "Employer / Company Name", type: "text", required: true },
    { name: "MobileNo", label: "Mobile Number", type: "tel", required: true, pattern: "[0-9]{10}", title: "10 digits" },
    { name: "EmailId", label: "Email Address", type: "email", required: true },
    { name: "AadharNo", label: "Aadhaar Number", type: "text", required: true, pattern: "[0-9]{12}", title: "12 digits" },
    { name: "CompanyName", label: "Registered Company Name", type: "text" },
    { name: "Password", label: "Password", type: "password", required: true, minLength: 6 },
    { name: "Ticket", label: "Ticket ID", type: "text", required: true },
  ];

  return (
    <div className="m-2 bg-white p-8 rounded-lg shadow-md">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-1">Employer Management</h1>
        <p className="text-sm text-center text-gray-600 mb-8">Add or update employer details below.</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fields.map(({ name, label, type, required, ...rest }) => (
            <div key={name} className="relative">
              <input
                id={name}
                name={name}
                type={type}
                value={formData[name]}
                onChange={handleChange}
                required={required}
                {...rest}
                className="
                  peer w-full px-5 py-2 rounded-tl-xl rounded-tr-xl rounded-br-xl
                  bg-white text-gray-800 border border-gray-300 shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-[#ff4473]
                  placeholder-transparent
                "
                placeholder={label}
              />
              <label
                htmlFor={name}
                className={`
                  absolute left-5 px-1 bg-white rounded text-sm transition-all cursor-text
                  ${formData[name] ? "-top-2.5 text-xs text-[#ff4473]" : "top-3 text-gray-400"}
                  peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#ff4473]
                `}
              >
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
            </div>
          ))}

          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full px-6 py-2 rounded-tl-xl rounded-tr-xl rounded-br-xl
                text-white font-semibold transition
                ${isLoading ? "bg-pink-400 cursor-not-allowed" : "bg-[#ff4473] hover:bg-[#e03b65]"}
              `}
            >
              {isLoading ? "Saving…" : "Save Employer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Module;
