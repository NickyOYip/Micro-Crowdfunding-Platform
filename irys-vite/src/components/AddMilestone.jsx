import { useState } from 'react';
import "./addMilestone.css" ;

export const AddMilestone = ({ index, formData, onSubmit,onClose,setFormData}) => {

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    formData.id = index;


    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-xl p-8 w-full max-w-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-red-500 text-white rounded-full h-8 w-8 flex items-center justify-center hover:bg-red-600"
                >
                    ×
                </button>


                <form onSubmit={handleSubmit}>


                    <div className="form-group">
                        <label>Proposal Info*</label>
                        <textarea
                            name="proposalInfo"
                            value={formData.proposalInfo}
                            onChange={handleChange}
                            rows={3}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={5}
                        />
                    </div>

                    <div className="form-group">
                        <label>Deadline*</label>
                        <input
                            type="date"
                            name="deadline"
                            value={formData.deadline}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit">Submit</button>
                    </div>
                </form>
            </div>


        </div>
    )

}
export default AddMilestone;