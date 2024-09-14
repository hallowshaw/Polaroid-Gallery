import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTrashAlt, FaUpload, FaCalendarAlt } from "react-icons/fa";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

const App = () => {
  const [polaroids, setPolaroids] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    fetchPolaroids();
  }, []);

  const fetchPolaroids = async () => {
    const { data } = await axios.get("http://localhost:5000/api/polaroids");
    setPolaroids(data);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("image", file);
    formData.append("caption", caption);
    formData.append("date", date);

    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/polaroids",
        formData
      );
      setPolaroids([...polaroids, data]);
      toast.success("Polaroid added successfully!");
    } catch (error) {
      toast.error("Failed to add polaroid. Please try again.");
    } finally {
      setFile(null);
      setCaption("");
      setDate("");
      setShowPopup(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/polaroids/${id}`);
      setPolaroids(polaroids.filter((p) => p._id !== id));
      toast.success("Polaroid deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete polaroid. Please try again.");
    }
  };

  const handleSaveEdit = async (id, updatedCaption, updatedDate) => {
    const { data } = await axios.put(
      `http://localhost:5000/api/polaroids/${id}`,
      {
        caption: updatedCaption,
        date: updatedDate,
      }
    );
    setPolaroids(polaroids.map((p) => (p._id === id ? data : p)));
  };

  // Function to move polaroid within the list
  const movePolaroid = (dragIndex, hoverIndex) => {
    const updatedPolaroids = [...polaroids];
    const [draggedPolaroid] = updatedPolaroids.splice(dragIndex, 1);
    updatedPolaroids.splice(hoverIndex, 0, draggedPolaroid);
    setPolaroids(updatedPolaroids);
  };

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
    if (uploadedFile) {
      const label = document.querySelector(".file-upload-label");
      label.innerHTML = "Uploaded ";
      label.classList.add("file-upload-success");
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="page-container">
        <button className="add-polaroid-btn" onClick={() => setShowPopup(true)}>
          Add Polaroid
        </button>

        <div className="polaroid-container">
          {polaroids.map((polaroid, index) => (
            <Polaroid
              key={polaroid._id}
              polaroid={polaroid}
              index={index}
              movePolaroid={movePolaroid}
              handleDelete={handleDelete}
              handleSaveEdit={handleSaveEdit}
            />
          ))}
        </div>

        {showPopup && (
          <div className="popup">
            <div className="popup-content">
              <span className="close-btn" onClick={() => setShowPopup(false)}>
                &times;
              </span>
              <h2>Upload Polaroid</h2>
              <form onSubmit={handleUpload}>
                <div className="input-group">
                  <label htmlFor="file-upload" className="file-upload-label">
                    <FaUpload className="icon" /> Upload Image
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange} /* Change handler */
                    required
                    className="file-upload-input"
                  />
                </div>

                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Caption"
                  required
                />

                <div className="input-group">
                  <FaCalendarAlt className="icon" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="date-input"
                  />
                </div>

                <button type="submit">Add Polaroid</button>
              </form>
            </div>
          </div>
        )}
        <ToastContainer />
      </div>
    </DndProvider>
  );
};

const Polaroid = ({
  polaroid,
  index,
  movePolaroid,
  handleDelete,
  handleSaveEdit,
}) => {
  const ref = React.useRef(null);

  // Hook to handle drag behavior
  const [, drag] = useDrag({
    type: "polaroid",
    item: { index },
  });

  // Hook to handle drop behavior
  const [, drop] = useDrop({
    accept: "polaroid",
    hover: (item) => {
      if (item.index !== index) {
        movePolaroid(item.index, index);
        item.index = index; // Update the dragged item’s index
      }
    },
  });

  drag(drop(ref)); // Attach drag and drop behavior to the element

  return (
    <div ref={ref} className="polaroid">
      <div className="icon-group">
        <FaTrashAlt
          className="icon delete-btn"
          onClick={() => handleDelete(polaroid._id)}
        />
      </div>
      <div className="polaroid-image-wrapper">
        <img
          src={`http://localhost:5000${polaroid.image}`}
          alt={polaroid.caption}
        />
      </div>
      <div className="polaroid-info">
        <p
          className="caption"
          contentEditable
          suppressContentEditableWarning={true}
          onBlur={(e) =>
            handleSaveEdit(polaroid._id, e.target.innerText, polaroid.date)
          }
        >
          {polaroid.caption}
        </p>
        <p
          className="date"
          contentEditable
          suppressContentEditableWarning={true}
          onBlur={(e) =>
            handleSaveEdit(polaroid._id, polaroid.caption, e.target.innerText)
          }
        >
          {polaroid.date}
        </p>
      </div>
    </div>
  );
};

export default App;
