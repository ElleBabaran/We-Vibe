import { useState } from 'react';
import "./App.css";

export default function Homepage() {
  const slidingimage = [
    "/Banner/Bt90s.jpg",
    "/Banner/illit.jpg",
    "/Banner/Njz.jpg",
    "/Banner/nelly.jpg",
    "/Banner/katseye.jpg",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSl = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === slidingimage.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSl = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? slidingimage.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className="slider">
      {slidingimage.map((img, index) => (
        <img
          key={index}
          src={img}
          alt="slider"
          className={index === currentIndex ? "active" : "blurred"}
        />
      ))}
      <button onClick={prevSl} className="btn">⬅️</button>
      <button onClick={nextSl} className="btn">➡️</button>
    </div>
  );
}
